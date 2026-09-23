# CabOS: Design System and Experience Spec

> Tokens here are exact and are the contract for `apps/web/src/styles/tokens.css` (Tailwind v4 `@theme`, ADR-013). Every contrast figure below was **computed** (WCAG 2.x relative luminance) in Phase 0, and P1 adds a unit test (`tokens.contrast.test.ts`) that recomputes them from the CSS so they cannot regress.

---

## 1. Design principles

1. **Legible at arm's length in sunlight.** Cab text is at least 18 px, and numerals are condensed and tabular. Daylight theme contrast is ≥ 7:1 for all text. Nothing depends on hover.
2. **Calm until it matters.** At rest the cab is quiet: graphite surfaces with one yellow action. Colour, size, motion and sound escalate **only** with severity, so an operator learns that change means attention.
3. **Motion carries meaning.** Every animation says one of: *arrived*, *changed*, *moved from there to here*, *escalated*. Decorative motion is limited to the landing page.
4. **Coach, don't police.** The operator sees their own data first, with evidence and a next step. Non-attributable causes (waiting for a truck, sensor faults, telemetry gaps) are visibly **not** the operator's fault.
5. **Show the evidence.** Every number can answer "why?" and "from how much data?". Thresholds show provenance, and forecasts show their factors.
6. **Honest by default.** Low data says "low data". Uncalibrated says "uncalibrated". Confounded says "confounded". There is no chrome for unbuilt features.
7. **Three things per screen.** Cab screens have at most three primary actions. Everything else is one tap deeper.
8. **Performance is aesthetic.** Only transform and opacity animate. Skeletons are content-shaped. Values tween and never jump.

---

## 2. Design tokens

### 2.1 Colour: ramps

**Ink / graphite (dark themes)**

| Token | Hex | Use |
|---|---|---|
| `--ink-950` | `#07090B` | deepest (radar background, landing) |
| `--ink-900` | `#0B0E11` | app background (Cab Night) |
| `--ink-850` | `#12161A` | surface |
| `--ink-800` | `#1A1F24` | raised surface, cards |
| `--ink-700` | `#232A30` | pressed / selected |
| `--ink-600` | `#2A3138` | border |
| `--ink-500` | `#3A434B` | strong border, dividers on raised |
| `--ink-400` | `#56606A` | disabled icon |
| `--ink-300` | `#8B96A0` | tertiary text (6.42:1 on 900) |
| `--ink-200` | `#A7B0B8` | secondary text (8.80:1) |
| `--ink-100` | `#D5DBE0` | body on raised |
| `--ink-50` | `#EEF1F3` | primary text (17.06:1) |

**Paper (light themes)**

| Token | Hex | Use |
|---|---|---|
| `--paper-0` | `#FFFFFF` | surface |
| `--paper-50` | `#F6F6F2` | app background (Cab Daylight) |
| `--paper-100` | `#ECECE6` | sunken / wells |
| `--paper-200` | `#DCDCD4` | border |
| `--paper-300` | `#BDBDB3` | strong border |
| `--paper-500` | `#8F8F86` | disabled |
| `--paper-700` | `#4A4D51` | tertiary text (7.84:1 on 50) |
| `--paper-800` | `#3A3C3F` | secondary text (10.21:1) |
| `--paper-950` | `#0E0F10` | primary text (17.71:1) |

**Accent: Signal Yellow** (original; hue about 57°, distinct from Caterpillar gold at about 48°)

| Token | Hex | Notes |
|---|---|---|
| `--signal-400` | `#F3EC6A` | hover on dark |
| `--signal-500` | `#EDE33B` | **primary fill**. Ink text on it: 14.42:1 |
| `--signal-600` | `#CFC521` | pressed |
| `--signal-ink` | `#544C00` | "yellow" as **text** on paper (8.04:1) |

Rule: Signal Yellow = *primary action / selected / live data line*. It never means caution.

