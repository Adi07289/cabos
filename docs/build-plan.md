# CabOS: Build Plan

Every phase ends **green**: `make check` = build + typecheck (TS strict, `mypy --strict` on `cabos-core`, `mypy` on services) + lint (ruff, eslint) + tests (pytest, Vitest; Playwright where listed). Then a conventional commit (`feat(p2): data spine …`). No phase starts until the previous one is green. Nothing unbuilt is ever shown in the UI (brief rule 4), so routes appear only in the phase that makes them real.

## Repository layout (ADR-001 adds `packages/cabos-core`)

```
cabos/
  apps/web/                     Next.js App Router, TS strict, Tailwind v4, Motion, Zustand, TanStack Query, visx, next-intl, Serwist
  services/api/                 FastAPI, SQLModel, Alembic, APScheduler, WS gateway, jobs
  services/edge-sim/            simulator + safety runtime (imports cabos-core)
  packages/cabos-core/          pure Python domain (contracts, intervals, safety, pulse, forecast, hypotheses, mapping, language protocol)
  packages/contracts/           generated JSON Schema + TS (+ zod) from cabos-core (ADR-002)
  data/provided/                telemetry.csv, tasks.csv (organiser sample, verbatim)
  data/synthetic/               generate.py + outputs (gitignored except small fixtures)
  data/incoming/                watched drop folder
  config/                       safety.yaml, priors.yaml, task_families.yaml, synonyms.yaml, thresholds.yaml, sites.yaml
  docs/                         brief.md, architecture.md, design.md, build-plan.md, decisions.md, demo-script.md
  docker-compose.yml            postgres16 (+timescale image flag), mosquitto
  Makefile                      dev, seed, test, check, demo, contracts, synth
  pyproject.toml (uv workspace) · pnpm-workspace.yaml · .github/workflows/ci.yml
```

**Toolchain:** Python 3.12 via `uv`, Node 22 + pnpm 9. `make dev` = `uv sync && pnpm i && alembic upgrade && seed-if-empty && run api(:8000) + web(:3100)`. It uses SQLite unless `DATABASE_URL` is set; `make dev-docker` brings up compose first. (The web port is 3100 to avoid clashing with other local projects on 3000/3001.)

---

## P1 Foundation
**Goal:** the skeleton and the look. A judge opening `/design` sees a finished design system.
- Monorepo, `uv` workspace, pnpm workspace, Makefile, pre-commit, CI (lint, type, test matrix).
- `cabos-core` package skeleton with a `Clock` protocol and a determinism lint test (ADR-004).
- FastAPI app shell: `/health`, `/ready`, problem+json error handler, settings (pydantic-settings), SQLite/PG engine factory, Alembic baseline.
- Web: Next.js App Router, Tailwind v4 `@theme` tokens (design §2 verbatim), `next/font` (Geist, Geist Mono, Barlow Condensed, Instrument Serif, Noto Sans Devanagari), ThemeController (4 themes plus the sunrise/sunset calculator), density and glove attributes, primitives (restyled shadcn/Radix), Motion presets, Web Audio sound kit, haptics helper, next-intl scaffolding (en/hi/ta).
- `/design` living style guide with computed contrast badges.
- **Tests:** `tokens.contrast.test.ts` (every documented pair ≥ its target), a sunrise calculator against NOAA fixtures, sound and haptic pattern tables, a pytest determinism grep, `/health`.
- **Exit:** `make dev` from a clean clone serves `/design` in all themes; `make check` green.

## P2 Data spine
**Goal:** data in, events flowing, contracts shared.
- `cabos_core.contracts` (events, API DTOs) → `make contracts` → `packages/contracts` (JSON Schema, TS, zod) + a staleness test.
- DB schema (architecture §5) + Alembic revisions; SQLite and PG parity tests (run the PG job in CI via a service container).
- `cabos_core.intervals` (ADR-005) + `cabos_core.hypotheses` H1–H8 (ADR-024).
- `cabos_core.mapping`: header normaliser, synonyms, value-shape scoring, Hungarian assignment, timestamp multi-format parser, category normalisers, unit hints.
- Import pipeline: sniff → map → validate V1–V14 → quarantine → bulk load → derive → activate (ADR-020); background job with WS progress; `data/incoming/` watcher.
- Synthetic generator `data/synthetic/generate.py`: seeded, `--machines --operators --days --tasks --extended --messy`. It uses the organiser schema exactly, with the extended columns optional. Latent ground truth is known (true multipliers, injected episodes), so the ML tests can check for recovery.
- Seed: org, 2 sites (Chennai highway project, Gurugram metro depot), "Demo site" = sample rows + a seeded synthetic set, operators, machines with specs, today's shift anchored to the date (ADR-004), 15 training modules, 7 days of instructor slots, historical incidents across the lifecycle.
- EventBus (in-proc + MQTT adapter), event store writer + projections, WS gateway (tickets, channels, snapshot + resume, heartbeat).
- edge-sim: replay intervals → consistent 1 Hz synthesis (idle segments sum to `idle_min`, cycles distributed over working time, belt state per interval), site context (trucks, UWB workers), 600 s ring buffers, 10 s aggregates. Safety SMs are stubbed to publish frames only (they arrive in P4).
- **Tests (brief §14):**
  - `test_sample_intervals`: idle ratio **0.705** and fuel/cycle **1.90** at 05-01 10:00; `telemetry_gap` **only** at 05-02 09:00; engine-min 222 / wall-min 1140; first row open.
  - `test_messy_import_50k`: generate `--messy` 50k rows → imports end to end, quarantine rows carry reasons, and runtime < target (scaled budget asserted; 100k timing is logged).
  - `test_no_sample_ids`: grep all non-fixture/non-seed source for `EXC001|OP1001|T00[1-5]` → none.
  - Mapping: 30 header variants → correct targets; ambiguous date formats resolved; idempotent commit.
  - Hypotheses on sample: H2 agreement 100% (n = 4), H1 direction positive with `insufficient` strength.
