# Planner audit — rules, guardrails, and the road to "oiled machine"

**Date:** 2026-10-02
**Scope:** `functions/api/plan.js` (73 rule codes), the exercise library (482 active rows),
and the client surfaces that render planner output.
**Trigger:** a `fat_loss` session consisting of three rucksack marches, each prescribed as
2 × 18 s although their names read 25, 30 and 40 minutes.

---

## 0. Verdict

The engine is not internally consistent. The audit found **five contradictions and two
guardrails that did nothing at all**. All seven are fixed and deployed. Beyond those, there
are **eight structural weaknesses** that are not bugs today but will keep producing this
class of failure until they are addressed. They are listed in §4 with a sequenced plan.

The single most important lesson is in §1: for weeks, two rules printed their reasoning into
the user-facing explanation panel while changing nothing about the session. Every guard
passed. The guards were reading source text, and source text is not behaviour.

---

## 1. The mental model you need before reading any rule

`runPlanner` is a six-stage pipeline threaded by one mutable `ctx`:

```
_initPlannerContext   → builds ctx, pool = [...exercises], resolves goal/budget/BMI
_applySafetyPolicies  → R510–R518, R545/R546, R555–R558, R562–R565, R583, R596, R999
_applyBodyModePolicies→ R520–R526 (cycle), R530–R544 (pregnancy/postnatal)
_selectCoachBlueprint → R556/R557/R570–R582 (coach takes over the session)
_selectExercises      → R595 → category filter → SHUFFLE → R550/R551/R560/R594
                        → R590 → R593 → R598 → R597 take → selection
_assembleSession      → R501/R502/R512/R521/R524/R525/R534/R541/R591/R592 → steps
```

**The critical boundary.** At `plan.js:2204`:

```js
let shuffled = seededShuffle(filtered, date);   // derived from ctx.pool, ONCE
...
: _takeVaried(shuffled, count, ctx);            // plan.js:2502 — the session
```

`shuffled` is derived from `ctx.pool` exactly once. The session is taken from `shuffled`.
**Any write to `ctx.pool` after line 2204 is read by nobody.** R590 and R593 both did exactly
that. They pushed their trace lines, which the user saw, and changed no session.

This is now enforced by smoke check `A-F1`, which fails on any `ctx.pool` write between the
derivation and the take. There is also `scripts/planner-behaviour.mjs`, which runs the real
planner over a fixture of real library rows and asserts on the produced **steps**.

### The volume chain — read this before tuning anything

Reps and durations are scaled in four independent places, multiplicatively:

| Order | Rule | Factor | Applies to | Traced? |
|---|---|---|---|---|
| 1 | R512 | ×0.6 when energy ≤ 3 | reps + duration | yes |
| 2 | R502 | ×0.8 beginner / ×1.0 / ×1.2 advanced | reps + duration | reps only — **duration leg is silent** |
| 3 | R521 | `ctx.volumeMultiplier` (accumulates R511 ×0.85, R558 ×0.75, R520, R536) | reps + duration | contributors trace, **the application does not** |
| 4 | R524 | `1/√(weight/70)`, clamped 0.7–1.3 | bodyweight reps only | **entirely silent** — and it runs AFTER `reps = clamp(3, 30)`, so it can prescribe 2 reps |

R525 is a fifth silent modifier of a different kind: it *appends* a mobility exercise to
every female user's main session, changing the session's shape with no trace at all.

Then `reps = clamp(3, 30)`. Sets come from `GOAL_SETS_BASE[goal] + expSetMod[expLevel]`,
clamped 1–5.

**Worked example — the account that triggered this audit** (beginner, 110 kg, 190 cm,
sleep ≤ 5 h, returning from a 17-day break):

```
R502 experience   × 0.80
R511 poor sleep   ≤ 0.85  ┐ combined with Math.min, NOT multiplied:
R558 return ramp  ≤ 0.75  ┘ ctx.volumeMultiplier = 0.75 (the lower wins)
R524 body weight  × 0.80   (1/√(110/70) = 0.798)
                  ─────────
total on reps     × 0.48
```

A prescribed 10 reps becomes 5. The user is told about **two** of the three multiplicative
layers. R502's duration leg and R524 are invisible, and R524 is the one with a counter-intuitive
sign: it *reduces* volume precisely for the heavier user who is already being de-loaded by two
other rules. Nothing caps the stack — add R512 (energy ≤ 3, ×0.6) and it reaches ×0.29.

