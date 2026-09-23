# CabOS: Team Task Split (4 members)

> Source of truth for *what* to build: `docs/architecture.md`, `docs/design.md`, `docs/build-plan.md`, `docs/decisions.md` (ADRs).
> This file says **who builds what, in what order, and how the pieces join**.
> Put names next to the roles in the table below.

## Roles: each member owns a vertical slice (backend + UI)

Ownership is by **slice**, not by layer, so each person can finish a feature end to end without waiting on a separate "frontend person". Each slice lines up with a different `cabos-core` module and a different set of routes, which keeps merge conflicts rare.

| Role | Member | Owns (code) | Owns (routes / UI) |
|---|---|---|---|
| **M1 Platform & Data** | _name_ | monorepo, CI, `services/api` shell, DB + Alembic, EventBus, WS gateway, event store, `cabos_core.mapping`, import pipeline, auth/RBAC | `/studio` (Data Studio), `/command/*` console shell, `/director` UI |
| **M2 Intelligence (ML)** | _name_ | `cabos_core.intervals`, `hypotheses`, `pulse`, `forecast`, synthetic generator, model registry, Copilot backend + `LLMProvider` | `/cab/me` (My Pulse), task detail + factor waterfall, `/command/model`, `/command/plan`, `/command/anomalies`, hypothesis cards |
| **M3 Safety & Simulation** | _name_ | `services/edge-sim`, `cabos_core.safety` (seatbelt, proximity, conditions, fatigue), weather service, incidents backend, Director scenario handlers | `/cab/guardian` (radar, belt panel), alert banner + safety overlay, near-miss sheet, `/command/incidents`, swing simulator |
| **M4 Experience & Design** | _name_ | design tokens, themes, primitives, fonts, sound/haptics kit, i18n, offline outbox (IndexedDB), realtime client store | `/design`, `/onboarding/*`, `/cab` Shift Deck + CabShell, `/cab/academy/*`, `/trainer`, landing `/`, `/cab/debrief` |

**Also owns academy backend:** M4 (recommendations, progress, bookings, Skill Passport), because it is mostly UI-driven. M2 supplies the "anomaly → skill node" mapping.

---

## Working agreement

1. **Branches:** `feat/<role>-<short-name>` (e.g. `feat/m3-seatbelt-sm`). No direct pushes to `main`.
2. **PRs:** at least one approval from another member, and CI green (`make check`). Keep PRs under about 400 lines where possible.
3. **Contracts first:** event and API shapes live in `cabos_core.contracts` (ADR-002). Any change to a contract needs a PR tagged `contract` and an approval from its **consumer** as well.
4. **Mocks are allowed only behind the contract** during parallel work (a fixture JSON matching the schema). They must be deleted before the phase ends. Nothing fake ships (brief rule 4).
5. **Commits:** conventional commits (`feat(pulse): …`, `fix(edge-sim): …`).
6. **Daily sync (10 min):** yesterday / today / blocked-on-whom. Update the checkboxes here in the same PR as the work.
7. **Decisions:** anything that deviates from the docs gets a new ADR appended to `docs/decisions.md` in the same PR.

---

## Phase 0: Kick-off (everyone, first half-day)

- [ ] **ALL** Read `docs/brief.md`, then `docs/decisions.md`, then the parts of `architecture.md` and `design.md` for your slice
- [ ] **ALL** Install toolchain: Python 3.12 + `uv`, Node 22 + `pnpm`, (optional) Docker
- [ ] **ALL** Contract freeze meeting (1 h): walk through the event catalogue (architecture §4) and the API table (§6.2); each owner confirms the payloads they produce and consume
- [ ] **M1** Create the GitHub project board mirroring this file; add branch protection on `main`

---