**Semantic** (text-safe values per theme)

| Role | Night (on `#0B0E11`) | Daylight (on `#F6F6F2`) | Fill for banners |
|---|---|---|---|
| safe | `#3DDC97` (10.95) | `#055C35` (7.49) | Night fill `#113524` / Day fill `#DDF2E6` |
| caution | `#FFB020` (10.58) | `#6E4000` (8.09) | `#FFB020` + ink text (10.58) |
| danger | `#FF7A70` (7.62) | `#961A13` (7.90) | `#3A1412` (night) / `#FBE3E1` (day) |
| stop | `#FF3B30` fill + ink text (5.46, display-size only) | `#C4211A` fill + white text (5.87, display-size only) | full-screen |
| info | `#5AB0FF` (8.38) | `#0C4A99` (7.89) | `#0F2336` / `#E1ECFA` |

**Data-viz palette** (Okabe-Ito derived, colour-blind safe, **yellow removed** to avoid colliding with the accent; order is fixed)

| # | Night | Daylight | Name |
|---|---|---|---|
| 1 | `#56B4E9` | `#0072B2` | sky / blue |
| 2 | `#E69F00` | `#A65F00` | orange |
| 3 | `#2FB58A` | `#00785A` | green |
| 4 | `#CC79A7` | `#A34E83` | purple |
| 5 | `#D55E00` | `#B34700` | vermillion |
| 6 | `#A7B0B8` | `#4A4D51` | neutral (baseline, planner) |

Charts never rely on hue alone: series also differ in dash or marker, and legends are inline labels at line ends.

### 2.2 Themes

| Theme | Who | Base | Text / contrast target | Density |
|---|---|---|---|---|
| **Cab Night** (default cab) | operator, dusk to dawn | ink-900 | AA on every surface (weakest: tertiary text 5.5:1 on raised cards; 6.4:1 on the background) | cab (large) |
| **Cab Daylight** | operator, sun up | paper-50 | **AAA ≥ 7:1 all text** | cab (large) |
| **Office** | supervisor, trainer | paper-0 / paper-50 (Office Dark variant = Night tokens) | AA (secondary `#5B6168` 6.26:1, tertiary `#62686F` 5.2:1) | compact |

**Auto-switch:** Cab themes switch at local sunrise and sunset, computed client-side from site lat/lon (NOAA algorithm, no network) with a ±20 min hysteresis. A manual override lasts until the next boundary. The switch cross-fades over 560 ms and never happens during an active ALARM, Stop or Danger alert (it waits).

Implementation: `<html data-theme="cab-night|cab-day|office|office-dark" data-density="cab|compact" data-glove="true|false">`, with tokens as CSS variables per `[data-theme]`.

### 2.3 Typography

Fonts are self-hosted via `next/font`: **Geist** (UI), **Geist Mono** (telemetry, tabular), **Barlow Condensed** 500/600/700 (big cab numerics), **Instrument Serif** italic (landing editorial accents only). `font-feature-settings: "tnum" 1, "ss01" 1` on every element whose digits update.

| Token | Family | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `display-2xl` | Geist | 128/112 (clamp 64→128) | −0.045em | 600 | landing hero |
| `display-xl` | Geist | 88/84 | −0.04em | 600 | landing sections |
| `display-serif` | Instrument Serif it. | 88/84 | −0.02em | 400 | landing accents |
| `numeral-xl` | Barlow Condensed | 96/88 | −0.01em | 600 | cab hero KPI, P50 |
| `numeral-lg` | Barlow Condensed | 64/60 | 0 | 600 | cab KPIs |
| `numeral-md` | Barlow Condensed | 40/40 | 0 | 500 | tiles |
| `h1` | Geist | 40/44 | −0.025em | 600 | page title |
| `h2` | Geist | 28/34 | −0.02em | 600 | section |
| `h3` | Geist | 22/28 | −0.01em | 600 | card title |
| `body-cab` | Geist | **20/30** | 0 | 450 | cab body (min 18) |
| `body` | Geist | 16/24 | 0 | 400 | office body |
| `body-sm` | Geist | 14/20 | 0 | 400 | office secondary |
| `label` | Geist | 13/16 | +0.04em uppercase | 550 | eyebrows, chips |
| `mono` | Geist Mono | 15/22 | 0 | 450 | evidence values, IDs |
| `mono-sm` | Geist Mono | 13/18 | 0 | 450 | tables |