- **Exit:** uploading the provided CSVs and a messy synthetic file both work through the API (the Studio UI arrives in P2b below), and the WS shows live frames.

### P2b Data Studio UI (kept in P2 because it is on the never-cut list)
- `/studio`: DropZone, MappingTable, ValidationReport, QuarantineTable, ImportProgress, DataProfile (distributions, coverage heatmap, HypothesisCards, UnlockedCapabilities), DatasetSwitcher.
- **Tests:** Vitest mapping-table reducer; Playwright: upload `tasks.csv` with renamed headers → confirm → dataset activated → profile shows H1–H8.

## P3 Onboarding + Shift Deck
- Session and RBAC (`authorize()` + a matrix test per cell), `/onboarding/*` steps 0–7 (QR via `BarcodeDetector` with the `@zxing/browser` fallback, code entry, picker), calibration → skill prior, cab setup, walkaround (photo capture via `<input capture>`), seatbelt handshake on live signal.
- Shift lifecycle (architecture §7.4), `/cab` Shift Deck: KPI row (live, stale state), task timeline with P50/P90. **Forecasts at this point come from the ridge-to-prior model trained on the active dataset**, so this is real, not a mock; P5 adds the challenger and conformal. The deck also has conditions strip (Open-Meteo + cache + climatology) and a debrief (template provider; the LLM arrives in P8).
- Offline outbox (IndexedDB) + idempotency middleware on the API.
- **Tests:** Playwright onboarding happy path (< 90 s scripted, including "Explore demo site"); Vitest outbox (enqueue, drain, backoff, dedup); pytest idempotency replay.

## P4 Guardian
- `cabos_core.safety.seatbelt` (architecture §7.1), `proximity` (§7.2, 10 Hz, hysteresis), `conditions` (heat index, wind and rain limits, darkness), `fatigue` timer. Wired into the edge-sim runtime and publishing events.
- Cab safety layer: AlertBanner escalation, SafetyOverlay, LinkLostBanner (ADR-021), `/cab/guardian` (radar canvas, SM panel, limits, sensor health).
- Incidents: hold-to-log, voice (Web Speech) with a text fallback, black-box freeze, severity taxonomy, offline queue, structuring (template now; LLM plugs in at P8 through the same interface), supervisor lifecycle API.
- **Tests:** table-driven seatbelt (every transition + flapping 6 vs 7, grace 9.99 vs 10.00, lockout cases, unattended, bypass suspected, moving start); proximity bands × multipliers × hysteresis; Vitest `alertReducer` escalation/de-escalation; Playwright "Worker enters swing zone → Danger within 1 s" (via a test-only Director endpoint enabled in `DEMO_MODE`).

## P5 Pulse + Forecast
- Pulse: rules R1–R6, robust z, IsolationForest, episodes E1–E3, idle classifier (ADR-022), unsafe patterns U1–U5 from aggregates and captures, learned thresholds (ADR-019), scoring, `/cab/me`, anomaly and episode APIs, and coaching framing (the operator-first visibility window).
- Forecast: feature builder (core + extended), ridge-to-prior, HGB challenger, grouped CV selection, CV+/split conformal with Mondrian strata, waterfall (ADR-011), model registry + retrain job, live re-forecast on weather and swap events, the model card with honest mode (`/command/model` is added in P7; P5 exposes the API and the cab task-detail waterfall).
- **Tests:** on 10k generated tasks, MAPE < planner MAPE, holdout P90 coverage in [0.85, 0.95], the recovered multipliers match the generator truth within tolerance, unseen task type → `confidence=low` without error. Pulse recovers injected episodes (recall ≥ 0.9 on the synthetic truth) and excludes waiting idle from the score.
- **Exit:** Director scenarios 2 (rain) and 9 (beginner assigned) produce visible re-forecasts (the Director UI is still minimal).

