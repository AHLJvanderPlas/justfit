# Fitness Assessment — Functional & Technical Design

**Status:** v1 built 2026-09-12 · migration `0100`
**Feature name:** *Assessment* internally, "Where you are" in the UI.

> **Naming.** The product already uses "check-in" for the daily mood/energy modal
> (`daily_checkins`, `api.getCheckins`). This feature is deliberately **not** called a
> check-in in code, to avoid collision. User-facing copy says "Where you are".

---

## 1. Problem

`user_progression` is entirely **inferred**. Completing a session grants stimulus
(`sets × 0.8` power, `minutes × 0.4` endurance); not training applies exponential decay.
Nothing is ever measured, and `baseline` — the per-axis decay floor — is hardcoded to `0`
for every user and **never written by any code path**.

Two consequences:

1. **Decay drains to zero.** Two weeks off implies no strength at all.
2. **Cold start is empty.** A new user's radar is meaningless until ~10 sessions.

## 2. What this feature is

A short, self-administered set of max-effort tests that **measures** four axes and writes
a personal `baseline`. It is a calibration of the existing progression model, not a second
score. The radar keeps working exactly as before.

### Scope — measured vs estimated

| Axis | v1 | Why |
|---|---|---|
| push | **measured** | push-up variants need no equipment |
| legs | **measured** | squats need no equipment |
| core | **measured** | plank needs no equipment |
| conditioning | **measured** | step/march test needs no equipment |
| pull | *estimated* | no honest bodyweight pull test exists without a bar or table |
| mobility | *estimated* | self-reported range of motion is self-report, not measurement |

Pull and mobility are rendered visibly as **not measured**. An explicit gap is more
trustworthy than a fabricated number (Principle 7, Principle 8).

## 3. Focus presets

The user's original five options mixed two taxonomies: *scope* (all-round / upper / lower)
selects which axes; *mode* (stamina / power) selects which sub-score. Shipped as one radio
group that leaves gaps — there is no "upper-body power". v1 resolves this by defining each
preset explicitly as a **(tests × emphasis)** pair, with duration shown:

| Preset | Tests | Emphasis | ~Duration |
|---|---|---|---|
| `all_round` | push · legs · core · conditioning | both | 12 min |
| `upper` | push · core | both | 7 min |
| `lower` | legs · core | both | 6 min |
| `stamina` | conditioning · legs · core | endurance | 9 min |
| `power` | push · legs · core | power | 7 min |

A two-dimensional picker (scope × mode) is deferred to v2.

## 4. The battery

All four tests use exercises already in the library, all with `metrics_json.supports`
declared, all equipment-free.

| Test | Exercise | Metric | Cap | Axis ← contribution |
|---|---|---|---|---|
| `push_max` | `wall-push-up` / `knee-push-up` / `push-up` by level | reps | 120 s or 60 reps | push.power 1.0 · push.endurance 0.6 |
| `legs_60s` | `squat` | reps in 60 s | 60 s | legs.power 1.0 · legs.endurance 0.8 |
| `core_hold` | `plank` | seconds | 240 s | core.endurance 1.0 · core.power 0.7 |
| `cond_3min` | `march-in-place` | reps in 180 s | 180 s | conditioning.endurance 1.0 · conditioning.power 0.5 |

**Push variant** defaults from `experience_level` (beginner → wall, intermediate → knee,
advanced → full) and is user-overridable at the start of the test. Raw reps are normalised
before scoring: wall × 0.35, knee × 0.6, full × 1.0.

## 5. Scoring

Raw value → 0–100 via a **piecewise-linear reference curve** per test
(`REFERENCE_CURVES` in `_shared/assessment.js`).

The curves are **coarse and deliberately conservative**. They are not a clinical norm and
are not age- or sex-adjusted. They exist so a first assessment produces a usable shape;
the honest signal is the **delta between your own assessments**, which needs no norm at
all. Every threshold is a visible constant, tunable in one place (Principle 4, Principle 8).

```
push-up (normalised reps) 0→0  5→20  10→35  20→55  30→70  45→85  60→100
squats / 60 s             0→0 10→20  20→35  30→55  40→70  50→85  60→100
plank (seconds)           0→0 20→20  45→35  75→55 120→70 180→85 240→100
march / 180 s             0→0 60→20 100→35 140→55 180→70 220→85 260→100
```

### Writing to progression

For each measured axis:

- `score = curve(raw)` → the measured capability now.
- `axis.power` / `axis.endurance` are raised to `max(current, score × weight)` —
  measurement supersedes inference only when it is **higher**. A bad day never
  deletes earned progression.
