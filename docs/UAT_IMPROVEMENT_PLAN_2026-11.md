# UAT improvement plan — after the five defects (2026-11-01)

Source: `docs/UAT_PERSONAS_2026-11.md` (findings D6–D11, the flow table, the move-closer / move-away
map). Release 1 (D1–D5) is `docs/UAT_FIX_PLAN_2026-11.md`. Each release below ships on its own, in
the house loop (worktree → build → review with phone screenshots → `npm test && npm run release` →
merge → deploy → docs). Effort: S = hours, M = a day, L = two to three days. Order is by impact per
day of work, and each release leaves the app better on its own.

The one rule behind all of it: **Today shows one decision; what the user did not ask for sits one
tap away; what the app cannot yet say anything true about stays hidden until it can.**

## Release 2 — Today diet (M)

What the user sees after this release: the Today card, one sentence that says what changed today,
two visible escape hatches, and a done card with three controls instead of seventeen.

1. **"Waarom dit plan?" closed by default.** The panel opens on tap; inside, the rules that fired
   *today* (check-in, pain, time, return-after-break, coach) come first, the structural ones
   ("opgebouwd rond je progressieprofiel", "variatiecheck") sit under "Meer". The first-view
   auto-expand (`jf_whypanel_<plan_id>`) goes.
2. **The coach sentence is the reason that changed today.** `deriveCoachSentence` already ranks
   rules; make check-in rules (R510–R514, R559), pain (R562–R565) and R558 win over the goal line,
   and make the goal line the fallback. Pregnancy and postnatal keep their prefix. Tautologies like
   "Sessie van vandaag: beweging van vandaag." are a test case.
3. **Escape hatches as buttons.** "Eigen training" and "Lukt dit niet?" become a row of two ghost
   buttons (44 px, `.jf-today__alt`) under START SESSIE. Same words, bigger targets.
4. **The done card.** "Sessie afgerond · Goed werk · Consistentiescore" + one row "Extra activiteit
   loggen →" (opens the existing chips as a sheet) + one link "Bonussessie →". After "Gewoon rusten"
   neither appears. The guest banner stays.
5. **A safe stop.** "Stoppen" in the cancel overlay saves the sets already done as a partial
   execution ("Gestopt na 2 van 5 oefeningen") and returns to Today; "Weggooien" discards. The copy
   "Your progress won't be saved" goes. The execution already carries per-exercise `sets_completed`;
   the save path needs a `status: 'partial'` the score counts as showing up (Principle 1).
6. **DCP rows on Today** read "DCP-meting · max in 2 min" (the WorkoutView already says it).
7. **The session title follows the session.** After release 1 a recovery day still reads
   "CARDIOVERBRANDING" above "Rustig aan vandaag — alleen mobiliteit en herstel"; `sessionTitle`
   should name recovery / low days ("Rustige sessie", "Herstel") before the goal-based name.
8. **Timed targets round to 5 s** in one shared helper used by the assembly stage (32 s → 30 s,
   23 s → 25 s, 48 s → 50 s). Matrix property: every `target_duration_sec` is a multiple of 5.

Guards: e2e asserts the why-panel is collapsed on first view and the coach sentence names the
check-in rule after "Taking it easy"; a smoke scan counts the done card's controls (≤ 6); the planner
matrix gets the 5 s property. `App.jsx` stays at 1800 (the Dashboard owns these cards).

## Release 3 — Progress and the week, gated on data (M)

1. **Voortgang before three sessions** shows the trajectory sentence, the streak, "Waar sta ik" (when
   a norm is active) and "Next: <award>". Sleutelinzichten, assenanalyse, Doelfit and "Hoe de
   planner zich aanpast" appear from the third completed session; the radar keeps its 14-session
   gate. Insight blocks never render "STERKSTE Duwen · 0" next to "ZWAKSTE Duwen · 0": hidden
   while every axis is 0.
2. **"Herstel" reads the session just saved**: refresh the muscle recovery map from the execution
   that was just written (the Voortgang load happens before `saveExecution` resolves today).
3. **"ACHTERSTAND" softened**: in the user's first week, and on the last day of a week with a
   completed session, the pill reads "Nog n te gaan" in neutral colour; red only from week two when
   the week is behind on Thursday or later.
4. **Deze week**: the day strip stays; one "Training loggen" for the selected day replaces the seven
   rows; "Aankomend" shows tomorrow and the day after, with "Hele week →"; "Afgeronde sessies"
   only when there is one.