Cab density maps `body → body-cab`, `h3 → 26/32`, `label → 16/20`.

### 2.4 Space, radii, borders, elevation, blur, layers, grid

- **Spacing** (4 px base): `0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`, as tokens `--space-0 … --space-32` (index = px/4).
- **Radii:** `--r-xs 4` (chips), `--r-sm 8` (inputs), `--r-md 12` (buttons), `--r-lg 16` (cards), `--r-xl 24` (sheets, cab hero), `--r-full 9999`.
- **Borders:** 1 px hairline (`--ink-600` / `--paper-200`); 2 px for focus and selected; 4 px left **severity rail** on alert rows.
- **Elevation** (dark themes rely on surface lightness plus a subtle top highlight, not heavy shadow):
  - `--e1: 0 1px 0 0 rgb(255 255 255 / .04) inset, 0 1px 2px rgb(0 0 0 / .4)`
  - `--e2: 0 1px 0 0 rgb(255 255 255 / .05) inset, 0 8px 24px -8px rgb(0 0 0 / .6)`
  - `--e3: 0 1px 0 0 rgb(255 255 255 / .06) inset, 0 24px 64px -16px rgb(0 0 0 / .7)`
  - light: `--e1: 0 1px 2px rgb(14 15 16 / .06)`, `--e2: 0 8px 24px -8px rgb(14 15 16 / .12)`, `--e3: 0 24px 64px -16px rgb(14 15 16 / .18)`
- **Blur:** `--blur-sheet 16px` (bottom sheets, command palette), `--blur-hero 40px` (landing glow). Never over live data.
- **Z-index layers:** base 0 · sticky 10 · dropdown 20 · sheet 30 · toast 40 · alert-banner 50 · **safety-overlay 60** (Stop / Danger full-screen) · director 70 (demo) · devtools 80.
- **Grid:** desktop 12-col, 24 px gutter, 32 px margins, max 1440. Tablet (cab 1280×800) **8-col**, 16 px gutter, 24 px margins. Phone 4-col, 16 px gutter/margins. Breakpoints: `sm 640, md 900, lg 1200, xl 1440`.

### 2.5 Motion

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80 ms | press feedback |
| `--dur-fast` | 120 ms | hover, toggles, chip changes |
| `--dur-base` | 200 ms | cards in/out, value tweens |
| `--dur-slow` | 320 ms | sheets, route content |
| `--dur-slower` | 560 ms | theme cross-fade, onboarding reveals |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | entrances |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | moves |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | exits |
| `spring.press` | stiffness 700, damping 35, mass 0.6 | buttons, cards |
| `spring.layout` | stiffness 380, damping 36 | shared-element, reorder |
| `spring.gentle` | stiffness 170, damping 26 | ring progress, ticker |
| `stagger.list` | 40 ms (max 8 items, then 0) | lists |
| `stagger.hero` | 80 ms | onboarding and deck reveal |

**Value tweens:** numbers tween over 200 ms (`spring.gentle` for KPIs). If more than 5 updates arrive per second, they snap without tweening to avoid lag.
**Reduced motion** (`prefers-reduced-motion: reduce` or the in-app setting): all translations and scales become 0 ms opacity fades (≤ 120 ms), there are no parallax, Lenis, grain or custom cursor, and the radar sweep becomes static. **Alert escalation stays fully visible, audible and haptic**; only its motion is removed.