## P6 Academy
- Recommendation engine (anomaly or incident → skill node → module, with "because" chips), micro-lesson card stacks, branching scenario drills, the swing simulator (canvas, shared proximity parameters with a parity test), instructor booking (slots, bookings, conflict-safe unique index), Skill Passport (telemetry-verified streaks, XP and levels, crew challenges only), and the verify loop (7-day before/after delta with n).
- **Tests:** recommendation mapping table; booking race (two concurrent requests → one 409); verify-loop delta computation; simulator scoring (Vitest).

## P7 Command
- `/command` overview (live alert feed, fleet grid), anomaly inbox, incident board and detail (black-box player, audit timeline, transitions), plan vs actual, coaching cards, sustainability ledger (idle L → ₹ → kg CO₂, waiting vs discretionary), model card page, thresholds with audited overrides. `/trainer` for curriculum, slots and evidence.
- **Tests:** RBAC scoping on every Command endpoint; ledger arithmetic (2.68 kg/L configurable); incident optimistic concurrency.

## P8 Landing + polish
- Landing `/` (design §10) with live mini-widgets; the full Scenario Director (10 scenarios, cascade log, clock speed, `D` hotkey); Copilot (PTT, deterministic intents, Anthropic/Gemini/template providers, 4 s timeout, schema-validated output); LLM incident structuring and debriefs; a Hindi pass for all `cab.*`; an accessibility pass (axe in Playwright, zero serious violations); a performance pass (Lighthouse CI ≥ 90 on `/` and `/cab`); visual regression of `/design`; README with real captures; `docs/demo-script.md` (brief §15, timed).
- **Tests:** Copilot intent router table; provider fallback on timeout and invalid JSON; import-linter contract "safety must not import language"; Lighthouse CI; the axe suite.

---

## Scenario Director: cascade contract (built across P2–P8, completed in P8)

| # | Injection (edge-sim/API) | Expected visible cascade | Phase first real |
|---|---|---|---|
| 1 | Replay provided dataset | intervals stream; H1–H8 update; landing line redraws | P2 |
| 2 | Rain starts | weather.updated → zones expand (radar rings tween) → slope limit tightens → tasks re-forecast (+x% rain bar) | P5 |
| 3 | Worker enters swing zone | proximity Aware → Caution → Danger → Stop; chime, haptic, overlay | P4 |
| 4 | Operator unbuckles during idle | seatbelt GRACE → WARN; Pulse E1 episode → coach card → Academy recommendation | P6 |
| 5 | Haul truck delayed | idle classified *waiting*; score unchanged; ledger shows dispatch cost | P5 |
| 6 | Telemetry gap | coverage.degraded → KPIs stale → interval degraded | P4 |
| 7 | Belt sensor flapping | SENSOR_FAULT; sensor-health ticket; no penalty | P4 |
| 8 | Heat wave | heat index up → fatigue limit 120 → 60 min; hydration prompt | P4 |
| 9 | Beginner assigned to Material Loading | swap → re-forecast; wider P50/P90; waterfall adds "+x% beginner" | P5 |
| 10 | Load a new dataset | opens /studio with a pre-generated messy file → import → dataset.activated → all views refresh | P2b |

Every injection carries a `correlation_id`, and the Director's cascade log lists the resulting events live. That makes the cascade the evidence.

---

## Cut order (if time runs short)
swing simulator → instructor booking → Hindi strings → supervisor fleet grid.
**Never cut:** onboarding, Data Studio import, seatbelt/proximity safety, Forecast with P90, Pulse compound episodes, Scenario Director.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| 100k import > 60 s on judge laptop | M | vectorised pipeline, the budget in architecture §3.1, a timing test in CI at 50k, and chunked streaming |
| Conformal coverage off target on generated data | M | CV+ plus Mondrian strata; the generator uses heteroscedastic noise by family, so the test is realistic |
| WS flakiness during demo | L | in-proc bus, heartbeat, auto-reconnect with snapshot and resume, link-lost banner |
| Camera / mic permissions denied at venue | H | code entry and picker, text input, "Explore demo site" path |
| No internet at venue | H | template LLM, climatology weather, self-hosted fonts, no CDN at runtime |
| Scope | H | never-cut list, phase gates, each phase shippable |
| Browser audio autoplay block | M | audio unlocked at onboarding step 5; visual and haptic equivalents |

## Definition of done (brief §14, tracked per phase)
- [ ] pytest: sample-derived metrics (P2) · seatbelt table (P4) · forecast 10k MAPE and coverage and unseen categories (P5) · messy 50k import (P2) · no sample IDs (P2)
- [ ] Vitest: alert escalation reducer (P4) · offline queue (P3)
- [ ] Playwright: onboarding happy path (P3) · swing zone Danger < 1 s (P4)
- [ ] `make dev` works from a clean clone with or without Docker (P1, re-verified P8)
- [ ] README with real captures, architecture diagram, run instructions, demo script link (P8)
- [ ] No console errors, no TS `any` in domain code (`@typescript-eslint/no-explicit-any: error`), no unhandled rejections (a Playwright console listener fails the test)
