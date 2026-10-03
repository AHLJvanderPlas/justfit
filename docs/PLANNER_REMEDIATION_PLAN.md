# Remediation plan — optimise the engine and fill the gaps

**Date:** 2026-10-03
**Companion to:** `docs/PLANNER_AUDIT_2026-10.md` (findings and rationale)
**This document:** what to build, in what order, with acceptance criteria and the guard that
keeps each fix from regressing.

Every scope figure below is measured against the live database and the current source, not
estimated. Effort is expressed in **deploys** (one deploy = code → `npm run smoke` → push →
`wrangler pages deploy` → live verification), because that is the unit this project actually
ships in.

---

## 1. The gaps, measured

| # | Gap | Measured scope | User-visible today? |
|---|---|---|---|
| **G1** | Settings split-brain | 1 real bug (`App.jsx:1830` reads `prefs.preferences.training_goal`, never written → always `health`); 1 harmless redundancy (`CoachView.jsx:735`) | Yes — wrong goal copy on the weekly summary |
| **G2** | Broken alternatives | 144 exercises offer alternatives; **16 have broken links**, **5 open a completely empty sheet**; 29 substitution targets do not exist in the library at all | **Yes — a control that does nothing** |
| **G3** | Explainability | 23 rules emit a trace with no `RULE_LABELS` entry → `parseRuleTrace` drops them silently; 4 modifiers change volume or session shape with no trace at all (R502 duration leg, R521 application, R524, R525) | Yes — "Why this plan?" is incomplete |
| **G4** | Unbounded volume stack | 3 multiplicative layers (situational de-loads combine with `Math.min` among themselves), no combined floor. Observed ×0.48; worst case ×0.29. **R524 runs after the rep floor and can prescribe 2 reps** | Yes — half-sessions with no explanation |
| **G5** | Tag-based safety | A duration-property test catches **36 long efforts** the `running` tag test misses. R595 already covers the over-budget subset, so the residual is "long effort that fits the budget but not the user's conditioning" | Latent |
| **G6** | Library structural data | 74 rows have no `primary_muscles_json` (70 of them cardio); substitution graph is 400 links, **21% reciprocated** | Degrades R592, muscle map, future family logic |
| **G7** | Behavioural test coverage | `planner-behaviour.mjs` asserts 4 properties over ~6 personas | No — but it is why bugs reach production |
| **G8** | R524 is a product decision | Silently cuts bodyweight reps ×0.7–1.3 by body mass | Yes, invisibly |
| **G9** | **No user override** | `WhyNotModal` offers exactly 2 options: regenerate, or rest. No "I'll do something else" | **Yes — the core-value gap** |
| **G10** | Schema docs drift | CLAUDE.md describes `auth_users`, `support_tokens`, `user_profile` as live tables; none exist. Code references are comments and a request-body field, not SQL — so this is **documentation only** | No |

---

## 2. Sequencing rationale

Three rules decided the order below.

**Live bugs before improvements.** G1 and G2 are things a user can hit today, and both are
small. They go first regardless of their strategic weight.

**The safety net before the structural work.** G7 is the reason this audit was necessary: the
two inert rules were "covered" by guards that could not fail. Extending the behavioural
matrix before changing R555, the volume stack or the library means every later wave is
verified by construction rather than by inspection. It is the highest-leverage *enabling*
work, so it comes before anything that edits planner logic.

**User value before engine polish, once it is safe to build.** G9 is the only item on this
list that a user would describe as a feature. Waves 3–5 make the engine more correct; G9
makes the app usable on a day the engine is wrong. Once the net is in place, G9 should not
wait behind library-data cleanup.

---

## 3. The plan

### Wave 0 — live bugs *(1 deploy, small, no risk)*

**W0.1 — fix the goal read.** `App.jsx:1830` → `prefs?.training_goal`. Normalise
`CoachView.jsx:735` to the column-first form while there.

