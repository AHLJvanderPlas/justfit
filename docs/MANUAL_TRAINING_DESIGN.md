# Eigen training — functional design

**Date:** 2026-10-06
**Status:** Phase 1 built and live 2026-10-06. Phase 2 gated (see §8). Phase 3 pending real use. Companion to `PLANNER_AUDIT_2026-10.md` §5 (the override).

---

## 0. The ask, and what already exists

> "Add a small button for a manual training. From there: register one, reuse one we built in
> the past (or from your trainer's library), or create one on the spot. A created one should use
> the timer and counters from the training module."

What is already there, and where:

| Path | Exists? | Where today | Runs through WorkoutView? |
|---|---|---|---|
| **Create on the spot** | Yes (W4a) | "Lukt dit vandaag niet?" → "Ik doe iets anders" → builder → installed as today's plan | Yes — Start Session |
| **Reuse mine** | Yes (W4b) | "Gebruik mijn training" on the Today card, only when ≥1 template exists | Yes |
| **Register (log)** | Yes (Oct 5) | Deze Week → "Training loggen", today included | No — it records what was done |
| **Reuse trainer's** | Data + API only | `GET /api/client/assignments` returns programmes with `program_sessions.structure_json`; **0 rows live, no client execution path** | No |

So this is mostly **a framing and discoverability problem with one real gap**:

1. The entry is a *failure* door. "Can't do this today?" positions your own training as a
   fallback for when the coach's plan fails. Your framing is the right one: a first-class,
   always-available, deliberately small choice.
2. "Create on the spot" **always replaces** today's plan. There is no way to do your own session
   *in addition to* the coach's. The engine's bonus-session mechanism exists for exactly that —
   but only the engine can produce a bonus plan.
3. The trainer path is unbuilt on the client, and nothing has been authored on the trainer side.

---

## 1. Principles for this feature

- **Small, always present, never pushy.** It is not the main target. A quiet text control under
  the primary button, like "Lukt dit vandaag niet?" is now — which it absorbs.
- **Three verbs, one place.** Registreren · Hergebruiken · Samenstellen. Nothing else.
- **Extra by default, replace by choice.** Your own session should not silently throw away the
  coach's plan. The default is *alongside*; replacing is one explicit tap.
- **One execution surface.** Whatever the source — built, reused, assigned — if it is performed
  now, it runs through WorkoutView with the same timers, rep counters, rest rings and RPE. If it
  was already performed, it goes through the log sheet. No third way.
- **Everything performed counts.** Progression, streak, score and awards, identically.

---

## 2. The entry

**Today card, under START SESSION**, replacing the current "Lukt dit vandaag niet?":

```
┌──────────────────────────────────────────┐
│            START SESSION  →              │
└──────────────────────────────────────────┘
        Eigen training  ·  Lukt dit niet?
```

Two quiet text links on one line. "Eigen training" opens the chooser (§3). "Lukt dit niet?"
keeps the existing WhyNot sheet (regenerate / rest) minus its "Ik doe iets anders" option,
which moves into the chooser. On a **rest day** the line reads "Eigen training" alone. When
**today's plan is already user-authored**, the line reads "Eigen training" alone too (there is
nothing to regenerate).

Why one line and not a button: Principle 7 — the Today card has one job, and the primary
action must stay unambiguous. The control is discoverable because it is always there, not
because it is loud.

---

## 3. The chooser

A bottom sheet, three rows, each one tap:

```
  Eigen training
  ─────────────────────────────────────────
  ▸ Registreren          Iets gedaan zonder de app? Leg het vast.
  ▸ Hergebruiken         Mijn trainingen · Van je trainer
  ▸ Samenstellen         Nu een sessie bouwen en starten.
```

**Registreren** → the log sheet (`LogSessionSheet`) for **today**. Same two-phase flow as from
Deze Week. On save it records an execution dated today and returns to the Today card, which now
shows the session as completed. If a coach plan existed for today it is left in place and
marked done only if the user says so (see §6, "Plan done?").

**Hergebruiken** → a picker with two sections:
- **Mijn trainingen** — the user's templates (W4b), newest first, "N oefeningen · ~M min".
  Empty state: "Nog geen opgeslagen trainingen — bouw er een via Samenstellen."