> **Correction (2026-10-03).** The first version of this section multiplied R511 and R558
> (×0.6375) and gave ×0.41. The code combines the situational de-loads with `Math.min`
> (`plan.js`: R511 and R558 both write `Math.min(ctx.volumeMultiplier, …)`), so the lower one
> wins and they never stack with each other. Three multiplicative layers, not four. Both
> Wave 1 and Wave 2 agents caught this independently when they ran the real planner.
> The structural finding — a stack with no floor and two silent layers — is unchanged.

**Recommendation (§4.2): make the stack visible and bounded.**

---

## 2. Rule-by-rule evaluation

Legend — **Effectiveness**: does it do what it claims, reliably?
**Value**: is it worth its complexity? **Risk**: contradiction, overlap or silent behaviour.

### 2.1 Context and counting

| Rule | Does | Effectiveness | Value | Risk |
|---|---|---|---|---|
| R500 | Goal → initial intensity | Works | High — one honest starting point | Reads `prefs.training_goal` (column). `App.jsx:1830` reads `prefs.preferences.training_goal`, which is **never written** → always falls back to `health`. **Split-brain, unfixed.** |
| R500a | `intensity_pref` 1–10 caps intensity | Works | Medium | Undocumented in CLAUDE.md |
| R501 | Exercise count from budget/goal/experience | Works | High | No label; invisible to the user |
| R502 | Experience scales reps + duration | Works | High | Duration leg untraced (§1) |
| R999 | Blocked weekdays → rest | Works | High — real-life fit | Numbered outside every family; easy to miss |

### 2.2 Daily life adaptations (R510–R518) — the core value of the app

| Rule | Does | Effectiveness | Value | Risk |
|---|---|---|---|---|
| R510 | ≤10 min / no_time → micro | Works | **Highest** | — |
| R511 | Sleep ≤5 h → low + ×0.85 | Works | High | Compounds untraced (§1) |
| R512 | Energy ≤3 → ×0.6 | Works | High | Compounds untraced |
| R513 | Stress ≥7 → mobility bias | Works | High | — |
| R514 | Pain ≥2 general → rest | Works | **Highest (safety)** | Hard rest with no "I'd still like to move" path — see §5 |
| R515 | No clothing → stealth filter | Works | Medium | — |
| R516 | Equipment filter | Works | **Highest** | `equipment = null` silently means bodyweight-only. Correct, but never explained |
| R517 | Low mood → moderate | Works | Medium | No label |
| R518 | Location profile, keeps wider pool if too few | Works, has a floor | High | Good model — **copy its floor discipline everywhere** |

**Verdict:** this family is the product. It is also the best-built part of the engine.

### 2.3 Cycle and body mode (R520–R526, R530–R544)

| Rule | Effectiveness | Value | Risk |
|---|---|---|---|
| R520–R523 | Work | High | — |
| R524 | Works | **Questionable** | Silent; wrong-signed for heavy users; compounds (§1). **Recommend: trace it, or drop it** |
| R525 | Works | Medium | Appends mobility for female users only, **with no trace** — the session gains an exercise the user is never told about, and the sex-based rationale is undocumented |
| R526 | Works | High | — |
| R530–R537 (pregnancy) | Work | **Highest (safety)** | Pure filters with no floor — if filters empty the pool there is a fallback, but it is late and broad |
| R539 | Blocking clearance gate | Works | **Highest** | Correct: the one rule that should block |
| R540–R544 (postnatal) | Work | Highest | Same floor concern |

### 2.4 Running, BMI and return (R545/R546, R555–R559, R568, R583)

| Rule | Effectiveness | Value | Risk |
|---|---|---|---|
| R545/R546 | BMI caution bands | High | Warns loudly when BMI is unknown — good |
| R555 | Replaces unguarded runs with level-appropriate intervals | **Partially effective** | High | `isRunVolumeExercise` matches only `running_shoes` equipment or a `running` tag. The marches (`walking`/`march`, equipment `none`) were never caught. R596 now removes them for civilians, but **the hole remains for any future long-cardio family that is not tagged `running`.** See §4.3 |
| R556/R557 | Run/cycling coach programmes | Work | High | Large surface, well isolated |
| R558 | ≥14-day gap → ×0.75 | Works | High | Compounds untraced |
| R559 | Recovery mode | Works | **Highest** | — |
| R568 | Polarised balance | Works | Medium | — |
| R583 | BMI 28–30 pace note | Works | Low–Med | Note only |