## Phase 1: Foundation *(blocks everyone; M1 + M4 lead)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P1-01 | M1 | Monorepo: `uv` workspace + `pnpm` workspace, Makefile (`dev`, `check`, `test`, `seed`, `contracts`), pre-commit, ruff/mypy/eslint/prettier configs | — | `make check` runs on an empty skeleton |
| P1-02 | M1 | GitHub Actions CI (py + web jobs, PG service container) | P1-01 | CI green on PR |
| P1-03 | M1 | FastAPI shell: settings, `/health` `/ready`, problem+json errors, SQLite/PG engine factory, Alembic baseline | P1-01 | `curl /api/v1/health` ok on SQLite and PG |
| P1-04 | M2 | `cabos-core` skeleton, `Clock` protocol (`WallClock`, `SimClock`), seeded RNG helper, determinism grep test (ADR-004) | P1-01 | test fails if `datetime.now` appears in core |
| P1-05 | M4 | Next.js app (TS strict), Tailwind v4 `@theme` tokens exactly per design §2, `next/font` (Geist, Geist Mono, Barlow Condensed, Instrument Serif, Noto Devanagari) | P1-01 | tokens render |
| P1-06 | M4 | ThemeController (Cab Night / Cab Daylight / Office / Office Dark), sunrise/sunset calc, density + glove attributes | P1-05 | switch works, test vs NOAA fixtures |
| P1-07 | M4 | Primitives (restyled shadcn/Radix), Motion presets, Web Audio sound kit, haptics helper, next-intl (en/hi/ta scaffolding) | P1-05 | all visible on `/design` |
| P1-08 | M4 | `/design` living style guide + `tokens.contrast.test.ts` | P1-07 | every documented contrast pair passes |
| P1-09 | M3 | `services/edge-sim` package skeleton + `config/safety.yaml` with the timings from architecture §7.1/§7.2 | P1-04 | imports core, runs a no-op loop |
| P1-10 | M2 | `config/priors.yaml`, `task_families.yaml`, `synonyms.yaml` first drafts | — | reviewed by M1 (synonyms) and M3 (families for safety limits) |

**Phase gate:** `make dev` from a clean clone serves `/design`; CI green. Commit `feat(p1): foundation`.

---

## Phase 2: Data spine *(M1 + M2 critical path)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P2-01 | M1 | `cabos_core.contracts` (events + DTOs) → `make contracts` → `packages/contracts` (JSON Schema, TS, zod) + staleness test | P1-04 | TS types importable in web |
| P2-02 | M1 | DB schema per architecture §5 + migrations; SQLite/PG parity test | P1-03 | all tables migrate both ways |
| P2-03 | M2 | `cabos_core.intervals` (ADR-005): deltas, open first interval, coverage ratio, gap / clock-error / reset flags | P1-04 | **fixture test: 0.705, 1.90, gap only at 05-02 09:00** |
| P2-04 | M2 | `cabos_core.hypotheses` H1–H8 with seeded bootstrap (ADR-024) | P2-03 | sample: H2 = 100% (n = 4), others "insufficient" |
| P2-05 | M2 | Synthetic generator `data/synthetic/generate.py` (`--machines --operators --days --tasks --extended --messy`, known ground truth) | P1-04 | 50k messy rows generated in < 10 s, deterministic |
| P2-06 | M1 | `cabos_core.mapping`: header normaliser, synonyms, value-shape scoring, Hungarian assignment, multi-format timestamps, category normalisers | P1-10 | 30 header variants map correctly |
| P2-07 | M1 | Import pipeline: sniff → map → validate V1–V14 → quarantine → bulk load → derive → activate (ADR-020) + background job + WS progress + `data/incoming/` watcher | P2-02, P2-03, P2-06 | **50k messy import test passes within budget** |
| P2-08 | M1 | EventBus (in-proc + MQTT adapter), event store writer + projections, WS gateway (tickets, channels, snapshot + resume, 1 s heartbeat) | P2-01 | WS client receives snapshot + events |
| P2-09 | M3 | edge-sim replay → 1 Hz synthesis consistent with interval totals, site context (trucks, UWB workers), 600 s ring buffers, 10 s aggregates, publishing on the bus | P2-08, P2-03 | frames visible over WS at 1 Hz |
| P2-10 | M1 + M4 | Seed: org, 2 sites, operators, machines + specs, date-anchored shift, 15 modules (M4 writes content), instructor slots, historical incidents (M3 supplies) | P2-02, P2-05 | `make seed` idempotent |
| P2-11 | M1 | `/studio` UI: DropZone, MappingTable, ValidationReport, QuarantineTable, progress, DatasetSwitcher | P2-07, P1-07 | Playwright: renamed-header upload → activated |
| P2-12 | M2 | Data profile API + HypothesisCard + UnlockedCapabilities in Studio | P2-04, P2-11 | profile shows H1–H8 with n and strength |
| P2-13 | M4 | Realtime client: single WS, zod-validated frames, normalised Zustand store, link state | P2-01, P2-08 | store updates from live frames |
| P2-14 | M1 | `test_no_sample_ids` grep test | — | passes |