- **Van je trainer** — sessions from active programme assignments, grouped by programme, with
  the next due session first. Only shown when the user has an active gym membership with an
  assignment. Phase 2 (§8).
Tapping a session goes to the **run-mode choice** (§4).

**Samenstellen** → the builder (`SessionBuilder`, planning mode: targets, not results). Its
primary action becomes **"Starten"** rather than "Gebruik vandaag", and goes to the run-mode
choice (§4). "Bewaar als sjabloon" stays as the quiet secondary.

---

## 4. Run-mode choice — the one new decision

Every performed-now path ends here, once:

```
  Hoe wil je dit doen?
  ─────────────────────────────────────────
  ▸ Als extra            Je plan van vandaag blijft staan.      ← default
  ▸ In plaats van        Vervangt "Fat Loss Circuit" voor vandaag.
```

Rules:
- **Default is "Als extra"** whenever a coach plan exists for today and is not yet completed.
- If today's plan is **already completed**, "Als extra" is the only option (there is nothing to
  replace) and the sheet is skipped.
- If today is a **rest day**, the options read "Als extra" (keeps the rest day on record,
  session saved as bonus) and "In plaats van rust". Default is "Als extra": a rest day the
  engine chose is usually R514/R559/R999 doing its job, and overriding it should be deliberate.
- If today's plan is **already user-authored**, "In plaats van" asks for the existing
  `replace_user_plan` confirmation (W4a) — the user is replacing their own work, say so.
- **Free tier:** both modes are exempt from the C-G4 cap, by the same reasoning as
  `custom_steps` and pins already are — the user is telling the coach what they will do, not
  re-rolling the engine's suggestion.

What each mode does:

| Mode | Server | Stored as | Progression |
|---|---|---|---|
| Als extra | `POST /api/plan` with `custom_steps` **and `bonus_session: true`** → in-memory plan (not written to `day_plans`), returned to the client | execution `session_type='bonus'`, `day_plan_id` null | identical to any session |
| In plaats van | `POST /api/plan` with `custom_steps` (W4a, unchanged) → today's `day_plans` row, `generated_by='user'` | execution `session_type='workout'`, linked to the plan | identical |

The bonus path already exists for engine-generated bonus plans (`bonusPlan`, `inBonusWorkout`,
`handleBonusComplete` in App.jsx). It needs one extension: accept user-authored steps. Everything
downstream — WorkoutView, save, progression — is unchanged.

---

## 5. Execution — "use the timer and counters"

WorkoutView takes a plan with `steps[]` in the engine's step shape and nothing else. Each source
produces that shape:

| Source | Step shape | Work needed |
|---|---|---|
| Samenstellen | `custom_steps` → `_stepFor(ex, prescription)` server-side (W4a) | none |
| Mijn trainingen | template `steps` → `custom_steps` (W4b `useMySession`) | none |
| Van je trainer | `program_sessions.structure_json` → steps | **an adapter** — the only new server logic in this design (§8) |

Safety stays as W4a built it: the advisory pass runs on every user-authored session (notes on
the offending exercise, 409 + acknowledgement for a hard contraindication), and `_safePool`
governs pins. A bonus session gets the same advisory pass — a user doing an *extra* session
on a pain day deserves the same amber note.

**Measurement.** If a DCP self-assessment is due (R598), the server returns `assessment_offer`
on both modes; the chooser's result screen offers "Zelfmeting toevoegen" exactly as the builder
does today. Never inserted silently.

---

## 6. After the session

- **Completion** goes through the existing `onComplete` → `saveExecution` → progression /
  streak / score. A bonus session shows on the Today card as "Extra: {naam} ✓" below the plan,
  as today's engine bonus does.
- **"Plan done?"** — after an *extra* session, if the coach plan is still open, the done card
  asks one question: "Je plan van vandaag staat nog open — ook als gedaan markeren?" Default
  no. This is the only place the two sessions touch.
- **Save as template** — the done card of any user-authored session (extra or replacing)
  offers "Bewaar als sjabloon" if it was not started from one. This closes the loop you
  described: build once, reuse later.
- **Registreren** records and returns; no done card, no RPE prompt beyond the sheet's own.

---

## 7. Data

**No schema change for phases 1–2.** Everything maps onto what exists:

- `day_plans.generated_by = 'user'` (W4a) for replacing sessions.
- `executions.session_type ∈ {workout, bonus, logged}` — all three already valid.
- `user_session_templates` (W4b) for reuse.
- One **optional** addition worth making in phase 1 because it is cheap and answers "what did I
  reuse": `executions.source_ref` TEXT nullable — `template:<id>` or `assigned_session:<id>`.
  Migration via `migrate.mjs`, STRICT, no backfill. Lets the trainer side mark an assigned
  session completed from the execution it produced (§8).

---

## 8. Phase 2 — the trainer's library

The data model exists (`program_assignments`, `assigned_sessions`, `program_sessions` with
`structure_json`, `GET /api/client/assignments`, a completion endpoint). What is missing:

1. **An adapter** `structure_json → steps[]`. The trainer repo owns `structure_json`; its shape
   must be read from there (`justfit-trainer`), not guessed. Exercises are referenced by id or
   slug and must resolve against the library the planner uses (global rows plus the member's
   gym rows — the same scoped query as `plan.js`, so a gym-private exercise is reachable only by
   a member). Prescriptions carry sets / reps / duration / rest, and may carry a target load for
   weighted work (C-F6 `supports_weight`).
2. **Completion linkage.** When an execution started from an assigned session completes, call
   the existing `…/complete` endpoint with the execution id, so the trainer's adherence view
   updates. `source_ref` (§7) is how the client knows to do that.
3. **The picker section** "Van je trainer" in Hergebruiken, with the next due session first.

Gate: do not build the adapter until a trainer has authored at least one session — there are
zero `program_sessions` rows today, so the shape cannot be verified against real data.

---

## 9. Edge cases, decided

| Situation | Behaviour |
|---|---|
| Today's plan completed, user taps Samenstellen → Starten | Runs as extra; run-mode sheet skipped |
| Rest day, Registreren | Logs today; rest day stays on record (the log is the truth, the rest day was the plan) |
| Mid-workout, app backgrounded | Unchanged: WorkoutView's existing state handling |
| Offline | Extra and replacing both need the server (advisory pass, plan shape); show the existing offline notice. Registreren can queue via the existing offline path — the server window is 6 days, so the queue's retention must match (currently 7; fix in phase 1) |
| Pregnancy / postnatal mode | Advisory pass applies; hard contraindications 409 until acknowledged, both modes |
| Military coach active | Allowed. An extra session does not advance the block counter (only a completed *military* session does); a replacing session does not count as the block's session either, and the Today card says so in one line |
| Guest account | Allowed; templates and trainer sections hidden (no account to attach them to) |

---

## 10. What this is not

- **Not a fourth coach.** Principle 5 — one active intent. These are the user's sessions.
- **Not free-text exercises.** Library only, as in W4a. Free text cannot be mapped to an axis.
- **Not a programme builder.** A template is one session. Multi-week self-programming is a
  different product question and would compete with the coaches.

---

## 11. Phasing and acceptance

**Phase 1 — entry, chooser, extra-vs-replace, log-from-today, save-from-done** *(one deploy)*
- Today card line replaces "Lukt dit vandaag niet?"; chooser with the three verbs.
- Run-mode sheet; bonus path accepts user-authored steps; both modes cap-exempt.
- "Plan done?" after an extra; "Bewaar als sjabloon" on the done card.
- `executions.source_ref` migration.
- Offline queue retention aligned to the 6-day window.
- **e2e journeys** for both sheets — the gap the Oct 5 build left: (a) Samenstellen → Starten →
  Als extra → complete a set in WorkoutView → done card shows "Extra"; (b) Registreren for
  today → appears completed. Request-harness cases for `bonus_session + custom_steps` and the
  cap exemption.

**Phase 2 — trainer's library** *(after the first authored session exists)*
- Adapter, picker section, completion linkage.

**Phase 3 — polish, after real use**
- Chooser remembers the last verb used and surfaces it first.
- "Hergebruiken" shows "laatst gedaan op …" per template.

**Acceptance for phase 1**, each with a guard that fails without it:
1. "Eigen training" is visible on every Today state (plan, rest, completed, user-authored).
2. An extra session never changes `day_plans` for today.
3. A replacing session never runs without the explicit choice.
4. A free user can run either mode when a plan already exists today.
5. A session started from a template records `source_ref`.
6. The advisory pass runs on an extra session (persona: pain day + extra session → note present).