### 2.5 Injury (R562–R565)

Works. High value. `R562` is a comment header only — the label exists in `messagePolicy` but
nothing emits it, so the *first* injury rule is unexplainable to the user while R563–R565 are
fine. Low severity, trivial fix.

### 2.6 Military (R570–R582)

Self-consistent and well isolated: the coach takes full control and bypasses R510–R565 by
design (R581), with check-in signals partially overriding (R574). **Value is high for its
audience and near-zero for everyone else** — which is exactly why its exercises leaking into
civilian sessions was so damaging. None of R570–R577 has a user-facing label.

### 2.7 Progression and bias (R550–R554, R560/R561, R590, R593/R594)

| Rule | Effectiveness | Value | Risk |
|---|---|---|---|
| R550 | Loads profile | High | — |
| R551 | Gap-axis prioritisation | Works | **High** | Reorders `shuffled` correctly. It was R551 that pushed the three marches to the front — correct behaviour over a bad pool |
| R552/R554 | Explanatory traces | Work | Medium | — |
| R553 | Mobility decay note | Works | Medium | — |
| R560/R561 | Sport bias + mobility injection | Work | Medium | Only when `bias_enabled` |
| **R590** | Fatigue reorder | **Was inert — fixed** | High | Now reorders `shuffled` and exports `fatiguedIds` |
| **R593** | DCP movement priority | **Was inert + ungated — fixed** | High | Now gated on `dcpCardVisible` and respects `fatiguedIds` |
| R594 | DCP target bias | Works | High | Emits no trace unless it adjusts |

### 2.8 Assembly (R591, R592, R595–R598)

| Rule | Effectiveness | Value | Risk |
|---|---|---|---|
| R591 | Warm-up sets | Works | Medium | — |
| R592 | Supersets under time pressure | Works | Medium | Only with an explicit time budget |
| **R595** (new) | Drops exercises longer than the session | Works | **High** | Impossible before migration 0112 |
| **R596** (new) | Civilian pool isolation | Works | **High** | Splits on protocol vs movement, not on the `military` tag |
| **R597** (new) | One exercise per movement family | Works | **High** | Family = trailing noun of the slug |
| **R598** (new) | Self-assessment inside training | Works | **High** | Must run after R593 or R593 displaces its pin |

---

## 3. What was wrong, and what is now true

| # | Finding | Status |
|---|---|---|
| 1 | R590 + R593 wrote `ctx.pool` after the selection list was derived — inert | **Fixed** |
| 2 | 153 of 247 timed exercises had no `base_duration_sec` → all `?? 30`; 57 stated minutes only in their name (731 min invisible); `isLongCardio` (`>300`) could never fire | **Fixed** — migration 0112 + `fixed_duration` + R595 |
| 3 | R593 gated on `dcp.enabled` while the card used `dcpCardVisible` → a switched-off DCP steered the plan | **Fixed** |
| 4 | No variety guard — selection was a flat top-N | **Fixed** — R597 |
| 5 | `military` was never filtered *out* of civilian pools | **Fixed** — R596 |
| 6 | `dcp.last` read in four places, written by none; the assessment screen was unreachable (a click event was passed where a config object was expected) | **Fixed** — R598 + `recordDcpMeasurement` |
| 7 | `functions/` had **never been linted** — that is why a plain `ReferenceError` (PLAN-500) reached production | **Fixed** — root `eslint.config.js`, `no-undef` as an error |
| 8 | `App.jsx:1830` reads `prefs.preferences.training_goal`, never written | **Open** — §4.1 |
| 9 | 23 rules emit traces with no label; `parseRuleTrace` iterates `RULE_LABELS`, so they are **silently dropped** from "Why this plan?" | **Open** — §4.2 |
| 10 | R524, R525 and the R502 duration leg change volume or session shape invisibly | **Open** — §4.2 |
| 11 | CLAUDE.md documents a `user_profile` table that **does not exist** in D1 | **Open** — §4.6 |
| 12 | `alternatives_json` covers 29% and is asymmetric; `primary_muscles_json` empty on 74 rows (70 cardio) | **Open** — §4.4 |

---

## 4. The road to "oiled machine"

Ordered by payoff per unit of risk.

### 4.1 Make settings single-sourced *(small, do first)*

There are two readable goal fields and only one is written. Fix `App.jsx:1830`, then add a
smoke guard asserting no client file reads `prefs.preferences.training_goal`.

