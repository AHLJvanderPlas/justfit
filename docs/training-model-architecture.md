# JustFit Training Model Architecture

## Design Principle

One shared exercise library. Separate layers for protocols and programmes.

- **`exercises`** — atomic movements and fitness tests; reused by all coaches
- **`exercise_aliases`** — naming variants mapped to canonical exercises
- **`workout_protocols`** + **`workout_protocol_steps`** — structured interval sessions
- **`program_templates`** + **`program_template_items`** — multi-week schedule templates

All three structured coaches (Military, Cycling, Running) now have content represented in the unified model. See **Current runtime boundary by coach** below for what is DB-backed, what remains code-driven, and what fallbacks are still intentionally in place.

---

## What Goes Where

### `exercises` — atomic movements / tests

An entry belongs here if it is:
- A single repeatable physical movement (squat, push-up, marching, zone-2 run)
- A fitness test (Cooper 12-min, FTP ramp)
- Something the planner pool can select independently

**Not** here:
- A structured multi-step interval session ("4×4 min VO₂max + 3 min recovery")
- A workout that sequences exercises in a specific order with specific rest
- A programme week/day schedule

### `exercise_aliases` — naming variants

Used to link alternate names to a canonical exercise row. Examples:
- `Burpees` → `burpee` (plural)
- `Hand Release Push Up` → `hand-release-push-up` (capitalisation)
- `Marsten (6 km/u)` → `marsen-6-km-u-40-minuten` (typo correction)

Does not affect planner logic. Useful for import deduplication and search.

### `workout_protocols` + `workout_protocol_steps` — structured sessions

A protocol is a named, reusable session with ordered steps. Each step can reference an exercise or be a pure interval (no exercise reference needed).

Examples:
- "Defensie Zone 3 Intervals: 3×8 min @ zone 3, 2 min zone-1 recovery between"
- "Military Circuit A: Flutter kicks × 4 sets, Bird dog × 4 sets, Plank × 4 sets"
- "Running test: 12-minute Cooper test"

Steps carry: `step_type`, optional `exercise_id`, `duration_sec`, `distance_m`, `reps`, `sets`, `rest_sec`, `intensity_json`, `notes_json`.

### `program_templates` + `program_template_items` — programme schedules

A programme template maps weeks × days to exercises or protocols. One row per scheduled item.

Fields: `block_week` (1-based week within the block), `day_index` (0=Mon … 6=Sun), `session_order` (if two sessions in one day), `item_type` (`exercise` or `protocol`), then the FK.

---

## Current Sources — Migration Mapping

### Military data (migrations 0044–0049)

All 107 `defensie-exercise-catalogue` entries are imported into `exercises`. All 1919 Defensie matrix items are imported into `program_templates` (13 templates: Keuring Basis + K1–K6, Opleiding O1–O6) + `program_template_items`. See [docs/archive/2026-05-military-import.md](archive/2026-05-military-import.md) for full import detail.

### `cycling_workouts`

All 29 rows are mirrored in `workout_protocols` / `workout_protocol_steps` (migration 0051). `plan.js` (R557) reads from the protocol tables with `cycling_workouts` retained as a fallback.

Cross-reference convention:
- `workout_protocols.id` = `'wp-{cw_id}'` (e.g. `'wp-cw01'`)
- `tags_json` includes `'cw_ref:{cw_id}'` for stable lookup
- Cycling-specific fields not in the generic protocol schema (`tss_estimate`, raw `intervals_json`, `sub_goal`) are reconstructed at runtime by `buildCyclingWorkoutsFromProtocols()` from `intensity_json` + `notes_json` per step.

### Running Coach programme schedules (migration 0052)

Five `program_templates` (run-5km/10km/15km/20km/30km) + 140 `program_template_items` mirror the `RUN_PROGRAMS` JS constant. R556 reads from the DB with fallback to the embedded constant.

---

## Current runtime boundary by coach

### Military Coach (R570–R582)

| Component | Runtime source | Fallback |
|-----------|---------------|---------|
| Strength sessions (kracht / kracht_marsen / circuit) | `program_templates` + `program_template_items` (migration 0047–0049) | military-tagged exercise pool |
| Zone 2 run + interval sessions | Code-driven progressive level (R571–R572) | — |
| Cooper test session | Code-driven (block 1 of each 6-block cycle) | — |
| Block/phase/periodization scheduling | Code-driven (rolling block counter, R571) | — |
| Adaptation (check-in, injury, RPE drift) | Code-driven (R574, R576) | — |