**W0.2 — repair the substitution graph.** Migration: drop the 29 non-existent targets, and
for the 5 exercises left with nothing, either add a real substitute or remove the
`alternatives_json` entry so the UI does not offer a button that opens an empty sheet.

*Acceptance:* no client file reads a column-backed setting through `preferences`; every
substitution target resolves to an active exercise; no exercise advertises alternatives it
cannot show.
*Guards:* source scan for `preferences\??\.(training_goal|experience_level|sex|weight_kg|height_cm)`;
a data check that every `alternatives_json.substitutions` entry exists and is active.

---

### Wave 1 — the safety net *(1 deploy, medium, no production risk)*

**W1.1 — extend `scripts/planner-behaviour.mjs` to a persona × property matrix.**

Personas (~20): pregnant T1/T2/T3; postnatal immediate/rebuilding/caesarean; perimenopause;
military K3 target-mode; running coach wk 6; cycling coach build phase; BMI 32 beginner; BMI
19 advanced; injured knee; injured shoulder; pain ≥2 general; recovery mode; 10-minute
budget; 90-minute budget; no equipment; full gym; DCP due; returning after 30 days.

Properties asserted for every persona:
1. No contraindicated tag for the body mode is present in `steps`.
2. Total estimated time ≤ budget (within the existing overhead allowance).
3. Pool never empties — `steps.length >= 2` unless `slot_type === 'rest'`.
4. Every step has either `target_reps` or `target_duration_sec`, never neither.
5. No two steps share a movement family (unless the pool genuinely cannot fill it).
6. No step is longer than the whole session.
7. Volume is above the floor, or a trace explains why not *(lands with W3.2)*.
8. Every emitted `R\d{3}` trace has a `RULE_LABELS` entry *(lands with W2.1)*.

*Acceptance:* the matrix runs in under ~2 s and is wired into `npm run smoke`. Each property
is verified by deliberately breaking the rule that enforces it.
*Risk:* none — test-only.

> This wave pays for itself immediately: properties 7 and 8 become the acceptance tests for
> Waves 2 and 3, so those waves are verified rather than reviewed.

---

### Wave 2 — explainability *(1–2 deploys, medium, high user payoff)*

**W2.1 — label the 23 silent rules.** `R500, R501, R517, R518, R570–R577, R583, R590–R598,
R999`. Add a guard: every `ctx.trace.push` whose text matches `^R\d{3}` must have a
`RULE_LABELS` entry. This closes the category permanently rather than fixing 23 instances.

**W2.2 — make the four silent modifiers speak.** R502's duration leg, the R521 application
point, R524 and R525. R525 matters most: it *adds* an exercise, so the session shown does not
match the session explained.

**W2.3 — one volume sentence, not four multipliers.** Replace the per-rule noise with an
accumulated summary built from the factors:

> *"Vandaag 41% van je normale volume: minder geslapen, net terug na een pauze, en je niveau."*

*Acceptance:* every rule that fires appears in "Why this plan?" or is deliberately classified
as internal; the volume sentence matches the computed product within 1%.
*Guard:* property 8 from Wave 1, plus a unit check on the summary arithmetic.

---

### Wave 3 — structural correctness *(2 deploys, medium, needs one decision from you)*

**W3.1 — property-based long-cardio safety.** Rewrite the guard as a duration property now
that migration 0112 makes it answerable:

```js
const isLongContinuousCardio = (ex) =>
  ex.category === 'cardio'
  && !hasTags(ex, 'session_phase', 'run_warmup', 'intervals')
  && (metricsOf(ex).base_duration_sec ?? 0) >= LONG_CARDIO_SEC;   // 600
```

Cap by conditioning score and BMI regardless of what the exercise is called; keep
`isRunVolumeExercise` only for swapping in `run-interval-level-N`. Note the residual is
narrower than the raw 36 — R595 already removes anything over budget — so this is about the
long-but-fits case, not a live incident.