The general rule to adopt: **every setting has exactly one storage location and one read
path.** Today `training_goal`, `experience_level`, `sex`, `weight_kg` and `height_cm` live as
*columns*, while coach configuration lives in `preferences_json`. That split is fine — what is
not fine is reading a column's value from the JSON blob. Write a one-page map of
setting → column-or-JSON-key → reader, and guard it.

### 4.2 Make every adaptation explainable *(medium, highest user-visible payoff)*

Principle 4 says the planner must be explainable. Right now 23 of 73 rules are structurally
invisible, and two more change volume with no trace at all.

1. Add `RULE_LABELS` entries for all 23 (R500, R501, R517, R518, R570–R577, R583, R590–R598, R999).
2. Make R502's duration leg, R524 and R525 emit traces. R525 is the most important of the
   three: it silently *adds* an exercise, so the session the user sees does not match the
   session the rules explain.
3. **Add a single "volume summary" line** rather than four separate ones. The user does not
   need four multipliers; they need: *"Today's volume is 41% of your baseline: less sleep,
   back after a break, and your experience level."* Build it from the accumulated factors.
4. Add a guard: every `ctx.trace.push` whose text starts `R\d{3}` must have a `RULE_LABELS`
   entry. This is a cheap source scan and it closes the category permanently.

### 4.3 Replace tag-based safety with property-based safety *(medium, prevents recurrence)*

R555 asks "is this tagged `running`?" when the question it means is **"is this a long
continuous cardio effort that this user is not conditioned for?"** The marches slipped
through because they answered no to the former and yes to the latter.

Now that migration 0112 gives every timed exercise a real duration, rewrite the guard as a
property test:

```js
const isLongContinuousCardio = (ex) =>
  ex.category === 'cardio'
  && !hasTags(ex, 'session_phase', 'run_warmup', 'intervals')
  && (metricsOf(ex).base_duration_sec ?? 0) >= LONG_CARDIO_SEC;   // 600
```

Then cap by conditioning score and BMI regardless of what the exercise is called. Keep
`isRunVolumeExercise` only for the narrow job of swapping in `run-interval-level-N`.

**This is the single highest-leverage structural change in the document.** The same reasoning
applies to R596: it currently splits on `military` + category/equipment/`fixed_duration`,
which works, but the honest property is "this is a programme prescription, not a movement".
Consider a `protocol` tag seeded once, so the predicate becomes data rather than heuristics.

### 4.4 Fix the library's structural data *(medium, unblocks several rules)*

- `primary_muscles_json` is empty on 74 rows, 70 of them cardio. This degrades R592
  (supersets), the in-session muscle map, and any future family logic.
- `alternatives_json` covers 29% and is asymmetric — A lists B, B does not list A. It is
  currently unusable as a similarity signal, which is why R597 had to derive families from
  slugs. Make it symmetric in a migration, then R597 can prefer curated data and fall back to
  the slug heuristic.
- Add `protocol` and `measurable` tags so R596 and R598 stop inferring.

### 4.5 Bound the volume stack *(small, safety-relevant)*

Four independent multipliers with no combined floor can reach ×0.41 (and lower — R512 alone
would take it to ×0.25). At some point the session stops being training. Add:

```js
ctx.volumeFloor = 0.5;   // never prescribe less than half of baseline without saying so
```

If the stack would go below the floor, clamp it and **say so explicitly**: *"Today is a very
light day"* is a legitimate coaching statement; a silent quarter-session is not.

### 4.6 Make the docs match the database *(small, prevents the next schema incident)*

`CLAUDE.md` documents a `user_profile` table that does not exist; `user_preferences` carries
`sex`, `height_cm`, `weight_kg` instead. CLAUDE.md's own guardrail says code and database must
agree and that migration files are not a reliable source of truth. Regenerate the schema
section from the live database and add it to the smoke scan.

### 4.7 Extend behavioural testing *(medium, compounding payoff)*

`scripts/planner-behaviour.mjs` currently asserts four properties. Extend it to a matrix of
~20 personas (pregnant T2, postnatal caesarean, military K3, BMI 32 beginner, injured knee,
10-minute budget, no equipment, DCP due …) × assertions (no contraindicated tag present,
session fits the budget, pool never empty, every step has a duration or reps, no duplicate
family, volume above floor). This is the test that would have caught every single finding in
§3, and it runs in under a second.

### 4.8 Decide what R524 is for *(small, needs your judgement)*

