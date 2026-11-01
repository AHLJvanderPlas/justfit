# Coaches and the DCP — fix plan (coach-dcp release 1 and 2)

**Date:** 2026-11-01
**Implements:** the ranked fix list in `COACH_DCP_UX_ASSESSMENT_2026-11.md` §4. Release 1 is
the four critical fixes and ships first; release 2 reshapes the surfaces.
**Rules:** the same as `BUILDER_UX_PLAN_2026-10.md` §0 — one release = one deploy; every guard
broken once; line budgets (`plan.js` ≤ 3726, `App.jsx` ≤ 1800, `onRequestPost` ≤ 99, inline
styles ≤ 2278) may not rise; new styling is a class; Dutch first through `t()`; pure logic in a
`.js` module with tests; agents are read-only on D1; the manager reruns every gate.
**Status:** release 1 ✅ live 2026-11-01 (108a596 + ffda513; vitest 373, smoke 97, e2e 17; plan.js
3726 → 3688; served = built). Release 2 in progress.

| Release | Fixes (assessment §4) | Effort | Build | Review |
|---|---|---|---|---|
| 1 — the DCP works and is reachable | 1 Normen block writes the DCP · 2 R598 injects the sets · 3 Coach view reachable + sub-view title · 4 one measurement button, header "Check-in" | 2 days | Opus | Fable |
| 2 — one place, one picture, one language | 5 Doel & coach screen · 6 Waar sta ik on Voortgang · 7 Dutch sweep of coach surfaces · 8 level "niet gemeten" | 4 days | Opus (5, 6) · Sonnet (7, 8) | Opus + Fable |

---

## Release 1 — the DCP works and is reachable

### 1A — Normen block: the writer the DCP never had (fix 1)

In the Settings coach sub-view (reached by Settings → Coaches), a new section **NORMEN**,
shown for every user, above TRAINING FOCUS:

```
  NORMEN
  ┌ Keuring K3 · over 60 dagen            (only while the military coach is active; read-only line)
  ┌ DCP-norm · doorlopend                              ●  aan
  │ Geboortejaar [1990]   · man (uit Jij)
  │ 2 min push-ups, 2 min sit-ups, 12 min loop. Norm voor jou: 16 · 24 · 2.200 m.
  │ Je traint tot 20 % boven de norm, daarna stopt de bias. Hermeting elke 6 weken.
  │ Blijf DCP-klaar (bias)                             ●  aan      ← the existing toggle, moved here
  └ [ Meting inplannen ]  → "Meting staat in je sessie van vandaag"
```

- Switching the DCP on writes `military_coach.dcp = { ...dcp, enabled: true, birth_year,
  bias_enabled: true }` through `api.saveProfile`; off writes `enabled: false` (keeps `last`).
  Birth year required to enable (4 digits, 1930–2015; the age band drives the norm); sex comes
  from the body profile — when unset, the block says "Stel je geslacht in bij Jij" and the
  norm line is blank. The norm sentence uses `getDcpNorms(sex, dcpAgeFrom(birth_year))`.
- The bias toggle (`bias_enabled`) moves into this block; its old mount under Training focus
  goes. Works without the military coach (`dcpCardVisible` already allows `bias_enabled`).
- "Meting inplannen" calls the existing `onForceAssessment` (R598 into today) and shows the
  planned state; enabling the DCP with no baseline schedules it automatically (same call) and
  says so with the activity toast.
- Server: `profile.js` military normalisation validates `dcp` — `enabled`/`bias_enabled`
  booleans, `birth_year` integer in range or dropped, `last` preserved as stored, unknown keys
  dropped. Pure `normalizeDcp(dcp)` in `_shared/military.js`, unit-tested.