- `axis.baseline = round(score × BASELINE_RETENTION)` where `BASELINE_RETENTION = 0.75`.
  The baseline models what you retain through a layoff, so it sits below current
  capability. This is the value that stops decay draining to zero.

Unmeasured axes (pull, mobility) are left untouched.

## 6. Safety gating — mandatory

Max-effort testing is a safety event. `GET /api/assessment` returns `blocked` and the API
**refuses** a submission when any of these hold. Principle 3 outranks measurement.

| Condition | Source |
|---|---|
| pregnancy or postnatal mode | `cycle_profile.mode` |
| pain today ≥ 2 | today's `daily_checkins.checkin_json.pain_level` |
| recovery mode on | `checkin_json.recovery_mode` |
| sleep ≤ 5 h | `daily_checkins.sleep_hours` |

Blocked state is explained in the UI, never silent.

## 7. Cadence

`interval_weeks` defaults to **6**, matching the existing `ftp_test_interval_weeks` so the
product has one retest cadence concept rather than two. When the last assessment is older
than the interval, the Progress entry card shows a due hint. It nudges once and is
dismissible — it does not block or nag.

## 8. Placement

**Progress tab, directly above the radar.** That tab already answers "where am I"; Coach
answers "what am I doing". The thing being calibrated is immediately below the entry point.

Deliberately **not** on Today: Today carries one decision and one session (Principle 5); a
second call to action there competes with the session.

The runner is a **full-screen overlay**, the same pattern as `WorkoutView`, so it never
competes with navigation while a max-effort set is running.

## 9. Technical design

### Data

```sql
-- migration 0100
CREATE TABLE fitness_assessments (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  date           TEXT NOT NULL,          -- YYYY-MM-DD
  focus          TEXT NOT NULL,          -- all_round|upper|lower|stamina|power
  results_json   TEXT NOT NULL,          -- [{test_id, raw, variant, score}]
  scores_json    TEXT NOT NULL,          -- {axis: score}
  created_at_ms  INTEGER NOT NULL
) STRICT;
CREATE INDEX idx_fitness_assessments_user ON fitness_assessments(user_id, created_at_ms DESC);
```

Progression baselines are written into the existing `user_progression.scores_json`; no new
column. A `user_progression_events` row of type `assessment` records before/after.

### Modules

| File | Responsibility |
|---|---|
| `functions/api/_shared/assessment.js` | presets, battery, reference curves, scoring, axis mapping, safety gate |
| `functions/api/assessment.js` | `GET` status/history · `POST` submit |
| `packages/client-app/src/AssessmentView.jsx` | full-screen runner (focus picker → tests → results) |
| `packages/client-app/src/HistoryView.jsx` | entry card + last result, above the radar |

`AssessmentView` is its own component rather than a `WorkoutView` mode: a test counts *up*
to exhaustion with no target, while `WorkoutView` is built around prescribed sets/reps.
Forcing one into the other would complicate the most safety-critical screen in the app.

### API

`GET /api/assessment`
```json
{ "available": true, "presets": [...], "battery": {...},
  "last": { "date": "...", "focus": "...", "scores": {...}, "results": [...] },
  "previous": { ... }, "history": [...],
  "due": false, "days_since": 12, "interval_weeks": 6,
  "blocked": null, "push_variant_default": "knee-push-up" }
```

`POST /api/assessment` — `{ focus, results: [{ test_id, raw, variant? }] }`
→ scores, persists, updates baselines, returns `{ ok, scores, deltas, insights }`.

Both are session-cookie authed. Free for all accounts (Principle 1): knowing where you are
is the most basic question the product answers. The defensible paid line is **trend
history**, consistent with the existing 30-day history cap — not implemented in v1.

## 10. Foundation validation

| Principle | Check |
|---|---|
| 1 — free users get real value | Free. Not gated. |
| 3 — safety beats ambition | Hard gate on pregnancy/postnatal, pain, recovery, poor sleep. |
| 4 — planner must be explainable | Curves are visible constants; every score traces to one raw number. |
| 5 — one active intent | Overlay, not a Today CTA. Does not compete with the session. |
| 7 — every number must be correct | Deltas are exact. Absolute scores are labelled coarse, never clinical. |
| 8 — no hidden intelligence | No inference in scoring: raw → documented curve → score. |
| 11 — data austerity | One table, four numbers per assessment, deleted with the account. |
| 12 — lean architecture | Writes into the existing progression model; adds no parallel score. |

## 11. Deliberately out of v1

Pull and mobility measurement · population/age/sex-adjusted norms · the 2-D scope×mode
picker · trend charting over time · awards tie-in · trainer visibility of assessment results.