### 2.6 Iconography and sound
- Icons: Lucide at 1.75 stroke, 24 px office and 32 px cab, plus custom glyphs (seatbelt, tail swing, UWB tag, excavator top-down).
- Sound (Web Audio, synthesised, no files needed): `chime.warn` (two tones 660→880 Hz, 120 ms each) · `tone.alarm` (880 Hz square, 250 ms on / 250 ms off) · `tone.stop` (continuous 1 kHz with 4 Hz amplitude modulation) · `tick.confirm` (soft 1.2 kHz 30 ms). Audio unlocks at onboarding step 5.
- Haptics (`navigator.vibrate`, when supported): warn `[80]` · caution `[60,60,60]` · danger `[200,100,200]` · stop `[400,100,400,100,400]` repeated every 1.5 s · confirm `[20]`.

---

## 3. Component hierarchy (per route)

```
RootLayout (fonts, ThemeController, IntlProvider, QueryClientProvider, RealtimeProvider, Toaster)
├── (marketing) MarketingShell  [Lenis, GrainOverlay, CustomCursor(desktop)]
│   └── /  LandingPage
│       ├── Hero: KineticHeadline · LiveTelemetryLine(real replay of sample data) · MagneticCTA("Explore demo site")
│       ├── ScrollNarrative "One machine. Five minds." (sticky) → NarrativeStep×5 [Deck, Guardian, Pulse, Forecast, Academy] each with a live MiniWidget
│       ├── BentoGrid: MiniRadar · MiniWaterfall · MiniIdleSplit · MiniSeatbeltRing · MiniPassport  (all driven by demo API)
│       ├── ImpactTickers (computed from the active dataset: idle L saved, alerts, coverage…)
│       ├── ArchitectureStrip (Mermaid-derived SVG) · DataStudioCallout
│       └── Footer ("Designed for Cat® machine operators", body text only)
├── (onboarding) OnboardingShell [ProgressRail, SkipLink, ResumeState(persisted)]
│   └── /onboarding/[step]: Splash · RolePicker · IdentityScan(QRScanner | CodeEntry | OperatorPicker) · MachinePair(QRScanner, MachineCardFlip) · Calibration(QuestionCard×3, FactorChipMoment) · CabSetup(ThemePreview, GloveToggle, ChimeTest, HapticTest) · Walkaround(MachineDiagram, Hotspot×n, DefectSheet(PhotoCapture)) · SeatbeltHandshake(BeltRing)
├── (cab) CabShell  [SafetyLayer(AlertBanner, SafetyOverlay, LinkLostBanner), CabNav(3 tabs + NearMissButton), ConditionsStrip, PTTCopilotButton, OfflineChip]
│   ├── /cab  ShiftDeck
│   │   ├── KpiRow: KpiTile(idle%, fuel L, cycles/h, CO₂ kg, SafetyScore) [stale state]
│   │   ├── TaskTimeline: TaskCard×n (P50Bar, P90Whisker, ProgressFill, OverrunChip) → TaskDetail (shared element) : FactorWaterfall · ConditionsDelta · ReforecastLog
│   │   └── NextUpCard · CoachCard (latest attributable anomaly with suggested action)
│   ├── /cab/guardian  GuardianView: ProximityRadar(canvas) · SeatbeltStatePanel(SM diagram, timers) · ConditionsLimits · FatigueTimer · SensorHealthList
│   ├── /cab/me  MyPulse: IdleSplitDonut · IntervalTimeline · AnomalyList(AnomalyCard: evidence, threshold provenance, action) · EpisodeCard
│   ├── /cab/academy  AcademyHome: RecommendedRail(because-chips) · SkillPassport · ModuleGrid
│   │   ├── /cab/academy/lesson/[slug]  CardStack(LessonCard×n, ProgressDots)
│   │   ├── /cab/academy/drill/[slug]   ScenarioDrill(BranchNode, ChoiceButton×2–3, Outcome)
│   │   ├── /cab/academy/sim            SwingSim(canvas, TouchJoystick, ScoreHUD)
│   │   └── /cab/academy/book           SlotPicker(DayStrip, SlotList), BookingSheet
│   ├── (overlay) NearMissSheet: HoldToLogButton → IncidentComposer(VoiceDictation | TextField, SeverityPicker, BlackBoxPreview)
│   └── /cab/debrief  Debrief: SummaryCard · WinCard · TipCard · SustainabilityLine · AckButton
├── (office) CommandShell  [SideNav, SiteSwitcher, DatasetBadge, CommandPalette(⌘K), LiveAlertTray]
│   ├── /command  Overview: AlertFeed(live) · FleetGrid(MachineTile) · KPI strip · PlanVsActualMini
│   ├── /command/anomalies  AnomalyInbox(filters, AnomalyRow → AnomalyDetail(evidence, raw intervals chart))
│   ├── /command/incidents  IncidentBoard(columns = lifecycle) → /[id] IncidentDetail(BlackBoxPlayer, StructuredFields, AuditTimeline, TransitionBar)
│   ├── /command/plan       PlanVsActual(ratio distribution, per type/operator, model card link)
│   ├── /command/coaching   CoachingCards(per operator: episodes → recommended modules → verify deltas)
│   ├── /command/sustainability  Ledger(group-by switch, idle L → ₹ → kg CO₂, waiting vs discretionary stacked)
│   ├── /command/model      ModelCard(honest mode, registry, Retrain)
│   └── /command/thresholds ThresholdTable(provenance, override with reason)
├── (office) TrainerShell → /trainer: Curriculum(SkillTree) · SlotManager · EvidenceReview
├── (office) /studio  DataStudio: DropZone → MappingTable(ColumnMapRow: source, target select, confidence, samples) → ValidationReport(counts, rule hits, quarantine table) → ImportProgress → DataProfile(distributions, coverage heatmap, HypothesisCard×8, UnlockedCapabilities) · DatasetSwitcher
├── /director  ScenarioDirector [demo only]: ScenarioButton×10 · CascadeLog(correlation_id events) · ClockControl(speed)
└── /design  StyleGuide: TokenSwatches(with computed contrast) · TypeScale · Motion playground · every component in all states and themes
```