**Phase gate:** upload provided CSVs + a messy file through `/studio`; live frames stream. Commit `feat(p2): data spine`.

---

## Phase 3: Onboarding + Shift Deck *(M4 critical path)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P3-01 | M1 | Session + `authorize()` RBAC policy + matrix test per cell (architecture §10) | P2-02 | every cell tested |
| P3-02 | M1 | Idempotency-Key middleware + `idempotency_keys` table | P2-02 | replay returns stored response |
| P3-03 | M4 | Offline outbox (IndexedDB via `idb`): enqueue, FIFO drain, backoff, chip | P3-02 | Vitest: enqueue/drain/backoff/dedup |
| P3-04 | M4 | `/onboarding` steps 0–7 (QR via BarcodeDetector + zxing fallback, code, picker; machine card flip; calibration; cab setup; walkaround + photo; seatbelt handshake) + "Explore demo site" | P3-01, P2-13 | **Playwright happy path < 90 s** |
| P3-05 | M1 | Shift lifecycle API (architecture §7.4) + walkaround + swap endpoints | P3-01 | 409 when walkaround missing |
| P3-06 | M2 | Forecast v1: ridge-to-prior on active dataset (ADR-008/009), `POST /forecast/predict`, task P50/P90 persisted | P2-03 | predicts for unseen task type without error |
| P3-07 | M3 | Weather service: Open-Meteo + cache + climatology fallback; `GET /conditions/current` | P2-02 | works offline via climatology |
| P3-08 | M4 | `/cab` Shift Deck: CabShell, KPI row (+ stale state), TaskTimeline (P50 bar / P90 whisker / progress / overrun chip), ConditionsStrip, debrief (template) | P3-05, P3-06, P3-07 | all numbers from API/WS |
| P3-09 | M2 | Shift KPIs endpoint (idle %, fuel, cycles/h, CO₂ 2.68 kg/L, safety score v0) | P2-03 | matches hand calc on fixture |

**Phase gate:** judge path "Explore demo site" → Shift Deck populated. Commit `feat(p3): onboarding and shift deck`.

---

