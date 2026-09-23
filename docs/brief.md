# CabOS: Claude Code Build Brief
### Smart Operator Assistant for Cat® machinery (Caterpillar On-Campus Hackathon)

---

## 0. How you must work (read this first, follow it throughout)

You are acting as a **Principal Solutions Architect, a Staff Full-Stack Engineer and an award-winning Product Designer** at the same time. The product you build must feel like a Series-A industrial-tech startup shipped it, not a college project.

**Operating rules:**

1. **Think deeply as a systems architect before writing any code.** Before creating a single source file, reason through the domain, the data, the failure modes, the data flow, and the trade-offs. Question every assumption in this brief. If you find a better approach than the one specified, write it up as an ADR in `docs/decisions.md` and use it.
2. **Phase 0 produces documents only:** `docs/architecture.md`, `docs/design.md`, `docs/build-plan.md` and `docs/decisions.md`. When they are written, **STOP**, print a 15-line summary of the key decisions, and wait for me to reply `GO`. Do not scaffold code before that.
3. Maintain a todo list. Work one phase at a time (Section 13). Each phase ends **green**: build passes, typecheck passes (TS strict, mypy on core modules), lint passes, tests pass. Commit at the end of each phase with a conventional-commit message.
4. **Nothing on screen is fake.** Every visible button, chart and number is wired to real logic and real (seeded or simulated) data. If a feature is not built, it is not shown. No lorem ipsum, no "Coming soon" tiles.
5. **The demo can never break.** Seeded, deterministic data. Every external dependency (LLM, weather API, camera, microphone) has a graceful offline fallback.
6. **Safety logic is deterministic code.** An LLM never decides whether a safety alert fires, escalates or clears. LLMs only summarise, explain and structure text.
7. Only ask me when blocked by something irreversible or genuinely ambiguous. Otherwise decide, record the decision in `docs/decisions.md`, and continue.
8. Prefer boring, proven tech for the core and spend innovation budget on the product experience and the intelligence layer.

---

## 1. Problem statement (from the organisers)

**Background:** Construction equipment like excavators and loaders is increasingly digital, yet operator tools remain basic. Build an intelligent end-to-end assistant that supports machine operators through their workday, improving efficiency, safety and training.

**Challenge:** Design and build a multi-functional operator interface for Cat machine operators. Think beyond a tool: an intelligent companion that improves the operator's daily experience.

**Expected outcomes:**
1. **Daily task dashboard:** view scheduled tasks for the day.
2. **Safety features:** real-time operator safety using available or assumed data: (1) seatbelt compliance, (2) proximity hazards, (3) incident logging, etc. *Working conditions must be considered.*
3. **Operator training hub:** any creative format: e-learning, instructor booking, or simulation module.
4. **Identify unusual behaviour in machine usage**, e.g. excessive idling or unsafe operation patterns.
5. **Task time estimation:** predict time to complete a task from past data and environmental conditions.

---

## 2. Sample data (schema reference, NOT the full dataset)

**Critical:** the organisers gave a *sample*. The evaluation or real dataset will follow the same schema but may have thousands of rows, many machines and operators, new task types and weather values, irregular intervals, missing values, duplicates, and slightly different header spellings or timestamp formats. **Nothing in the system may be hard-coded to these rows.** Treat them as (a) the schema contract, (b) test fixtures, and (c) demo seed content. Every module must work unchanged on any dataset in this shape (see Data Studio, 4.2 H).

### Table A: Machine telemetry (`data/provided/telemetry.csv`)
```csv
timestamp,machine_id,operator_id,engine_hours,fuel_used_l,load_cycles,idling_time_min,seatbelt_status,safety_alert_triggered
2025-05-01 08:00:00,EXC001,OP1001,1523.5,5.2,12,30,Fastened,No
2025-05-01 10:00:00,EXC001,OP1001,1524.8,3.8,2,55,Unfastened,Yes
2025-05-01 14:00:00,EXC001,OP1001,1526.5,6.1,10,15,Fastened,No
2025-05-02 09:00:00,EXC001,OP1001,1530.2,2.0,1,60,Unfastened,Yes
```