5. **One source for the body-mode numbers**: `pregnancyWeek(due_date)` and `postnatalWeek(birth)`
   helpers feed both banner lines; the clearance line shows only when no clearance is recorded.
6. **The Coach view** shows "Sessie 0 van 3" as "Nog geen sessie deze week" and hides "FTP 200 W"
   until an FTP was entered; the PRIMAIRE FOCUS list renders only when two coaches are active.

Guards: vitest for the two week helpers and the insight-gating predicate; e2e "day one Voortgang
has no insight blocks; after three sessions it has"; a smoke scan that the two banners use the
helpers.

## Release 4 — Dutch sweep 3 and the two orphan screens (M)

Screens: Settings → Jij (every section title and helper), Deze week (dates via `fmtDateNL`, session
names via `sessionTitle`, the "TIME-ADJUSTED" chip), Voortgang strings ("Fresh start", "Share
progress", "Sun 1 Nov", "Next: The Habit"), Trophy room chrome, the Privacy centre, the pregnancy /
postnatal / perimenopause banners (plain Dutch, no "stress threshold lowered"), the guest banner,
"Rest Day", "Skip", the instruction why-line and category labels, the login page (Dutch by default
with EN, static HTML so a small dictionary in `login.js`), the connect screen and the error boundary
(both also onto the app font and tokens). Award names stay English by design.

Guards: `dutchShell.scan.mjs` extended to SettingsView (Jij), PlanWeekView, HistoryView,
AwardsView, the banners, ConnectScreen, ErrorBoundary, with the photographed literals; `i18n.test.js`
asserts the new keys have Dutch values.

## Release 5 — Settings that grow with the user (M)

1. **Jij** keeps: name, sex, weight/height, body mode (cycle / pregnancy / postnatal /
   perimenopause), injuries, language, appearance. **Doel & coach** gains "Geavanceerd" (collapsed):
   sport-aware bias, polarised training, daily adaptive replan, time overhead, rustdagen, days per
   week, session duration. Each row has one sentence of plain Dutch and shows its current value.
2. **Chips show their value** (TRAININGSDAGEN, SESSIEDUUR, ERVARINGSNIVEAU) and save on tap with a
   short "Opgeslagen" state; the "Opslaan · Afvallen" button goes.
3. **NORMEN** shows a neutral hint ("Geboortejaar nodig voor de norm") until the user types; amber
   only on an invalid year.
4. **Language toggle** on the Settings landing (NL · EN) next to the header.
5. **"Continue without account"** on the SIGN IN tab as well; the Account page shows "E-mail
   toevoegen" for a guest instead of Resend / Enter code.
6. **The "Specialistische coaching" card** on Today shows once per account and never after a path
   is chosen.

Guards: inline-style ratchet lowered by the Jij migration (the moved blocks become `.jf-set*`
classes); e2e "settings — chips reflect the saved value after reload"; smoke scans for the removed
save button.

## Release 6 — Small phones and the first five minutes (L)

1. **320 px pass**: Today title clamps at ≤ 360 px (`clamp()` in the display size), nav labels 11 px
   with tighter tracking ("INSTELLINGEN" fits), bottom padding equal to the nav height on every
   scrolling view (the Settings landing's Account row, the Today CTA), the timed-set screen on 568 px
   (Start control above the action bar; countdown neutral until started), the sheet close "×" at
   44 px, the onboarding time chips wider than 40 px.
2. **Onboarding fold**: the path choice becomes the goal step's second row (Algemeen is the default
   path for the five general goals; Hardlopen / Fietsen / Militair are cards in the same step), so
   the goal is asked once; the first check-in is the first "Goed" tap on Today, not a sheet before
   Today exists. Target: ≤ 10 taps to the first Today card.
3. **The UAT runner as a gate for this release**: `node scripts/uat/uat.mjs p11-peter p30-erik
   p01-sanne` with the DOM audit asserting 0 clipped titles, 0 text < 11 px outside award names, and
   the tap count of the onboarding flow ≤ 10.

## Not in this plan, on purpose
- The RPE 1–10 slider stays (it is one tap to save and the number feeds the score).
- The 6-step onboarding is folded, not removed: the equipment and time questions are what make the
  first session right.
- Exercise instruction steps stay English until the library is translated (a content project).

## After each release
Rerun the affected personas with the runner and attach the contact-sheet row to the release note;
update `docs/UAT_PERSONAS_2026-11.md` section 5 with "shipped in release n" marks.