### Cycling Coach (R557)

| Component | Runtime source | Fallback |
|-----------|---------------|---------|
| Workout pool (29 sessions) | `workout_protocols` + `workout_protocol_steps` via `buildCyclingWorkoutsFromProtocols()` | `cycling_workouts` table |
| Sub-goal / workout-type selection | Code-driven (CYCLING_PROFILES rotation, R557) | — |
| Interval scaling, TSS, coach note | Code-driven (scaleCyclingIntervals, calcCyclingTSS, buildCyclingCoachNote) | — |
| PMC / TSB autoregulation | Code-driven (computeCyclingTsb, R557b) | — |
| TCX / ZWO / ERG export | Client-side, reads `intervals_json` on plan step | — |
| `cycling_workouts` table retirement | Intentionally deferred — retained as fallback | — |

### Running Coach (R555–R556)

| Component | Runtime source | Fallback |
|-----------|---------------|---------|
| Programme schedules (5 targets × N weeks) | `program_templates` + `program_template_items` via `buildRunProgramsFromTemplates()` | `RUN_PROGRAMS` JS constant |
| Level exercises (21 levels: intervals + continuous runs) | `exercises` table (atomic, by slug) | — |
| Warm-up exercises + cooldown | `exercises` table (by tag / slug) | — |
| Week progression, experience offset, time-budget selection | Code-driven (R556) | — |
| Safe running build-up (R555) | Code-driven (conditioning score → level) | — |
| `RUN_PROGRAMS` constant retirement | Intentionally deferred — retained as fallback | — |

---

## Migration Order (Intended)

| Migration | Contents | Status |
|-----------|----------|--------|
| 0043 | `exercise_aliases`, `workout_protocols`, `workout_protocol_steps`, `program_templates`, `program_template_items` | ✅ applied |
| 0044 | Enforce UNIQUE index on `exercise_aliases.alias` | ✅ applied |
| 0045 | Import 103 resolved military exercises → `exercises` | ✅ applied |
| 0046 | 87 exercise aliases for name variants | ✅ applied |
| 0047 | 13 program templates + 1867 template items from military matrix | ✅ applied |
| 0048 | Resolve `hardlopen-zone-3-5-minuten` + 2 `program_template_items` (KC2/KC3) | ✅ applied |
| 0049 | Resolve 3 remaining deferred exercises + 50 missing `program_template_items` | ✅ applied |
| 0050 | Add Graaftest exercise (standalone assessment, not in matrix) | ✅ applied |
| 0051 | Bridge cycling_workouts → workout_protocols + workout_protocol_steps (29 protocols, 101 steps) | ✅ applied |
| 0052 | 5 Running Coach `program_templates` (5km/10km/15km/20km/30km) + 140 `program_template_items`; R556 reads from DB with fallback to `RUN_PROGRAMS` constant | ✅ applied |
| 0053 | Sport support tags on 59 exercises (`sport_support:running/cycling/rowing/swimming/walking/mixed`) | ✅ applied |
| 0054 | Sport mobility tags on 59 exercises (`sport_mobility:running/cycling/rowing/swimming/walking/mixed/general`) | ✅ applied |
| 0055 | `why` + `muscle_target` JSON fields on exercises (content-blocked, not yet used by planner) | ✅ applied |
| 0056 | Perimenopause mode — adds `'perimenopause'` to `cycle_profile.mode` CHECK constraint | ✅ applied |
| 0057+ | (next available) | ⬜ pending |

---

## Intentionally retained hybrid boundaries

Three fallbacks remain in place by design. "Done" for each coach means the migrated runtime boundary is established — full legacy retirement is intentionally deferred:

| Coach | Primary source (live) | Retained fallback | Retirement status |
|-------|-----------------------|-------------------|-------------------|
| Military (strength) | `program_template_items` via DB query | Military-tagged exercise pool | Deferred — fallback fires only when DB returns < 3 items |
| Cycling | `workout_protocols` + `workout_protocol_steps` | `cycling_workouts` table | Deferred — table not dropped; fallback fires when protocol pool is empty |
| Running | `program_template_items` (run-Nkm templates) | `RUN_PROGRAMS` JS constant | Deferred — constant retained; fallback fires when DB query returns nothing |

Progression, adaptation, and safety logic for all three coaches remains code-driven and is unaffected by the content source switch.