### Table B: Task history (`data/provided/tasks.csv`)
```csv
task_id,task_type,weather,operator_skill,machine_age_yrs,estimated_time_min,actual_time_min
T001,Earth Excavation,Sunny,Expert,2,60,58
T002,Trenching,Rainy,Intermediate,4,45,52
T003,Material Loading,Cloudy,Beginner,3,30,42
T004,Grading,Sunny,Expert,5,35,33
T005,Demolition,Windy,Intermediate,6,90,105
```

---

## 3. Hypotheses from the sample (the system must TEST these on whatever data is loaded)

The numbers below come from the sample and are used only as fixture assertions. In the product, each finding is a **hypothesis the system checks on the loaded dataset** and reports with sample size and strength (e.g. "Unfastened intervals have 3.1× fuel per cycle, n = 4,212, strong"). If the full data contradicts a hypothesis, the UI says so.

**Telemetry (derived per interval, using the delta from the previous row):**

| Row | Engine-min (Δ) | Wall-min | Idle ratio | Fuel / cycle | Belt | Alert |
|---|---|---|---|---|---|---|
| 05-01 08:00 | n/a (first row) | n/a | n/a | 0.43 L | Fastened | No |
| 05-01 10:00 | 78 | 120 | **0.705** | **1.90 L** | Unfastened | Yes |
| 05-01 14:00 | 102 | 240 | 0.147 | 0.61 L | Fastened | No |
| 05-02 09:00 | 222 | 1140 | 0.270 | **2.00 L** | Unfastened | Yes |

Findings the product must operationalise:
- **Unsafe and wasteful behaviour co-occur.** Every unfastened row also has high idle (≥ 55 min), very low cycles (≤ 2) and 3 to 4× the fuel per productive cycle. Idle is a *leading indicator* of unsafe behaviour (operators unbuckle while waiting, then resume work unbuckled). The product therefore models **compound risk episodes**, not isolated alerts.
- **The existing "Safety Alert Triggered" column is a single-signal alert** (it maps 1:1 to seatbelt). CabOS replaces it with a multi-signal, context-aware risk engine.
- **Data quality issue:** 05-02 09:00 shows 3.7 engine-hours since the last report but only 1 cycle and 2.0 L of fuel (≈ 0.54 L/h, implausible for a working excavator). Either the reporting window differs from the engine-hour delta, or operation went untracked. The ingestion layer must detect and surface **telemetry gaps / coverage mismatches** instead of silently computing wrong KPIs.
- Rows arrive at irregular intervals, so every metric is computed per interval with explicit window length.

**Task history (ratio = actual / estimated):**

| Task | Skill | Weather | Age | Ratio |
|---|---|---|---|---|
| T001 | Expert | Sunny | 2 | 0.967 |
| T002 | Intermediate | Rainy | 4 | 1.156 |
| T003 | Beginner | Cloudy | 3 | **1.400** |
| T004 | Expert | Sunny | 5 | 0.943 |
| T005 | Intermediate | Windy | 6 | 1.167 |

- Planner estimates are biased: total 260 estimated vs 290 actual (+11.5%); naive MAPE ≈ 16.3%.
- **Predict the overrun ratio (log(actual/estimated)), not absolute minutes.** This generalises across task types and makes factors multiplicative and explainable ("+15% rain, +22% beginner").
- **Skill and weather are confounded** in 5 rows (both Expert rows are Sunny). The model card and UI must say this honestly. Machine age shows no visible effect in this sample (Expert on a 5-year machine still finished early).
- The model must output **P50 and P90** with a calibrated interval, not a single number.

---

## 4. Product: CabOS, "the operating system for the cab"

**Thesis:** the two datasets are the same story at two time scales. Telemetry is minute-level *behaviour*; the task table is task-level *outcome*. CabOS links them into one **Operator State Graph** and closes the loop: **detect → explain → coach → verify improvement**. No module is a silo.