**W3.2 — bound the volume stack.** `ctx.volumeFloor = 0.5`. Clamp, and when clamped, say so.
A very light day is a legitimate coaching decision; a silent quarter-session is not.
**Also re-apply `reps = clamp(3, 30)` after R524** — today the floor runs first, so R524's
protective scaling can take a 3-rep floor to 2, which is the opposite of protection.

**W3.3 — R524 as designed in §4:** keep, trace as protection, leave inside the floored stack,
and prefer measured conditioning over the weight proxy where a measurement exists.

*Acceptance:* properties 1, 2 and 7 hold across all 20 personas; no persona receives a
continuous effort above its conditioning band.

---

### Wave 4 — **user override** *(3–4 deploys, large, the core-value gap)*

Full functional and technical design is in `PLANNER_AUDIT_2026-10.md` §5. Build order:

**W4.1 — `custom_steps` on `POST /api/plan`.** Server-side validation (exercise ids exist and
are active; sets 1–10, reps 1–100, duration 5–7200 s, rest 0–600 s), rest filled from
`getDefaultRest`, advisory safety pass attached as `safety_notes`, persisted with
`generated_by = 'user'`, exempt from the C-G4 daily cap.

Two things that are easy to get wrong and must land in this same deploy:
- The auto-generate path must not overwrite a user-authored plan.
- The upsert's `DO UPDATE SET` does **not** currently include `generated_by`, so an engine
  overwrite would leave the row labelled `'user'` while holding engine content. Add it.

**W4.2 — the builder UI.** Reachable from "Can't do this today?" as a third option. Library
search filtered by profile equipment with a "show everything" toggle, because the user's
circumstances may differ from their profile — that is the whole point. Live time estimate via
`estimateMins`. Save as *use today* and/or *save as template*.

**W4.3 — `user_session_templates` + "Mijn trainingen".** Migration `0113`, `GET/POST/DELETE
/api/my-sessions`, one-tap reuse from the Today card.

**W4.4 — hybrid "pin + fill".** The user pins 1–3 exercises, the planner completes to budget.
Small delta once W4.1 exists — seed `shuffled` with the pinned rows and let `_takeVaried`
finish. **This is the highest coaching value in the wave**: it keeps the engine's judgement
while honouring the user's intent.

*Acceptance:* a user-authored plan survives an auto-generate cycle; unknown `exercise_id` is
rejected with 400; out-of-range values are clamped, not stored; a knowingly contraindicated
session produces advisory notes rather than silently dropping the exercise; a custom session
feeds progression, streak and awards identically to a generated one.

*v1 constraint:* library exercises only. Progression resolves axes through `exercise_id`, so a
library-backed session needs no progression changes at all. Free-text exercises earn no
progression credit and therefore belong in v2, stated plainly in the UI rather than failing
quietly.

---

### Wave 5 — library data *(1–2 deploys, medium, unblocks later work)*

**W5.1 — `primary_muscles_json` for the 74 rows that lack it** (70 cardio). Unblocks R592
supersets, the in-session muscle map, and lets R597 prefer real data over the slug heuristic.

**W5.2 — make the substitution graph symmetric.** 400 links, 21% reciprocated. After W0.2
removes the dangling ones, mirror the rest so A↔B.

**W5.3 — seed `protocol` and `measurable` tags** so R596 and R598 read data instead of
inferring from category + equipment + `fixed_duration`.

---

### Wave 6 — documentation truth *(1 deploy, small)*

**W6.1** — regenerate CLAUDE.md's schema section from the live database; remove the three
ghost tables. **W6.2** — add a smoke check that every table named in CLAUDE.md's schema
section exists in D1, so this cannot drift again.