## Phase 4: Guardian *(M3 critical path)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P4-01 | M3 | `cabos_core.safety.seatbelt` state machine (architecture §7.1) | P1-04 | **table-driven test: every transition, flapping 6 vs 7, grace 9.99 vs 10.00, lockout, unattended, bypass** |
| P4-02 | M3 | `proximity` (zones × multipliers, TTC, travel ellipse, hysteresis) at 10 Hz + `radar.*` channel | P2-09 | band / multiplier / hysteresis tests |
| P4-03 | M3 | `conditions` (heat index, wind/rain limits, darkness) + `fatigue` timer | P3-07 | limits change with weather |
| P4-04 | M3 | Wire SMs into edge-sim runtime; sensor-health detection; black-box freeze | P4-01, P4-02 | events on bus |
| P4-05 | M4 | Safety layer in CabShell: AlertBanner escalation, SafetyOverlay, LinkLostBanner (ADR-021), sound + haptics | P2-13 | **Vitest `alertReducer`** |
| P4-06 | M3 | `/cab/guardian`: radar canvas (rAF, no React per frame), belt SM panel, limits, sensor health | P4-02, P4-05 | radar at 60 fps |
| P4-07 | M3 | Incidents backend: create (idempotent), lifecycle + audit log, template structuring | P3-02 | lifecycle tests |
| P4-08 | M3 + M4 | Near-miss hold-to-log button (M4) + IncidentComposer with voice/text + black-box preview (M3) | P4-07, P3-03 | works offline |
| P4-09 | M1 | Test-only Director endpoint for scenario 3 (`DEMO_MODE`) | P2-08 | — |
| P4-10 | M3 | **Playwright: "worker enters swing zone" → Danger within 1 s** | P4-06, P4-09 | passes in CI |

**Phase gate:** belt + proximity alerts escalate live. Commit `feat(p4): guardian`.

---

## Phase 5: Pulse + Forecast *(M2 critical path)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P5-01 | M2 | Learned thresholds with min-n shrinkage (ADR-019) + `thresholds` table + provenance | P2-03 | provenance on every threshold |
| P5-02 | M2 | Pulse layer 1 rules R1–R6, layer 2 robust-z + IsolationForest | P5-01 | fixture + synthetic tests |
| P5-03 | M2 | Layer 3 episodes E1–E3 + idle classifier (ADR-022) + unsafe patterns U1–U5 | P5-02, P4-04 | recall ≥ 0.9 on injected episodes |
| P5-04 | M2 | Safety score (attributable only, 7-day decay) | P5-03 | waiting idle excluded (test) |
| P5-05 | M2 | Forecast v2: HGB challenger, grouped CV selection, CV+/split conformal with Mondrian strata, waterfall (ADR-010/011), model registry + retrain job | P3-06 | **10k tasks: MAPE < planner, P90 coverage 0.85–0.95, unseen → low confidence** |
| P5-06 | M2 | Live re-forecast on `weather.updated` / swaps → `forecast.updated` | P5-05, P3-07 | re-forecast < 1 s |
| P5-07 | M2 | `/cab/me` My Pulse + task detail FactorWaterfall (shared-element from task card, M4 reviews motion) | P5-03, P5-05 | evidence + provenance visible |
| P5-08 | M3 | Director scenarios 2 (rain), 5 (truck delayed), 6 (gap), 7 (flapping), 8 (heat), 9 (beginner) handlers | P5-06 | each produces its cascade |

**Phase gate:** rain and beginner scenarios re-forecast visibly. Commit `feat(p5): pulse and forecast`.

---

## Phase 6: Academy *(M4 lead)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P6-01 | M2 | Anomaly/incident → skill node mapping table | P5-03 | mapping test |
| P6-02 | M4 | Recommendation engine + `because` chips + `training.recommended` | P6-01 | scenario 4 cascades to a recommendation |
| P6-03 | M4 | Micro-lesson card stacks + scenario drills (content for 15 modules) | P2-10 | complete flow saves progress |
| P6-04 | M4 | Skill Passport (telemetry-verified streaks, XP, crew challenges) + verify loop (7-day before/after with n) | P6-02, P5-02 | delta computation tested |
| P6-05 | M4 | Instructor booking (slots, unique booking index) | P2-10 | concurrent booking → one 409 |
| P6-06 | M3 | Swing simulator (canvas, joystick + keyboard, shared proximity params + parity test) *(first to cut)* | P4-02 | Vitest scoring |

Commit `feat(p6): academy`.

---

## Phase 7: Command *(M1 lead)*