### 4.1 Personas & surfaces
- **Operator (in-cab tablet, landscape 1280×800 primary; also phone).** "Cab Mode": glove-friendly, sunlight-legible, voice-capable, max 3 primary actions per screen.
- **Site Supervisor (desktop web).** "Command": fleet, alerts, coaching, plan vs actual, sustainability.
- **Trainer (desktop web).** Curriculum, bookings, skill evidence.
- **Public landing page (`/`).** Awwwards-grade product story for judges.

### 4.2 Modules & acceptance criteria

**A. Shift Deck (daily task dashboard, operator)**
- Timeline of today's tasks with P50 bar and P90 whisker, live progress, overrun-risk chip.
- Conditions strip (live weather + derived impact, e.g. "Rain: +14% on trenching").
- Live KPIs: idle %, fuel L, cycles/hr, CO₂ kg (2.68 kg CO₂ per L diesel, configurable), safety score.
- Pre-shift walkaround checklist gates "Start shift".
- End-of-shift debrief: auto summary, one win, one coaching tip, sustainability line ("Idle cost today: 4.1 L ≈ ₹x, 11 kg CO₂").
- Push-to-talk Copilot (button, not wake word): "Why is T002 running late?", "Log a near miss", "What's next?".

**B. Guardian (safety)**
- **Seatbelt state machine** (edge-evaluated, table-driven tests): `ENGINE_OFF → SEATED_FASTENED (ok) → UNFASTENED_GRACE (0–10 s) → WARN (chime + banner) → ALARM (≥30 s, or immediately if travelling / hydraulics active) → ESCALATED (supervisor notified, incident auto-drafted at 60 s)`. Inputs: engine state, seat occupancy, belt, hydraulic lockout lever, ground speed.
  - Edge cases: seat unoccupied + engine running = *Unattended machine* (separate alert); belt sensor flapping > N toggles/min or stuck = *Sensor health* issue, not an operator violation; lockout engaged + stationary = lower severity.
- **Proximity radar:** top-down radar around the machine showing tail-swing radius (from machine spec), travel path, and simulated UWB-tagged workers/vehicles with distance, bearing and closing speed. Levels: Aware / Caution / Danger / Stop. Risk = f(distance, closing speed, machine activity [swinging/travelling/idle], visibility). Rain, fog and night expand zones by configurable multipliers.
- **Working conditions engine:** Open-Meteo (no key; cached fallback) → heat index (fatigue + hydration prompts), wind (demolition/lift limits), rain (slope and ground-stability limits), darkness. Continuous-operation fatigue timer with break prompts. Thresholds adapt to conditions and are shown to the operator ("Wind 38 km/h: demolition limited").
- **Incident logging:** one-tap near-miss button always reachable in Cab Mode; voice dictation (Web Speech API, fallback to text); auto-attached **black-box snapshot** (last 120 s of signals + weather + machine state); severity taxonomy (near miss, first aid, property damage, lost time); offline queue (IndexedDB) with sync; LLM structures free text into fields with deterministic template fallback; supervisor workflow `open → reviewed → action assigned → closed`.

**C. Pulse (unusual behaviour detection)**
- Derived features per interval: engine_minutes, wall_minutes, utilisation, idle_ratio, fuel_per_cycle, fuel_rate_l_per_h, cycles_per_engine_hour, coverage check.
- Three layers:
  1. **Explainable rules** (supervisors trust these): excessive idle, low productivity, fuel-per-cycle spike, telemetry gap, engine-minutes > wall-minutes (clock/data error).
  2. **Statistical baselines:** robust z-scores (median/MAD) per machine and per operator; IsolationForest on the feature vector as a second opinion.
  3. **Compound episodes:** e.g. *Unattended-idle risk* = idle ≥ X min AND unfastened; *Fatigue drift* = rising harsh events late in shift.