It silently cuts a 110 kg user's bodyweight reps by 20%. There is a defensible argument
(bodyweight work is harder at higher mass) and a counter-argument (it compounds with three
de-load rules and tells the user nothing). Either trace it and exempt it from the other
multipliers, or remove it. **Do not leave it silent.**

---

## 5. User override — "my own training"

> *"Being able to adapt to the user's preferences or circumstances is the core value of the app."*

Agreed — and today the escape hatch is thin. `WhyNotModal` offers exactly two options:
regenerate, or take a rest day. There is no "I'll do something else", which means the moment
the check-in vocabulary does not fit the user's circumstance (a hotel gym with one bench, a
training partner's programme, a physio's prescription), the app has nothing to offer.

### 5.1 Principles for the override

1. **The user is the authority on their circumstances.** The planner is a default, not a gate.
2. **Safety advises, it does not silently edit.** A user-authored session keeps its warnings;
   it does not get quietly rewritten. Blocking stays blocking only where there is a genuine
   clearance question (R539, pregnancy contraindications), and even then it is an explicit
   acknowledgement, not a wall.
3. **Anything performed counts.** A user-built session must feed progression, streak,
   consistency and awards identically. If it does not count, it will not be used.
4. **Overrides are durable.** A user-authored plan must survive the next automatic
   regeneration. This is a real risk today: the auto-generate path would overwrite it.

### 5.2 Three distinct needs (do not conflate them)

| Need | Today | Proposed |
|---|---|---|
| **A. Adjust within the session** | Partial — swap exercise, ±2 reps, ±10 s | Keep. Add "remove this exercise" and "add one more" |
| **B. Replace the session entirely** | **Missing** | Session builder + saved templates |
| **C. Log something done elsewhere** | Partial — bonus session | Keep; let it reuse the builder for detail |

**B is the gap.** The rest of this section designs it.

### 5.3 Functional design — the builder

**Entry points**
- Today card → "Can't do this today?" → third option: **"Ik doe iets anders"**.
- Coach tab → **"Mijn trainingen"** → list of saved templates, create / edit / delete.
- After a template exists: Today card shows **"Gebruik mijn training"** as a one-tap action.

**Building a session**
- Search the library, filtered by the user's equipment by default with a "show everything"
  toggle (their circumstances may differ from their profile — that is the entire point).
- Add an exercise → sets, and reps **or** duration, and rest. All three pre-filled from the
  library, which is now possible because migration 0112 gave every timed exercise a real
  `base_duration_sec`.
- Reorder by drag; remove by swipe.
- **Live estimated time** using the existing `estimateMins`, shown against the user's budget.
- Save as: **Use today** / **Save as template** (named) / both.

**Hybrid mode — the one worth building**
"Pin these, fill the rest." The user pins 1–3 exercises they want; the planner completes the
session to budget using the normal rules. This is the highest-value variant because it keeps
the coaching while honouring the user's intent, and it is a small addition once `custom_steps`
exists: seed `shuffled` with the pinned rows and let `_takeVaried` finish.

**Safety surface**
Run the safety rules in **advisory mode**: evaluate, collect, do not mutate.

- Pregnancy/postnatal contraindications, injury-loaded tags, and the BMI/run bands produce an
  inline amber note on the offending exercise.
- R539 (clearance) and pregnancy hard contraindications require an explicit checkbox
  acknowledgement before the session can be saved; record `safety_ack_ms` on the plan.
- Everything else (volume multipliers, variety, gap axis, DCP bias) simply does not apply —
  a user-authored session is the user's prescription.
- If a DCP measurement is due (R598), **offer** to append the two measurement sets rather than
  inserting them silently.

### 5.4 Technical design

**Storage — reuse what exists**

`day_plans.generated_by` already exists and is `'engine'` on all 118 rows. A user-authored
plan is the same shape with `generated_by = 'user'`:

```jsonc
{
  "session_name": "Hotel bench session",
  "slot_type": "main",
  "intensity": "moderate",
  "authored_by_user": true,
  "steps": [ /* identical step shape */ ],
  "rule_trace": ["USER — Je hebt deze sessie zelf samengesteld"],
  "safety_notes": [ /* advisory, from the advisory pass */ ],
  "safety_ack_ms": null
}
```

**New table for reusable templates** (migration `0113`):

```sql
CREATE TABLE user_session_templates (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT NOT NULL,
  steps_json    TEXT NOT NULL,
  est_minutes   INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX idx_ust_user ON user_session_templates(user_id);
```