**Primitives** (shadcn/Radix copied and restyled): Button (primary, secondary, ghost, danger; sizes office-md / cab-lg / glove-xl), IconButton, Toggle, Switch, Tabs, Sheet, Dialog, Tooltip (office only), Toast, Chip, Badge, Progress, RingProgress, Skeleton, Table, Select, Combobox, Slider, Kbd, Separator, ScrollArea.

---

## 4. State management map

| Kind | Tool | Owner | Keys / shape | Invalidation / notes |
|---|---|---|---|---|
| **Server state** | TanStack Query | route components | `['ds', datasetId, 'shift', shiftId]`, `['ds', datasetId, 'kpis', shiftId]`, `['ds', datasetId, 'anomalies', filters]`, `['ds', datasetId, 'forecast','model']`, `['incidents', filters]`, `['academy','recs', operatorId]`, `['imports', id]`, `['conditions', siteId]` | `dataset.activated` → `invalidateQueries({queryKey:['ds']})`; WS `forecast.updated` → `setQueryData(['ds',ds,'shift',id])` patch; `incident.status_changed` → invalidate `['incidents']`; `training.recommended` → invalidate recs |
| **Realtime state** | Zustand `realtimeStore` (normalised) | `RealtimeProvider` (single WS) | `safety[machineId] = {seatbelt, proximity, unattended, sensorHealth, since}`, `alerts: Record<id, Alert>` + `order[]`, `radar[machineId]` (latest frame, not reactive to all; the canvas reads via `subscribe` outside React), `link: {status, lastHeartbeat, lagMs}` | Frames validated by generated zod; snapshot replaces, events apply via **pure reducers** (`alertReducer`, `safetyReducer`, Vitest-tested) |
| **Local UI** | React state / `useReducer` | component | sheet open, wizard step, hold-progress | — |
| **Cross-route UI** | Zustand `uiStore` | CabShell | glove mode, theme override, audio unlocked, copilot listening | persisted subset |
| **Offline queue** | IndexedDB (`idb`) + `outboxStore` | `OutboxProvider` | `{id, idempotencyKey, route, body, createdAt, attempts, lastError}` | drains on `online` and WS reconnect; FIFO; exp backoff 1→30 s; UI chip count |
| **Persisted prefs** | server `PATCH /me/preferences` + localStorage mirror | `PreferencesProvider` | locale, theme, glove, audio, haptics | server wins on login |
| **Onboarding progress** | localStorage + server shift state | OnboardingShell | step, answers | resumable |