- **Idle classifier:** warm-up (first N min after start), cool-down (last N min before shutdown), *waiting* (idle while a haul truck is pending, from simulated site context, non-attributable to operator), *discretionary* (coachable). Only discretionary idle affects the operator's score.
- **Unsafe operation patterns** from the 1 Hz simulated signal stream: harsh swing acceleration, travelling with bucket raised, operating beyond slope limits (pitch/roll), overspeed, operating in wind above threshold.
- Every anomaly carries a plain-language explanation, the evidence values, and a suggested action. Framing is **coaching, not surveillance**: operators see their own data first.

**D. Forecast (task time estimation)**
- Target: `log(actual / planner_estimate)`. Features: task_type, weather, skill, machine_age, plus engineered: shift hour, hours already on shift, operator's recent discretionary-idle ratio, temperature, precipitation mm, wind km/h.
- Champion: regularised linear model on the log ratio (coefficients exponentiate into interpretable multipliers). Challenger: gradient-boosted trees (LightGBM or sklearn HistGradientBoosting). Select by **grouped CV (group = operator)** on MAPE.
- **Split conformal prediction** on residuals for a calibrated P90.
- **Data-size-aware training:** the model trains on whatever task history is loaded. With little data (< 200 rows), use a regularised linear model with priors and optionally augment with clearly labelled synthetic rows whose weight decays to zero as real rows grow. With plenty of data, the gradient-boosted challenger usually wins. The selection is automatic and shown in the model card with row counts.
- **Unseen categories:** new task types or weather values never crash the model. Fall back hierarchically: task type → task family (earthmoving / loading / finishing / demolition, via a configurable mapping) → fleet-wide ratio, and mark the prediction "low confidence".
- **Learned thresholds, not magic numbers:** feature bins, idle thresholds and anomaly cut-offs come from the loaded data's distribution (percentiles, per machine/operator when n is sufficient, fleet-wide otherwise), with configurable overrides.
- **Factor waterfall UI:** "Planner 45 min → +14% rain → +9% intermediate → +3% machine age → P50 52 min, P90 58 min".
- Live re-forecast when conditions change mid-shift (weather update, operator swap, machine swap).
- Cold start (unknown task type): fleet median ratio × planner estimate, flagged "low confidence".
- Learning loop: completed tasks append to history; "Retrain" action in admin; model registry with version + metrics.
- "Honest mode" on the model card: real vs synthetic row counts, detected confounding between features (e.g. skill vs weather correlation), and calibration of the P90 on held-out data.

**E. Academy (training hub)**
- **Adaptive curriculum:** anomalies and incidents map to skill nodes. "Recommended because: 2 unattended-idle episodes this week."
- Formats: 60–90 s **micro-lesson card stacks**; **branching scenario drills** ("Truck is 10 min late. What do you do?"); a **2D Swing-Zone simulator** (canvas, top-down excavator, pedestrians enter the zone, operator swings with keyboard/touch joystick, scored on smoothness and safety); **instructor booking** with seeded calendar slots.
- **Skill Passport:** skills verified by *field telemetry*, not quiz clicks ("Seatbelt discipline: 14-day verified streak"). XP and levels. No leaderboard that rewards speed over safety; crew-level challenges only.
- **Verify loop:** after a lesson, Pulse tracks the related metric for 7 days and shows the before/after delta.

**F. Command (supervisor)**
- Live alert feed (WebSocket), fleet grid with machine state tiles, anomaly inbox with explanations, incident review workflow, plan-vs-actual, coaching cards, sustainability ledger (idle litres → ₹ → kg CO₂ per machine / operator / site).