**API**

| Endpoint | Purpose |
|---|---|
| `GET /api/my-sessions` | list templates |
| `POST /api/my-sessions` | create / update (`{id?, name, steps[]}`) |
| `DELETE /api/my-sessions?id=` | remove |
| `POST /api/plan` with `custom_steps` | install as today's plan |

`POST /api/plan` with `custom_steps` must:

1. Verify every `exercise_id` exists and is active — never trust client-supplied step bodies.
2. Clamp `sets` 1–10, `target_reps` 1–100, `target_duration_sec` 5–7200, `rest_sec` 0–600.
3. Fill `rest_sec` from `getDefaultRest` where absent.
4. Run the **advisory** safety pass and attach `safety_notes`.
5. Persist with `generated_by = 'user'`, `engine_version = 'user-authored'`.
6. Be **exempt from the C-G4 daily cap** — same reasoning as `force_assessment`: the cap makes
   *re-rolling the engine's suggestion* a paid feature; authoring your own session is not that.

**Protecting the override — the part that is easy to get wrong**

The auto-generate path currently replaces today's plan. It must not overwrite user-authored
work:

```js
const existing = await env.DB.prepare(
  'SELECT generated_by FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1'
).bind(user_id, date).first();
if (existing?.generated_by === 'user' && !body.replace_user_plan) {
  return Response.json({ ok: true, saved: true, plan: storedPlan });
}
```

Replacing it must be an explicit user action with a confirmation.

There is a second, subtler trap in the same upsert. It currently reads:

```sql
ON CONFLICT(user_id, date) DO UPDATE SET plan_json=excluded.plan_json, updated_at_ms=...
```

`generated_by` is **not** in the `DO UPDATE SET` list. So if the engine ever overwrites a
user-authored plan, the row keeps `generated_by = 'user'` while holding engine content — and
every check built on that column silently starts lying. Add `generated_by=excluded.generated_by`
to the update list in the same change, whichever way the overwrite question is decided.

**Progression**

No change required. `updateProgression` reads steps from the *execution*, and custom steps
reference real `exercise_id`s, so `progGetExerciseAxis` resolves normally and the radar,
streak, score and awards all behave identically. **This is why v1 should be library-only.**

Free-text exercises ("my physio's rotator cuff routine") are a v2 feature, and when added they
must be honest: no progression credit, stated plainly in the UI, because the engine cannot map
an unknown movement to an axis.

**Guards to add alongside**

- A user-authored plan survives an auto-generate cycle (behavioural).
- `custom_steps` with an unknown `exercise_id` is rejected with 400.
- Out-of-range sets/reps/duration are clamped, not stored raw.
- The advisory pass produces notes for a knowingly contraindicated session rather than
  silently dropping the exercise.

### 5.5 Suggested sequencing

| Phase | Scope | Why this order |
|---|---|---|
| 1 | `custom_steps` on `POST /api/plan` + overwrite protection + builder UI reachable from "Can't do this today?" | Delivers the whole core value in one step |
| 2 | `user_session_templates` + "Mijn trainingen" + one-tap reuse | Turns a one-off into a habit |
| 3 | Hybrid "pin + fill" | Highest coaching value, small delta once phase 1 exists |
| 4 | Schedule a template on chosen weekdays | Replaces the engine for users who want a fixed split |

Phase 1 is the one that matters. Everything after it is convenience.

---

## 6. Guard inventory after this audit

Smoke went from 53 to 62 checks. The ones added here:

| ID | Asserts |
|---|---|
| A-F1 | No rule writes `ctx.pool` after the selection list is derived |
| C-F16a | Named durations are exempt from volume scaling (`metrics.fixed_duration`) |
| C-F16b | R595 removes over-length exercises without starving the pool |
| C-F16c | R596 keeps Defence protocol work out of civilian sessions, with a floor |
| C-F16d | R597 families group variants without collapsing distinct movements |
| C-F17a | R598 schedules the assessment **and** `execution.js` writes `dcp.last` back |
| C-F17b | A forced assessment is exempt from the free daily cap |
| C-F17c | Measurement sets are emitted unscaled as max-effort |
| C-F18 | **Behavioural** — runs the real planner and asserts on the produced steps |
| — | `functions/` is linted with `no-undef` as an error |

Every one was verified by reintroducing the failure it is meant to catch and confirming it
fails. That step is not optional: the two rules at the centre of this audit were covered by
guards that could not fail.