Rule: the **radar canvas and simulator never re-render React per frame**. They read the store imperatively inside `requestAnimationFrame`.

---

## 5. Interaction specs and micro-interactions

**Task card.** At rest: title, family glyph, planner estimate in mono, a P50 bar (solid, `--signal-500` at 70% for the active task and neutral for others) with a P90 whisker (1.5 px line with a cap). Progress fill grows from the left in real time. **Overrun chip** appears when `elapsed > P50` (caution) or `elapsed > P90` (danger), with a 120 ms scale-in from 0.9. Press uses `spring.press` scale 0.98. Tap opens a **shared-element transition** (Motion `layoutId`) to TaskDetail, where the bar becomes the waterfall's final bar. When a re-forecast arrives, the bar and whisker animate with `spring.layout`, a 2 px signal-yellow flash underlines the changed number for 600 ms, and a "Re-forecast: rain" chip appears once.

**Alert banner escalation.** One banner slot at the top of CabShell. Levels change the **height** (56 → 72 → 96 → full-screen overlay), **fill** (surface + rail → caution fill → danger fill → stop fill), **sound** and **haptic** (§2.6). Escalation changes instantly (≤ 80 ms), with no easing on colour. De-escalation is a 200 ms fade. Banners never slide, bounce or shake. Content reads action first ("Fasten seatbelt"), then reason and timer ("Unbuckled 00:14 · alarm at 00:30"). Stop and Danger overlays block the other UI, except the near-miss button and "Acknowledge" (ack silences sound for 10 s but never clears the state).

**Radar.** A canvas 2D top-down view. The machine glyph sits at the centre and rotates with the swing angle. Four concentric zone rings (Aware, Caution, Danger, Stop) are drawn with semantic strokes; their radii tween when condition multipliers change (320 ms, "zones expand in rain" is a visible story). The tail-swing arc is a filled wedge at 15% opacity. Tags are dots with a 3 s trail and a label showing `8.2 m · 3.1 s`. A closing tag draws a vector arrow. A static 1 px ring scale with metre labels. There is no rotating radar sweep (decorative); a slow sweep appears only on the landing mini-widget. It is accessible via a parallel live region listing the nearest 3 tags every 2 s, or on change of level.

**Factor waterfall.** Horizontal steps: `Planner 45` → factor bars (positive = danger-tinted to the right, negative = safe-tinted to the left) → `P50 52` bar in signal yellow → P90 whisker. Bars grow in sequence (`stagger.list`). Each label reads "+14% · Rain". Tapping a bar shows its evidence ("learned from 412 rainy tasks; 38% prior"). Low confidence adds a hatched pattern and a "Low confidence: new task type" chip.

**Near-miss button.** Always visible in CabNav (bottom right, 72 px, 96 px in glove mode). It is **press-and-hold 800 ms** with a ring progress (`spring.gentle`) and a haptic tick at 0 and 800 ms. Releasing early cancels, with the ring retracting in 200 ms. On completion a sheet opens with the time already stamped, the black box already frozen ("Last 120 s captured ✓"), and a voice-dictation button focused. It works offline (queued chip).