**H. Data Studio (bring-your-own-dataset; judges will likely use this)**
- Upload CSV/XLSX (drag-and-drop) or drop files into `data/incoming/`. Accept both telemetry and task-history files.
- **Schema mapping:** fuzzy header matching ("Fuel Used (L)", "fuel_used", "Fuel(L)" → `fuel_used_l`), with a mapping screen to confirm or fix. Parse varied timestamp formats and timezones; normalise categories (e.g. "rain", "Rainy" → `rainy`); unit handling where detectable.
- **Validation report before import:** row counts, types, null rates, out-of-range values, duplicates, out-of-order timestamps, engine-hour resets, telemetry gaps, new categories. Bad rows are quarantined with reasons, never silently dropped.
- **Data profile:** distributions per column, per-machine and per-operator coverage, and the Section 3 hypotheses re-tested on this data.
- One click: import → recompute derived metrics → retrain Forecast → rebuild Pulse baselines → every dashboard switches to the new dataset. Keep the sample dataset selectable as "Demo site".
- Scale: vectorised processing (pandas or polars), batched DB inserts, background job with a progress bar. Target: 100k telemetry rows imported and processed in under 60 s on a laptop.

**G. Copilot (language layer)**
- Provider-agnostic interface (`LLMProvider`) supporting Anthropic and Gemini via env keys, plus a deterministic template provider used when no key is set. Used for: explanations, incident structuring, shift debriefs, Q&A over the operator's own shift data. Never in the safety decision path.
- i18n: English + Hindi for all Cab Mode strings (structure ready for Tamil).

---

## 5. Tech stack (default; deviate only with an ADR)

- **Web:** Next.js (App Router) + TypeScript strict, Tailwind CSS, shadcn/ui primitives (restyled to our tokens), Motion (Framer Motion) for animation, Zustand for client state, TanStack Query for server state, visx or Recharts for charts, Lenis for smooth scroll (landing only), next-intl for i18n, PWA service worker + IndexedDB (idb) for offline queue.
- **API:** Python FastAPI, Pydantic v2, SQLModel/SQLAlchemy 2, Alembic, scikit-learn, LightGBM (optional), pandas, APScheduler. WebSocket endpoint for live streams.
- **Edge simulator + rules engine:** Python service that replays provided telemetry and synthesises 1 Hz signals (belt, seat, speed, swing rate, pitch/roll, hydraulics, UWB tags). Safety state machines run here (edge-first) and publish events.
- **Bus:** internal `EventBus` interface. Default: in-process asyncio bus. Adapter: MQTT (Mosquitto) behind `USE_MQTT=true`.
- **DB:** PostgreSQL 16 via docker-compose (Timescale extension optional behind a flag). **Zero-setup fallback: SQLite** when `DATABASE_URL` is unset.
- **Tooling:** pnpm, ruff + mypy, eslint + prettier, pytest, Vitest, Playwright. `make dev` starts everything; `make seed`; `make test`; `make demo`.

---

## 6. `docs/architecture.md`: required contents (be meticulous)

1. System context diagram (Mermaid): cab tablet, edge gateway (simulated), cloud API, DB, LLM providers, weather API, supervisor web.
2. Container/component diagram and responsibility of each service.
3. **Data flow:** file import (Data Studio: mapping → validation → quarantine → load) and live telemetry ingest → normalisation (ISO 15143-3 / AEMP 2.0-style adapter interface for mixed fleets) → derived-metrics → rules/anomaly → event store → WebSocket → UI; and the forecast training/inference flow.
4. **Event catalogue:** every event type with JSON schema (e.g. `safety.seatbelt.state_changed`, `safety.proximity.level_changed`, `pulse.anomaly.detected`, `forecast.updated`, `incident.created`, `training.recommended`).
5. **Database schema:** ERD (Mermaid) + table definitions with types, keys, indexes. Minimum entities: organisations, sites, machines (model, type, age, tail_swing_radius_m, spec json), operators (skill_level, certifications, language), shifts, tasks (planner_estimate, p50, p90, actual, conditions_snapshot), telemetry_intervals, telemetry_signals (high-frequency), events (append-only), alerts, anomalies, incidents (+ blackbox snapshot), training_modules, training_progress, skill_evidence, bookings, weather_snapshots, model_registry, users + roles.
6. **API design:** full REST contract under `/api/v1` (resources, methods, request/response schemas, error model, pagination, idempotency keys for offline sync) + WebSocket channels and message formats. Include OpenAPI generation.
7. **State machines** (Mermaid stateDiagram) for seatbelt, proximity levels, incident lifecycle, shift lifecycle.
8. **ML model cards** for Forecast and Pulse: data, features, method, metrics, limitations, confounding note.
9. **Failure modes & edge cases table:** sensor fault, telemetry gap, out-of-order/duplicate packets, clock skew, engine-hour reset, offline cab, LLM timeout, weather API down, operator swap mid-shift, machine swap, unknown task type, night shift, DST/timezones (store UTC, display site-local IST).
10. **Security & privacy:** RBAC (operator / supervisor / trainer / admin), operators see their own data first, data minimisation, audit log for incident edits.
11. **Scalability path:** from 1 machine to 10,000: edge store-and-forward, MQTT/Kafka partitioned by machine_id, Timescale hypertables + continuous aggregates, stateless API horizontally scaled, multi-tenant by org/site, model retraining pipeline.
12. Latency budgets: safety alert on screen < 300 ms from signal; forecast < 150 ms.

