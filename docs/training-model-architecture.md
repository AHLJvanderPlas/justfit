# JustFit Training Model Architecture

## Design Principle

One shared exercise library. Separate layers for protocols and programmes.

- **`exercises`** — atomic movements and fitness tests; reused by all coaches
- **`exercise_aliases`** — naming variants mapped to canonical exercises
- **`workout_protocols`** + **`workout_protocol_steps`** — structured interval sessions
- **`program_templates`** + **`program_template_items`** — multi-week schedule templates

Current app code continues to read `exercises`, `cycling_workouts`, and `session_templates` without change. The new tables are purely additive.

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

### `cycling_workouts`

**Keep current table.** It is actively used by the cycling coach in `plan.js` and has cycling-specific fields (`tss_estimate`, `intervals_json` with power percentages) that don't map cleanly to generic `workout_protocols` steps yet.

Future path: when the cycling coach is refactored (Phase 3b+), map each `cycling_workouts` row to a `workout_protocols` entry with `sport = 'cycling'` and `protocol_type = 'interval'`. Maintain `cycling_workouts` as a compatibility view or keep both in sync until cutover.

### `defensie-exercise-catalogue-import-ready.json`

Source for future import into **`exercises`**.

107 entries, normalized to JustFit canonical schema. 4 entries flagged `needs_review: true` (load unspecified — require human sign-off before import).

Import script: write a one-off migration (`0044_defensie_exercises.sql`) that INSERTs all 107 entries using `INSERT OR IGNORE` to avoid conflicts with any already-present slugs.

### `defensie-matrix-clean.json`

Source for future import into **`program_templates`** + **`program_template_items`**.

Structure: `schema`, `cluster`, `week`, `day`, `sessionType`, `exercises[]` (ordered).

Mapping:
- One `program_templates` row per cluster (e.g., "Opleiding Cluster 1")
- One `program_template_items` row per entry in `exercises[]`
- Where the item is a single exercise → `item_type = 'exercise'`, `exercise_id` = matching canonical slug
- Where the item is a multi-step run session → `item_type = 'protocol'`, `protocol_id` = matching `workout_protocols` entry

Import script: write `0045_defensie_program.sql` after exercises are imported.

### Current code-driven military scheduler (`plan.js`)

**Keep as-is.** The scheduler in `plan.js` builds military plans dynamically from the `exercises` table using tag filtering. It is not yet backed by `program_templates`.

Future path (Phase 2): replace the code-driven tag filter with a `program_templates` lookup. The engine reads the relevant template for the user's cluster/week, expands it to a session, then applies the existing check-in adaptation logic. The adaptation rules (`adaptExistingPlan`) remain unchanged.

---

## Migration Order (Intended)

| Migration | Contents | Status |
|-----------|----------|--------|
| 0043 | `exercise_aliases`, `workout_protocols`, `workout_protocol_steps`, `program_templates`, `program_template_items` | ✅ applied |
| 0044 | Enforce UNIQUE index on `exercise_aliases.alias` | ✅ applied |
| 0045 | Import 103 resolved military exercises → `exercises` | ✅ applied |
| 0046 | 87 exercise aliases for name variants | ✅ applied |
| 0047 | 13 program templates + 1867 template items from military matrix | ✅ applied |
| 0048 | Import 4 deferred exercises + 52 missing template items | ⬜ pending (trainer sign-off required) |
| 0049+ | Cycling coach refactor — map `cycling_workouts` → `workout_protocols` | ⬜ deferred (Phase 3b) |

---

## Deferred

- Importing JSON catalogues into DB (0044, 0045)
- Replacing `cycling_workouts` with `workout_protocols`
- Rewriting military scheduler to use `program_templates`
- Any planner changes (plan.js reads `exercises`, `session_templates`, `cycling_workouts` — unchanged)
