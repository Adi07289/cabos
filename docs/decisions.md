# CabOS: Architecture Decision Records

Format: each ADR has **Context → Decision → Consequences**. The status is *Accepted* unless marked otherwise. Where an ADR departs from `docs/brief.md`, it says **Deviation** and explains why. New ADRs are appended and never renumbered.

---

## ADR-001 Monorepo with a shared pure-Python domain core
**Context.** The brief puts the safety state machines in `services/edge-sim` and the derived metrics and ML in `services/api`. Both services need the same interval maths, seatbelt state machine and proximity scoring: the edge runs them live, and the API re-runs them for replay, import and tests. Two copies would drift apart.
**Decision (Deviation: adds one package).** Add `packages/cabos-core`, a pure-Python library with no I/O, no DB and no network. It holds the contracts (Pydantic), the interval derivation, the rules, the state machines, proximity scoring, the conditions engine, the idle classifier, the hypothesis tests and the forecast maths. `services/api` and `services/edge-sim` import it. A Python `uv` workspace sits alongside a `pnpm` workspace, and the `Makefile` drives both.
**Consequences.** Safety logic has one implementation, tested once with table-driven tests. `mypy --strict` runs on `cabos-core`. The services are thin adapters for I/O, the bus and persistence.

## ADR-002 Pydantic is the source of truth for contracts
**Context.** The brief suggests "JSON Schema → TS + Pydantic". The domain logic is in Python, so writing hand-authored JSON Schema and generating Python from it adds a toolchain step and loses validators.
**Decision (Deviation: reverses the generation direction).** Event and API models are Pydantic v2 classes in `cabos_core.contracts`. `make contracts` exports JSON Schema to `packages/contracts/schema/*.json` and generates TypeScript with `json-schema-to-typescript` (events) and `openapi-typescript` (REST, from FastAPI's OpenAPI). The generated files are committed, and a CI and test step fails if they are stale.
**Consequences.** There is one typed definition and validators run at the Python boundary. The web gets exact types with no hand-written DTOs. The TS side validates WS frames with a small generated Zod layer (`zod` from JSON Schema), so a malformed frame cannot reach the store.

## ADR-003 Edge simulator runs in-process by default and out-of-process with MQTT
**Context.** "`make dev` works with or without Docker" and "the demo can never break" both argue against needing a broker. The brief also asks for an MQTT adapter to show the scalability path.
**Decision.** `EventBus` is a protocol with two adapters: `InProcessBus` (asyncio fan-out, the default) and `MqttBus` (`USE_MQTT=true`, Mosquitto in docker-compose, topics `cabos/{site}/{machine}/{event_type}`). With the in-process bus, the API process starts the edge-sim as a supervised asyncio task (`EDGE_MODE=inprocess`). With MQTT, `services/edge-sim` runs as its own process.
**Consequences.** The zero-dependency demo path has no network hops and meets the 300 ms safety budget easily. The code path for events is identical in both modes because services only see `EventBus`.

## ADR-004 Injectable clock, deterministic seeds, date-anchored demo
**Context.** The state machines depend on time (10 s grace, 30 s alarm, 60 s escalate), the demo compresses time, and tests must be exact. "Today's shift" must also look like today while staying identical on every run.
**Decision.** All core logic takes `now: datetime` (UTC) as an argument and never calls `datetime.now()`. Runtime uses a `Clock` protocol with `WallClock` and `SimClock(speed=k)`. A lint test greps `cabos_core` for `datetime.now`, `time.time` and `random.` without a seed. The generator and simulator use `numpy.random.Generator(PCG64(seed))`. Seeded content is stored as **offsets from an anchor**, and the anchor is set to today's site-local date at seed time. The same seed always produces the same content relative to the anchor.
**Consequences.** State-machine tests are pure tables of `(state, inputs, t) → (state', events)`. The demo is byte-identical apart from absolute dates.

## ADR-005 Telemetry interval semantics and coverage-based gap detection
**Context.** Only `engine_hours` is cumulative. The Section 3 figures reproduce exactly (verified in Phase 0: 0.705, 1.90, 222 engine-min, 1140 wall-min) only if `fuel_used_l`, `load_cycles` and `idling_time_min` are **per-interval amounts since the previous report**. A wall-clock gap alone is not a data problem: 05-01 14:00 → 05-02 09:00 is overnight.
**Decision.**
- Each row closes an interval that starts at the previous row for the same `machine_id`. The first row per machine is an **open interval**: only window-free metrics (fuel/cycle) are computed, and window-based ratios are `null` with reason `no_prior_row`.
- `engine_min = Δengine_hours × 60`, `wall_min = Δtimestamp`, `idle_ratio = idle_min / engine_min`, `fuel_per_cycle = fuel / cycles` (null when cycles = 0, with the `zero_cycles` flag), `fuel_rate_l_per_h = fuel / (engine_min / 60)`, `cycles_per_engine_hour`, `utilisation = engine_min / wall_min`.
- **Coverage ratio** = `(idle_min + cycles × median_work_min_per_cycle) / engine_min`, where `median_work_min_per_cycle` is learned per machine (ADR-019). **Telemetry gap** is flagged when `coverage < 0.5` **or** `fuel_rate < p05 fleet fuel rate` (the prior is used below min-n). On the sample, coverage is 1.00, 1.28 and **0.32**, so only 05-02 09:00 is flagged, with a fuel rate of 0.54 L/h as the second piece of evidence.
- `engine_min > wall_min + tolerance` is a **clock/data error**. A negative Δengine_hours is an **engine-hour reset**: the interval is quarantined as `reset` and a new baseline starts.
- Flagged intervals are kept but marked `quality = degraded`. KPIs computed from them show "stale / partial" and never feed the operator's score.
**Consequences.** The ingestion layer surfaces coverage problems instead of computing confident but wrong KPIs, and the pytest fixture assertions in §14 follow directly.

## ADR-006 MAPE is defined against actuals
**Context.** The brief's "naive MAPE ≈ 16.3%" divides by the **estimate**. Standard MAPE divides by the **actual**, which gives **13.2%** on the sample (verified).
**Decision.** Model selection uses standard MAPE, `mean(|pred − actual| / actual)`. The model card also reports "planner deviation relative to estimate" (16.3% on the sample) so the brief's number stays traceable. Median APE and the P90 coverage are reported alongside, because MAPE is unstable on short tasks.
**Consequences.** The documents and UI give a precise definition wherever MAPE appears.

## ADR-007 Core schema vs extended schema (the task table cannot be linked in the organiser format)
**Context.** The organiser's task table has **no `operator_id`, `machine_id`, `site_id` or timestamp**. Three brief requirements are therefore impossible on organiser-format data: grouped CV by operator, the engineered features (shift hour, hours on shift, operator discretionary-idle ratio, temperature, precipitation, wind), and linking tasks to telemetry.
**Decision.** Define two tiers in the schema contract:
- **Core** (the organiser's columns, required): everything must work on it.
- **Extended** (optional and recognised by the fuzzy mapper): `operator_id`, `machine_id`, `site_id`, `started_at`, `ended_at`, `temperature_c`, `precip_mm`, `wind_kmh`, `shift_hour`, `hours_on_shift`.
CabOS-native tasks (today's plan, tasks completed in the app, the synthetic generator with `--extended`) always carry the extended fields. Features that are missing are **dropped from the model** rather than imputed, and the model card lists which feature groups were available. Grouped CV uses `operator_id` when present, otherwise `GroupKFold` on `task_type` (a stricter test of generalisation). The card states which was used.
**Consequences.** The Operator State Graph is fully linked for native data and degrades gracefully for organiser-format uploads. Data Studio's profile tells the judge exactly which capabilities their file unlocks.

## ADR-008 Priors instead of synthetic augmentation rows
**Context.** The brief suggests augmenting small task histories with labelled synthetic rows whose weight decays. Synthetic rows in a training set blur "what the data says", and their weight schedule is an arbitrary extra hyperparameter.
**Decision (Deviation).** For small data the champion is **ridge regression shrunk toward prior coefficients**: `min ‖y − Xβ‖² + λ‖β − β₀‖²`. `β₀` comes from a versioned `priors.yaml` (for example log-multipliers rainy +0.12, beginner +0.25, windy +0.10, family effects), and onboarding calibration can personalise the skill prior. This is equivalent to Gaussian-prior MAP estimation. The prior's influence falls off automatically as n grows, because data terms scale with n and λ stays fixed. The model card shows **effective prior weight**, λ / (λ + n·σ²_x), per coefficient. No synthetic rows are ever mixed into real training data. The synthetic generator is used only for tests and demo datasets, and always labelled as such.
**Consequences.** "Honest mode" reads: *"5 real rows. Rain effect is 71% prior, 29% data."* That is more truthful than a synthetic-row count and uses one fewer mechanism.

## ADR-009 Hierarchical categorical encoding for unseen categories
**Decision.** Encode `task_type` as **family one-hot plus type one-hot**, both ridge-penalised. Ridge pools each type's effect toward its family effect. An unseen type gets a zero type contribution, so its prediction automatically falls back to the family effect, then to the fleet intercept for an unknown family (from `task_families.yaml`, with keyword rules such as `excavat|trench|dig → earthmoving`). Unseen weather values are normalised (`rain`, `Rainy`, `showers` → `rainy`); a genuinely new value gets a zero effect. Any fallback sets `confidence = low` with a list of reasons, and the P90 uses the low-confidence conformal stratum (ADR-010).
**Consequences.** New categories never raise an exception, and the fallback chain comes from one maths model rather than an if-else ladder.

## ADR-010 Conformal strategy that is data-size-aware
**Decision.** The target is the log ratio. P50 = `estimate × exp(ŷ)` (the log-normal median). P90 is **one-sided**: `estimate × exp(ŷ + q̂₀.₉)`, where `q̂` is the conformal quantile of the residuals.
- n ≥ 1,000: **split conformal** with a 20% calibration split.
- 30 ≤ n < 1,000: **CV+** (Barber et al. 2021) with the same folds used for model selection, so no data is wasted.
- n < 30: the interval comes from the prior residual scale in `priors.yaml`, labelled **"uncalibrated (n = 5)"** in the UI.
- **Mondrian** strata: normal confidence vs low confidence (unseen categories), each with its own quantile when n per stratum ≥ 30.
The acceptance test on 10k generated tasks checks holdout empirical coverage in [0.85, 0.95].

## ADR-011 HistGradientBoosting as the challenger; the waterfall always comes from the linear explainer
**Context.** LightGBM needs a native libomp on macOS, a common install failure on judges' laptops. SHAP adds heavy dependencies.
**Decision (Deviation).** The challenger is `sklearn.ensemble.HistGradientBoostingRegressor` with native categorical support. The factor waterfall always decomposes the **ridge** model's log-additive contributions, which are exact and order-independent. If HGB is the champion, the waterfall adds a final bar, **"Pattern model adjustment ±x%"**, equal to `ŷ_hgb − ŷ_ridge`. Explanations stay exact and the stronger model still sets the numbers.
**Consequences.** There is no native build dependency and no approximate attributions.

## ADR-012 High-frequency signals: ring buffer plus downsampling, not raw persistence
**Decision.** 1 Hz signals live in a per-machine in-memory **ring buffer of 600 s** at the edge. The **black box** is the last 120 s, frozen into `incidents.blackbox` (JSON, gzip) when an incident or ESCALATED event occurs. `telemetry_signals` persists **10 s aggregates** (min, max, mean, last per channel) for charts and Pulse unsafe-pattern features. Raw 1 Hz is written only during the 120 s around safety events (`signal_captures`).
**Consequences.** At 10k machines, raw 1 Hz is about 864 M rows per day. The chosen design persists roughly 86 M aggregate rows per day (10 s windows), which a Timescale hypertable with compression handles comfortably. The black box stays complete.

## ADR-013 Styling and brand
**Decision.** Use Tailwind CSS v4 with CSS-first `@theme` tokens: one source for CSS variables and utilities. shadcn/ui primitives are copied in and restyled. **Signal Yellow = `#EDE33B`** (hue about 57°, a cooler citrine safety yellow). It is deliberately distinct from Caterpillar's warm gold (about 48°), and there is no Cat trade dress: no yellow-black diagonal hazard chrome and no "CAT" wordmark. The accent means **"act here / primary"** and is **never** used for semantic state; caution is a separate amber (`#FFB020`). Charts use visx (bespoke radar, waterfall and timeline), not Recharts.

## ADR-014 Demo-grade identity, production-grade authorisation
**Decision.** Users are seeded (operator, supervisor, trainer, admin). Onboarding "identity" (badge QR, code or picker) issues a server-signed session cookie (`itsdangerous`, HttpOnly, SameSite=Lax, 12 h). **RBAC and row scoping are enforced server-side on every endpoint and WS channel** through one `authorize(principal, action, resource)` policy function with its own tests. No passwords. The README states that this is demo identity and that production would use site SSO (OIDC).

## ADR-015 Networking between web and API
**Decision.** Next.js `rewrites` proxy `/api/v1/*` to FastAPI, so the app is same-origin and the cookie is simple. WebSockets connect **directly** to the API origin (`NEXT_PUBLIC_WS_URL`), because Next's dev rewrite does not proxy WS reliably. CORS and the WS origin allowlist are limited to the web origin. The WS authenticates with a short-lived ticket from `POST /api/v1/ws-ticket`, because cookies across ports are unreliable.

## ADR-016 Offline and PWA
**Decision.** Use **Serwist** (the maintained successor to next-pwa) for the service worker. The offline queue uses IndexedDB through `idb`. Every mutation carries an `Idempotency-Key` (UUIDv7) and the server stores `(key → response)` for 72 h. The queue drains in FIFO order with exponential backoff and shows a "3 items waiting to sync" chip. Near-miss logging, walkaround results and debrief acknowledgements are the offline-capable mutations.

## ADR-017 Language layer contained by schemas
**Decision.** The `LLMProvider` protocol has `AnthropicProvider` (default model `claude-sonnet-5`), `GeminiProvider` and `TemplateProvider`, selected by the keys present. Every LLM call has (a) a **4 s timeout**, (b) a **Pydantic output schema** (the result is validated; on failure, the template is used), (c) a deterministic **template twin** that produces the same shape. **Intent routing for Copilot is deterministic** (keyword and regex grammar over about 12 intents such as `why_late(task)`, `log_near_miss`, `next_task`, `idle_today`). The LLM only phrases answers from a data payload the router already fetched and never gets tool access to mutate state. Nothing in `cabos_core.safety` imports the language layer, and an import-linter contract enforces this.

## ADR-018 Persistence
**Decision.** SQLAlchemy 2 + SQLModel + Alembic. **SQLite (WAL mode) when `DATABASE_URL` is unset**, and PostgreSQL 16 through docker-compose otherwise. `USE_TIMESCALE=true` turns `telemetry_intervals`, `telemetry_signals` and `events` into hypertables in a guarded migration. Bulk import uses `COPY` on Postgres and `executemany` in a single transaction on SQLite. Portable types only: JSON (not JSONB-specific operators in the ORM), and UUIDs stored as `CHAR(36)` on SQLite.

## ADR-019 Learned thresholds with a minimum n and shrinkage
**Context.** "Learned thresholds, not magic numbers", but the sample has **three** closed intervals. A percentile of three numbers is noise.
**Decision.** Each threshold `θ` has a config prior `θ₀` and a learned estimate `θ̂` from the data (percentile, or median/MAD). Scopes are tried in order: per operator or machine (n ≥ 30), then fleet (n ≥ 30), then the prior. Between these, `θ = (n·θ̂ + k·θ₀)/(n + k)` with `k = 30`. Every threshold is stored in `thresholds` with `(scope, n, source, value)` and shown on hover or tap ("Excessive idle: > 41 min per interval · learned from 2,114 intervals, fleet").
**Consequences.** It is honest on tiny data and adaptive on large data, and supervisors can override thresholds per site with an audit trail.

## ADR-020 Versioned datasets with an atomic switch
**Decision.** Every import creates a `datasets` row. Raw and derived rows (`telemetry_intervals`, `task_history`, `anomalies`, `thresholds`, `model_registry`) carry a `dataset_id`. The **active dataset** is a pointer per site. The one-click flow (import → derive → retrain → baselines) runs as a background job against the new dataset_id, then flips the pointer in one transaction and emits `dataset.activated`. Every query-key namespace in the web includes `datasetId`, so all dashboards refetch. "Demo site" (the sample plus the seeded synthetic set) is always selectable.
**Consequences.** A failed import never corrupts the live demo, and rollback is a pointer flip.

## ADR-021 Safety authority and fail-loud link state
**Decision.** The edge (edge-sim) is authoritative for safety state. The cab UI **renders** that state and never computes it. The WS sends a heartbeat every 1 s. If none arrives for more than 2.5 s, Cab Mode shows a persistent red **"Guardian link lost: machine alarms still active"** banner and stops presenting safety state as current (it greys out with an age stamp). The copy notes that in-cab audible alarms on a real machine do not depend on the tablet.
**Consequences.** A dropped connection is never silently treated as "all clear".

## ADR-022 Idle classification varies with data resolution
**Decision.** With 1 Hz signals and site context (native or sim), idle segments are classified as warm-up (the first `N_warm` min after engine start, learned or prior 5 min), cool-down (the last `N_cool` min before shutdown, prior 3 min), **waiting** (a haul truck is pending or queued according to the site-context stream) or **discretionary**. With interval-only data (organiser format), the split is **estimated**: discretionary = idle − allowances for engine starts detected in the interval, and the waiting share is "unknown". The operator score uses discretionary idle only, labelled *estimated* when that is the case. Waiting idle is shown as a site or process cost (dispatch), not an operator cost.

## ADR-023 Time and timezones
**Decision.** Store UTC everywhere. Each site has an IANA `timezone` (default `Asia/Kolkata`). Naive timestamps in imports are interpreted in the **import-selected site timezone** (Data Studio asks and defaults to the site's zone). Accepted formats include ISO 8601, `YYYY-MM-DD HH:MM[:SS]`, `DD/MM/YYYY HH:MM`, `MM/DD/YYYY` when disambiguated by the column (the parser tests both and picks the one with zero out-of-range and monotone per-machine ordering), and epoch s/ms. The display layer always formats in site-local time. The "shift day" for night shifts is the shift's **start** date.

## ADR-024 Hypotheses as a first-class, re-testable engine
**Decision.** `cabos_core.hypotheses` defines H1–H8, each a function `(dataset) → HypothesisResult{statement, estimate, ci95, n, strength, verdict: supported|contradicted|inconclusive}`:
H1 unfastened intervals have higher idle ratio · H2 the legacy alert column equals the seatbelt signal (agreement %) · H3 fuel-per-cycle multiple when unfastened · H4 planner underestimates (mean log ratio > 0) · H5 skill effect on the ratio · H6 weather effect on the ratio · H7 skill×weather confounding (Cramér's V) · H8 machine age effect on the ratio.
CIs come from a seeded bootstrap (2,000 resamples). Strength: `insufficient` (n < 10), `weak`, `moderate` or `strong`, by CI width relative to the effect and by n. On the 5-row sample, most are "inconclusive, n = 5". The UI says so plainly, which is the point.

## ADR-025 Proximity and radar computation location
**Decision.** Proximity risk runs at the edge at **10 Hz** (UWB tags update much faster than belt signals). Level changes are events, and positions stream to the radar at 10 Hz over a separate high-rate WS channel (`radar.{machine_id}`) that is never persisted. Level transitions use **hysteresis**: upgrades are immediate, and a downgrade needs 2 s continuously below the lower threshold.

## ADR-026 Process note: brainstorming gate skipped by instruction
The brief (rule 7) explicitly asks to decide rather than ask. Open questions are resolved here as ADRs instead of an interactive design Q&A. The single human checkpoint is the `GO` after Phase 0.