## 7. `docs/design.md`: required contents (be meticulous)

1. **Design principles** (e.g. "Legible at arm's length in sunlight", "Motion carries meaning", "Calm until it matters", "Coach, don't police").
2. **Design tokens** as CSS variables + Tailwind theme, with exact values:
   - Colour: ink/graphite surface ramp (dark default), paper ramp (daylight theme); accent **Signal Yellow** (an original industrial safety yellow, not Caterpillar's trade dress); semantic safe / caution / danger / info; data-viz palette (colour-blind safe). Contrast: ≥ 7:1 for Cab Daylight text.
   - Typography: UI in **Geist** (or Inter Tight), telemetry numerals in **Geist Mono / JetBrains Mono** with tabular figures, big cab numerics in **Barlow Condensed**, editorial accents on the landing page in **Instrument Serif** italic. Full type scale with line heights and tracking.
   - Spacing (4 px base), radii, elevation/shadows, borders, blur, z-index layers, grid (12-col desktop, 8-col tablet).
   - Motion: durations (e.g. 120 / 200 / 320 / 560 ms), easings and spring presets, stagger values, reduced-motion strategy.
3. **Themes:** Cab Night, Cab Daylight (high contrast), Office (supervisor). Auto-switch Cab themes by sunrise/sunset.
4. **Component hierarchy** (tree) for every route: AppShell → CabShell/CommandShell → pages → sections → components → primitives.
5. **State management map:** server state (TanStack Query keys + invalidation), realtime state (WebSocket → normalised Zustand store), local UI state, offline queue, persisted preferences. Show which component owns what.
6. **Interaction specs & micro-interactions** per key component: task card, alert banner escalation, radar, factor waterfall, near-miss button (press-and-hold with progress ring to avoid accidental taps), card-stack lessons, swing simulator controls.
7. **Cab ergonomics:** min touch target 56 px (72 px in glove mode), min body text 18 px, no hover-dependent UI, audio + haptic (`navigator.vibrate`) patterns per alert level, one-hand reach zones.
8. Empty, loading (content-shaped skeletons), error, offline and stale-data states for every data view.
9. Accessibility: WCAG 2.2 AA minimum (AAA contrast in Cab Daylight), focus rings, screen-reader labels, `prefers-reduced-motion`.
10. A living style guide route `/design` rendering all tokens and components.

---

## 8. Onboarding flow (frictionless, premium, under 90 seconds)

Progress indicator, resumable, state persisted. Every step skippable except the walkaround (skippable only in demo mode, with a watermark). A visible **"Explore demo site"** path drops judges straight into a fully populated shift.

0. **Splash:** logo mark morphs into wordmark; greeting by site-local time ("Good morning, Ravi").
1. **Role:** Operator / Supervisor / Trainer as large tactile cards with hover/press depth.
2. **Identity:** scan badge QR (camera via `getUserMedia` + `BarcodeDetector`, fallback to code entry or picking a seeded operator).
3. **Machine pairing:** scan cab QR → machine card flips in (model, engine hours, last service, tail-swing radius) → confirm.
4. **Calibration:** 3 quick questions (years of experience, machines certified on, preferred language). Answers seed the Forecast skill prior; show a live micro-moment: "Your estimates are now personalised" with a factor chip animating in.
5. **Cab setup:** theme (auto), glove mode, **"Tap to hear the danger chime"** audio test, haptic test.
6. **Pre-shift walkaround:** interactive machine diagram with hotspots (tracks, hydraulic leaks, mirrors, lights, seatbelt, fire extinguisher, fluid levels); tap to pass or flag, photo capture for defects.
7. **Seatbelt handshake:** "Fasten your seatbelt". The live simulator signal turns a ring from amber to green, then the Shift Deck reveals with a staggered entrance. The first thing the operator learns is the safety loop.

---

## 9. Visual & interaction direction (the Awwwards bar)

Take inspiration from Awwwards Site-of-the-Day calibre work and best-in-class product sites (Linear, Vercel, Teenage Engineering's industrial restraint, Rivian's vehicle UI). Do not copy any site; extract principles:

- **Landing (`/`):** kinetic oversized display type; a live telemetry line drawn across the hero; sticky scroll-driven narrative "One machine. Five minds." walking through Deck, Guardian, Pulse, Forecast, Academy; bento feature grid with real mini-widgets (not screenshots); number tickers for impact metrics; magnetic primary CTA; subtle film-grain overlay; custom cursor on desktop only; Lenis smooth scroll; page transitions via View Transitions API / Motion layout animations.
- **App surfaces:** restrained and fast. Micro-interactions: pressed states with spring, values tweening when telemetry updates, shared-element transition from task card to task detail, optimistic toasts, skeletons shaped like content, alert banners that escalate in colour, size and sound but never animate decoratively.
- **Premium typography:** tabular numerals everywhere data changes; tight tracking on display sizes; generous leading on body.
- **Performance is part of the aesthetic:** Lighthouse ≥ 90 on landing and Cab Deck; 60 fps animations (transform/opacity only); fonts self-hosted via `next/font`.
- **Branding:** original name and mark ("CabOS"). Do not use Caterpillar logos or trademarks in the UI; the landing page may say "Designed for Cat® machine operators" in body text.

---

## 10. Simulator & Scenario Director (critical for the demo)

- `edge-sim` replays `telemetry.csv` (time-compressed) and synthesises consistent 1 Hz signals around it, plus site context (haul-truck arrivals, UWB-tagged workers walking paths).
- **Scenario Director:** a hidden panel (`/director`, or press `D` in demo mode) with one-click injections, each producing a visible cascade across modules:
  1. Replay provided dataset
  2. Rain starts (zones expand, forecasts re-compute, slope limits tighten)
  3. Worker enters swing zone (radar → Danger → Stop, chime, haptic)
  4. Operator unbuckles during idle (compound episode → coaching card → Academy recommendation)
  5. Haul truck delayed (idle classified as *waiting*, not blamed on operator)
  6. Telemetry gap (coverage warning, KPIs marked stale)
  7. Belt sensor flapping (sensor-health ticket, no operator penalty)
  8. Heat wave (fatigue timer shortens, hydration prompt)
  9. Beginner assigned to Material Loading (P50/P90 widen, factor waterfall updates)
  10. Load a new dataset (opens Data Studio; after import every module re-computes live)
- Deterministic seed so every run of the demo is identical.

---

## 11. Seed data

- The sample rows load as-is into a "Demo site".
- A **synthetic generator** (`data/synthetic/generate.py`, seeded, configurable size) produces realistic datasets **in the exact organiser schema**: 1 org, 2 sites (e.g. Chennai highway project, Gurugram metro depot), 6–50 machines, 8–100 operators, 30–180 days of history, today's shift plan, 15 training modules, instructor slots for 7 days, historical incidents across the lifecycle.
- The generator also has a `--messy` mode that injects real-world problems: nulls, duplicates, shuffled column order, variant headers, mixed timestamp formats, new task types, engine-hour resets, telemetry gaps, flapping sensors. This is the stress test for Data Studio.
- All seeded people are fictional.

---

## 12. Repository structure (adjust with ADR if needed)

```
cabos/
  apps/web/                 # Next.js
  services/api/             # FastAPI: REST, WS, ML, persistence
  services/edge-sim/        # simulator + edge safety rules
  packages/contracts/       # shared event + API schemas (JSON Schema → TS + Pydantic)
  data/provided/            # the two CSVs above
  data/synthetic/           # generator + outputs
  docs/                     # architecture.md, design.md, build-plan.md, decisions.md, demo-script.md
  docker-compose.yml
  Makefile
  README.md
```

---

## 13. Build phases (each ends green and committed)

- **P0 Docs** (then STOP for `GO`).
- **P1 Foundation:** monorepo, tooling, tokens, fonts, themes, primitives, `/design` living style guide.
- **P2 Data spine:** schema + migrations, seed + synthetic generator (incl. messy mode), Data Studio import pipeline (mapping, validation, quarantine, background job), event bus, edge-sim replay, WebSocket stream, contracts package.
- **P3 Onboarding + Shift Deck.**
- **P4 Guardian:** seatbelt state machine, proximity radar, conditions engine, incident logging with offline queue + black box.
- **P5 Pulse + Forecast:** derived metrics, rules, baselines, compound episodes, idle classifier; forecast training, conformal intervals, factor waterfall, model registry.
- **P6 Academy:** adaptive recommendations, micro-lessons, scenario drills, swing simulator, booking, Skill Passport, verify loop.
- **P7 Command:** supervisor console, incident workflow, sustainability ledger.
- **P8 Landing + polish:** landing page, Scenario Director, Copilot, i18n pass, accessibility pass, performance pass, `docs/demo-script.md`.

**If time runs short, cut in this order:** swing simulator → instructor booking → Hindi strings → supervisor fleet grid. **Never cut:** onboarding, Data Studio import, seatbelt/proximity safety, Forecast with P90, Pulse compound episodes, Scenario Director.

---

## 14. Quality bar / definition of done

- **Tests that must exist:**
  - pytest: derived metrics on the provided rows equal Section 3 (idle ratio 0.705, fuel/cycle 1.90, telemetry-gap flag on 05-02 09:00).
  - pytest: seatbelt state machine table-driven (every transition, including sensor-fault and unattended-machine cases).
  - pytest: on a generated dataset of 10k tasks, Forecast beats the planner baseline MAPE and the conformal P90 has 85–95% empirical coverage on holdout; unseen categories return a low-confidence prediction instead of an error.
  - pytest: a `--messy` dataset (50k telemetry rows) imports end to end without crashing, quarantines bad rows with reasons, and completes within the performance target.
  - pytest: no module references sample IDs (EXC001, OP1001, T001…) outside fixtures and seed files (grep-based test).
  - Vitest: key UI logic (alert escalation reducer, offline queue).
  - Playwright: onboarding happy path; "Worker enters swing zone" shows a Danger alert within 1 s.
- `make dev` works from a clean clone with or without Docker.
- README: one-paragraph pitch, screenshots/GIF placeholders you then replace with real captures, architecture diagram, run instructions, demo script link.
- No console errors, no TypeScript `any` in domain code, no unhandled promise rejections.

---

## 15. Demo script (write the full version to `docs/demo-script.md`)

3 minutes: (1) landing hero, 15 s → (2) onboarding with seatbelt handshake, 40 s → (3) Shift Deck with P50/P90 and factor waterfall, 25 s → (4) Director: rain starts, then worker enters swing zone, 30 s → (5) unbuckle during idle → compound episode → Academy recommendation → Skill Passport, 35 s → (6) Command: incident workflow + sustainability ledger, 20 s → (7) close on architecture slide and scalability path, 15 s.

---

**Start now with Phase 0. Think deeply, write the four documents, then stop and wait for `GO`.**