- The sub-view title map gets a "coach" entry: **COACHES** (fix 3's title bug).

### 1B — R598 delivers what it announces (fix 2)

Move `_dcpMeasurementDue` and a new `ensureMeasurementSteps(ctx, steps)` into
`functions/api/_shared/dcpMeasure.js` (plan.js must not grow; this makes it shorter). After
selection, when `ctx.dcpMeasure` is set and the session lacks the push-up or sit-up exercise,
append the missing one(s) as max-effort sets built with `prescribedStep` from `_safePool`;
`assessment_planned` is true only when both measurement steps are present. Applies to the
engine path including military template sessions; the user-authored path keeps its offer.
Trace line unchanged. `PLAN_CEILING` lowered to the new count.

### 1C — the Coach view has a route (fix 3)

- The coach programme card on Today (military / running / cycling, `Dashboard.jsx`) becomes a
  button: tap → `onNavigateCoach` (prop exists), chevron "›" at the right, `aria-label`
  "Bekijk je coach". No styling change beyond the chevron and `cursor` (class).
- In the Settings coach sub-view, a "Bekijk je coach →" button under ACTIVE COACH →
  `onNavigateCoach` is the wrong hook for it if that prop currently opens the sub-view itself:
  trace what Settings → "Coaches" does today and keep that; add a distinct `onOpenCoachView`
  prop (App.jsx: on an existing line — zero new lines) that does `setView("coach")`.
- Nothing is added to the bottom nav.

### 1D — one measurement button (fix 4)

- `DcpCard`: one label logic in a pure helper `dcpMeasureLabel({ never, planned })` →
  "Nulmeting inplannen" / "Hermeting inplannen" / "Meting staat in je sessie van vandaag"
  (planned, disabled). Both mounts call the same action: the Coach view's `onMeasure` becomes
  `onForceAssessment` (new CoachView prop, App.jsx existing line), never `setView("assessment")`.
- `HistoryView` "Where you are" card: when `dcpIsTarget`, replace its copy with "Je DCP-meting
  is je nulmeting voor push en core." and render the same `dcpMeasureLabel` button; the
  battery copy and "Meet mij" stay only for users without a norm.
- Header button: key and label become "Check-in" (it opens the check-in); the `Recalibrate`
  key goes.

### Tests and guards (break each once)

1. **vitest** `military.test.js` (or extend an existing file): `normalizeDcp` drops bad years,
   coerces booleans, keeps `last`; `dcpMeasureLabel` three states.
2. **`scripts/planner-behaviour.mjs`**: new property — for every persona with
   `dcp.enabled` and no `dcp.last` (add a *military keuring + DCP* persona and a *general + DCP
   bias* persona), on every non-rest, standard-mode date: `assessment_planned ⇒ exactly two
   max_effort steps (dcp_pushups, dcp_situps)` and `¬assessment_planned ⇒ zero`. Break: skip
   the injection on the military path.
3. **`scripts/plan-override-requests.mjs`**: `force_assessment: true` for a military persona
   returns a plan with two max-effort steps. Break: drop the injection.
4. **smoke**: `DcpCard.jsx`/`CoachView.jsx` contain no `setView("assessment")`;
   `SettingsView.jsx` writes `dcp` with `enabled` (source scan); the sub-view title map has
   "coach"; `App.jsx` has no `Recalibrate` key. Break: restore one.
5. **e2e (f) "DCP end to end"**: fresh user → Settings → Coaches → NORMEN → birth year → DCP
   on → toast → Today's session lists a max-effort push-up step → start → the max-effort screen
   → finish the measurement sets → Voortgang's DCP card shows the numbers, the button reads
   "Hermeting…" no longer "Meting staat…". Break: make the writer skip `enabled`.
6. **e2e (g) "coach card → Coach view"**: a running user (prefs via API before the check-in,
   see `e2e/helpers.js`) taps the programme card on Today → the Coach view header shows
   "HARDLOPEN". Break: remove the onClick.
7. Journeys (a)–(e) green; smoke's Dutch-shell scan extended with "Recalibrate".

### Acceptance

1. A new user can switch the DCP on in Settings and sees "Meting staat in je sessie van
   vandaag"; today's session contains two measurement steps; completing them fills the card.
2. A military user's strength session that the engine built carries the two sets when due.
3. A running or military user reaches the Coach view from Today in one tap.
4. The header reads "Check-in"; every DCP button reads "…inplannen" or "Meting staat…".

---

## Release 2 — one place, one picture, one language (after release 1 is live)

- **5 Doel & coach** (`SettingsView.jsx`): one sub-view replaces "Jouw doel" and the coach
  sub-view — JE PAD card (+ "Wijzig pad" → the existing modal), the active coach's settings
  expanded, other coaches collapsed under ANDERE COACHES with "Activeren", NORMEN from 1A, the
  one-at-a-time sentence once; the "ADD-ON" pill removed from the Today card; path-choice
  modal stays for the first load only. Landing rows: Doel & coach · Jij · Trainers ·
  Trofeeënkamer · Privacy · Account.
- **6 Waar sta ik** (`HistoryView.jsx`): per norm one card — keuring (run / push-ups /
  pull-ups / march vs `KEURING_NORMS[cluster_target]`, Cooper date) and DCP (rows with
  "0 / 16 (veilig 19)", shared keuring date, "Meting inplannen"); the radar stays as the general
  profile with the military target as an in-card toggle; "Militaire fit" ring and the
  "Fitness Profile" strip fold into it.
- **7 Dutch sweep**: `PathChoiceModal.jsx`, the Settings coach parts, HistoryView's cards,
  `CoachView.jsx` body (ladder, insights, readiness); smoke scan of the photographed literals.
- **8 Level**: "Keuring · niveau nog niet gemeten" on Today and in Settings until a Cooper or
  keuring measurement exists; the self-declared cluster is shown as "doel" only.
- Guards: vitest for the new pure helpers (norm rows, tier labels), e2e (f) extended through
  Doel & coach, smoke literal scan, journeys green.