**W6.3 — regenerate the baseline.** `migrations/baseline/1020_seed_exercises.sql` is a
May-2026 snapshot of 416 rows and references **no migration after 0045**. The policy's
"add each data migration to the apply list" has not been followed since, by anyone — there is
no apply list to add to. Hand-patching the snapshot would reproduce the drift; regenerate it
from live D1 with the existing generator and add a smoke check that the baseline's row count
and the live row count agree within the migrations applied since generation.

**Held migration — resolved 2026-10-03.** `0114_cardio_primary_muscles.sql` was held, then applied
once both mappers were fixed and guarded. `progGetExerciseAxis` (plan.js) and `progExerciseToAxis` (execution.js) take the
first primary muscle that maps to an axis before falling back to category, so a run with
`["quads", …]` credits **Legs**, not Cardio. This is already true today for the three live
cardio rows that carry leg muscles (`easy-run-outdoor`, `tempo-run-outdoor`,
`weighted-march`); 0114 would spread it to 72 more. Fix both mappers so `category === 'cardio'`
always resolves to `conditioning`, add a guard, then apply 0114. Lands with Wave 3's merge,
because the plan.js mapper is in the file that agent is editing.

---

## 4. R524 — decided

**Intent (product owner, 2026-10-03):** *"The weight cut was to protect obese or heavy users
from unachievable goals and injuries. The weight indicates a lack of fitness, so a slow start
is recommended."*

So R524 is a **protective de-load, not a performance adjustment.** That settles the design:

- **Keep it.** The intent is sound and it is the only rule that slows the start for a
  deconditioned user who has not told the app anything else.
- **Trace it** (Wave 2), worded as a protective slow start rather than a penalty. The copy a
  heavier user reads matters.
- **Do not exempt it from the stack** — my earlier recommendation. If its job is protection,
  carving it out of the volume floor would defeat the point. Instead, **put the floor under
  the whole stack** (W3.2) so protection cannot silently become a quarter-session.

**One refinement worth making while in there.** Body weight is a *proxy* for deconditioning,
and it is the weakest signal available. The app now has two better ones: measured conditioning
from the progression model, and the self-assessment (R598). Where a real measurement exists,
prefer it; fall back to the weight proxy only when it does not. That honours the stated intent
(protect the deconditioned) while removing the case the proxy gets wrong — a heavy, genuinely
fit user being de-loaded for their mass alone.

Scope: small, lands with W3.2. Flagged rather than assumed, because it is a change of
behaviour and not merely of wording.

## 5. Recommended order

```
Wave 0  live bugs            █                      1 deploy   ← start here
Wave 1  behavioural matrix   ███                    1 deploy
Wave 4  user override        ████████████           3–4 deploys  ← biggest user value
Wave 2  explainability       ████                   1–2 deploys
Wave 3  structural           ██████                 2 deploys
Wave 5  library data         ████                   1–2 deploys
Wave 6  docs                 █                      1 deploy
```

Wave 4 is deliberately pulled ahead of 2, 3 and 5. Those three make the engine more correct;
Wave 4 makes the app usable on a day the engine is *wrong*, which is a better hedge while the
engine is still being repaired. It depends only on Wave 1 being in place, not on any of the
others.

If you would rather finish the engine before adding surface area, the alternative order is
0 → 1 → 2 → 3 → 5 → 4 → 6. That is the more conservative sequence and I would not argue
against it; it simply delays the thing you called the core value of the app.

---

## 6. Explicit non-goals

Worth stating so they do not creep in:

- **No new coach.** Principle 5 — one active intent. The override (Wave 4) is not a coach.
- **No free-text exercises in v1.** The engine cannot map an unknown movement to an axis, so
  it would either lie about progression or silently drop it.
- **No rule renumbering.** R999 sits outside every family and R568 was already renamed once
  after a collision. Renumbering now would invalidate `messagePolicy`, the smoke guards and
  every stored `rule_trace` in `day_plans`.
- **No change to the military block.** It is self-consistent and well isolated; its only real
  fault was leaking into civilian pools, which R596 fixed.