**Card-stack lessons.** 3–7 cards, each at most 25 words plus one visual. Swipe or tap-right advances with a spring throw and the next card lifts from the stack by 8 px. The final card is a single check question; the answer shows immediate feedback and the skill node it feeds. Progress dots are tabular ("3/6").

**Scenario drill.** A node shows a situation image or diagram and 2–3 large choices. Each choice reveals a consequence and a "better because" line, and branches up to 3 levels. The score favours safe choices over fast ones.

**Swing simulator controls.** A left virtual joystick (swing left/right) and a right slider (boom), or keyboard A/D/W/S. The machine has inertia (spring model), so smoothness is scored as jerk RMS. A pedestrian entering the zone triggers the real `proximity` scoring function (compiled logic shared by porting the same parameters; a Vitest test checks parity with Python fixtures). The score has three bars: Safety, Smoothness and Completion. Safety dominates the total.

**Seatbelt ring (onboarding step 7 and Guardian).** An amber ring pulses slowly (1.6 s, opacity 0.6↔1, disabled under reduced motion). The live `belt=fastened` event fills it green clockwise in 560 ms, then the deck reveals with `stagger.hero`.

---

## 6. Cab ergonomics

- Minimum touch target **56 px** (glove mode **72 px**) with at least 8 px spacing. The near-miss button is 72/96 px.
- Minimum body text **18 px** (default 20). Numerals ≥ 40 px for glanceable KPIs.
- No hover-dependent UI; tooltips become tap-to-reveal info sheets.
- **Reach zones** (landscape tablet, mounted right of the operator): primary actions in the bottom-right quadrant, safety and near-miss bottom right, navigation along the bottom edge, and read-only information top left. On phone, primary actions are bottom-centre.
- One primary (yellow) action per view, at most three primary actions per screen.
- Glove mode: larger targets, swipes replaced by buttons, drag thresholds doubled, hold durations unchanged.
- Audio and haptic per level are in §2.6. Volume ducks for non-critical sounds while an ALARM or Stop is active.

---

## 7. Data view states (every view implements all five)

| State | Pattern |
|---|---|
| **Loading** | Content-shaped skeletons (task card skeleton = bar and whisker shapes) with a 1.2 s shimmer (static under reduced motion). No spinners except inline on buttons. |
| **Empty** | A one-line truthful reason plus a next action, e.g. "No anomalies this week. Idle is 12% below your baseline." or "No task history loaded, import in Data Studio." |
| **Error** | Inline problem card with the `code`, a retry, and what still works ("Forecasts use the last model (v7)."). |
| **Offline** | Top chip "Offline · 3 queued"; data shows its last-synced time; mutations queue. |
| **Stale** | Values dim to 60% with an "as of 14:02 (6 min ago)" stamp and a reason chip (telemetry gap or link lost). Safety state that is stale shows the red **link lost** banner (ADR-021), never a stale green. |

---

## 8. Accessibility

- WCAG 2.2 AA everywhere, **AAA text contrast in Cab Daylight**.
- Focus: a 2 px ring in `--signal-500` plus a 2 px ink offset on dark. On paper, the ring is `--paper-950` 2 px with a signal-yellow 2 px outer ring (yellow alone on paper is 1.24:1, so it is never the only indicator). `:focus-visible` only.
- Screen readers: alert banners use `role="alert"` for ALARM and above and `aria-live="polite"` for Warn/Caution. The radar has a textual equivalent. Charts have a `<table>` fallback and summaries ("P50 52 min, 16% over planner").
- Target size ≥ 24 px office (2.5.8) and 56 px cab. No drag-only interactions (2.5.7): the simulator joystick has button alternatives.
- `lang` switches with locale, and Hindi uses Noto Sans Devanagari (subset, `next/font`) with a +2 px size bump for legibility.
- Reduced motion per §2.5. Sound always has a visual equivalent, and haptic is never the only channel.