| ID | Owner | Task | Depends on | Done when |
|---|---|---|---|---|
| P7-01 | M1 | CommandShell (side nav, site switcher, dataset badge, ⌘K) + overview: live alert feed, fleet grid | P2-08 | live updates |
| P7-02 | M3 | `/command/incidents` board + detail (black-box player, audit timeline, transitions, optimistic concurrency) | P4-07 | 409 on concurrent edit |
| P7-03 | M2 | `/command/anomalies` inbox, `/command/plan`, `/command/model` (honest mode, retrain), `/command/thresholds` (audited overrides) | P5-05 | RBAC scoped |
| P7-04 | M1 | Sustainability ledger (idle L → ₹ → kg CO₂; waiting vs discretionary) | P5-04 | arithmetic tests |
| P7-05 | M4 | Coaching cards + `/trainer` (curriculum, slots, evidence) | P6-04 | — |

Commit `feat(p7): command`.

---

## Phase 8: Landing + polish *(everyone)*

| ID | Owner | Task |
|---|---|---|
| P8-01 | M4 | Landing `/`: kinetic hero, live telemetry line, sticky "One machine. Five minds.", bento of live mini-widgets, tickers, magnetic CTA, grain, Lenis |
| P8-02 | M1 | Full Scenario Director UI: 10 buttons, cascade log by `correlation_id`, clock speed, `D` hotkey |
| P8-03 | M2 | Copilot: push-to-talk, deterministic intent router, Anthropic / Gemini / template providers, 4 s timeout, schema-validated output; LLM incident structuring + debrief |
| P8-04 | M3 | import-linter contract "safety never imports language"; latency measurement (signal → paint p95) |
| P8-05 | M4 | Hindi pass for all `cab.*` strings; accessibility pass (axe in Playwright, zero serious) |
| P8-06 | M1 | Lighthouse CI ≥ 90 on `/` and `/cab`; `/design` visual regression |
| P8-07 | ALL | README with real screenshots/GIFs; `docs/demo-script.md` (3 min, brief §15); two full demo rehearsals on a clean clone, one of them offline |

Commit `feat(p8): landing and polish`.

---

## Critical path and parallelism

```
P1 (M1+M4) ─► P2 contracts+bus (M1) ─┬─► P2 import + Studio (M1) ───────────────► P7 Command (M1)
                                     ├─► P2 intervals/hypotheses (M2) ─► P3 forecast v1 ─► P5 Pulse+Forecast (M2)
                                     ├─► P2 edge-sim (M3) ─► P4 Guardian (M3) ─────────────► P5 scenarios (M3)
                                     └─► P2 realtime store (M4) ─► P3 onboarding + deck (M4) ─► P6 Academy (M4)
                                                                                            └──► P8 all
```

- **Days 1–2:** P1 together; M2 and M3 can start `cabos-core` modules (intervals, seatbelt SM) as pure Python right away with no dependency on the API.
- **Busiest integration points:** the contracts (P2-01), the WS gateway (P2-08) and the realtime store (P2-13). Pair on these.
- **If time runs short, cut in this order:** swing simulator (P6-06) → instructor booking (P6-05) → Hindi strings (part of P8-05) → fleet grid (part of P7-01).
- **Never cut:** onboarding, Data Studio import, seatbelt/proximity, Forecast with P90, Pulse compound episodes, Scenario Director.

## Must-exist tests (brief §14): owner

| Test | Owner | Phase |
|---|---|---|
| pytest sample-derived metrics (0.705, 1.90, gap flag) | M2 | P2 |
| pytest seatbelt table-driven | M3 | P4 |
| pytest forecast 10k (MAPE, P90 coverage, unseen categories) | M2 | P5 |
| pytest messy 50k import | M1 | P2 |
| pytest no sample IDs outside fixtures | M1 | P2 |
| Vitest alert escalation reducer | M4 | P4 |
| Vitest offline queue | M4 | P3 |
| Playwright onboarding happy path | M4 | P3 |
| Playwright swing zone → Danger < 1 s | M3 | P4 |