---

## 9. Onboarding (under 90 s) timing and visuals

| Step | Target time | Key visual |
|---|---|---|
| 0 Splash | 1.5 s | Mark (a stylised cab-window glyph) morphs into the "CabOS" wordmark; site-local greeting |
| 1 Role | 5 s | Three tactile cards with press depth (translateY 2 px + e1→e0) |
| 2 Identity | 10 s | Camera viewfinder with a corner-bracket animation; fallback tabs "Enter code" / "Pick operator" |
| 3 Machine | 10 s | The machine card flips in (rotateY 180°, 560 ms) showing model, engine hours, last service and tail-swing radius |
| 4 Calibration | 15 s | 3 question cards → a factor chip "Beginner +22% → your estimates are personalised" animates into a mini waterfall |
| 5 Cab setup | 10 s | Theme preview tiles, glove toggle, "Tap to hear the danger chime", haptic test |
| 6 Walkaround | 25 s | Top-down machine diagram with 7 hotspots; pass is one tap, flag opens a sheet with camera |
| 7 Seatbelt | 5 s | The ring goes amber → green on the live signal; the deck reveals |

In demo mode the "Explore demo site" link (visible from the splash onward) sets up a seeded operator (Ravi K., fictional), machine and shift, runs the walkaround as "demo-skipped" with a watermark, and lands on the Shift Deck.

---

## 10. Landing page direction (`/`)

- Hero: `display-2xl` headline in two lines, with the second in Instrument Serif italic ("The operating system *for the cab.*"). One continuous **live telemetry line** (SVG path) draws across the hero from the **real replayed sample** (idle ratio per interval), with the spike at 05-01 10:00 annotated "Unbuckled while idle". Film grain is an SVG turbulence overlay at 4% opacity. The magnetic CTA uses a 40 px pull radius and a spring return.
- Sticky scroll narrative "One machine. Five minds.": the left column holds the sticky mini-device, the right column has 5 steps. Each step swaps the device content via a Motion layout animation (Deck → Guardian radar → Pulse episode → Forecast waterfall → Academy passport). Scroll-driven progress uses CSS `animation-timeline: view()` where supported and falls back to IntersectionObserver.
- Bento: every tile is a live mini-widget fed by the demo API, never a screenshot.
- Number tickers count up once when in view (the values are computed, e.g. "3.65× fuel per cycle when unbuckled · n = 4 · sample").
- Page transitions: View Transitions API (Next `unstable_ViewTransition` when stable, otherwise Motion `AnimatePresence`).
- Budget: LCP < 2.0 s, CLS < 0.02, JS for landing < 170 kB gzip, Lighthouse ≥ 90 (perf, a11y, best practices, SEO).

---

## 11. Living style guide `/design`

Renders: every token (swatches with **computed** contrast against each theme background, pass/fail badges), the type scale in each density, spacing and radii rulers, the motion playground (durations and springs on a demo card, with a reduced-motion toggle), and every primitive and domain component in all states (rest, hover, pressed, focus, disabled, loading, empty, error, stale) × all four themes × glove on/off. It doubles as the visual-regression target (Playwright screenshots per theme in P8).

---

## 12. Copy and i18n

- Voice: short, verb-first and specific. "Fasten seatbelt", not "Please ensure your seatbelt is fastened". Numbers are always shown with units and n.
- Namespaces: `cab.*` (all Cab Mode strings, **en + hi required**), `office.*` (en; hi optional), `landing.*` (en). Keys are structured for `ta` (Tamil) with an empty catalogue and fallback to en.
- Numbers and dates go through `Intl` with the site timezone and `en-IN` / `hi-IN` locales (lakh grouping for ₹).
