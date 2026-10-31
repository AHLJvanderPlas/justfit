# Session builder — version plan v1.1 → v1.6

**Date:** 2026-10-31
**Implements:** every recommendation in `BUILDER_UX_ASSESSMENT_2026-10.md` (R1–R8, plus the
log-sheet items L1a–d, the data items D1 and the shell language X1). Nothing from the
assessment's "Not recommended" section is in here.
**Baseline:** "Eigen training" phase 1 as deployed in commit `7c2dbe3` = **builder v1.0**.
**Status:** v1.1–v1.2 live; v1.3–v1.6 planned. Each version below flips to *live* with its commit
and deploy evidence when it ships; this file is the tracker.

| Version | Name | Fixes | Effort | Build | Review | Server | Migration |
|---|---|---|---|---|---|---|---|
| v1.1 ✅ live 2026-10-31 (162f89a + 9b5f089; vitest 252, smoke 90, e2e 12; served = built) | List first, then the picker | B1 B5 B6 L1a–d, miss message (P2 copy) | 1 day | Sonnet | Opus | — | — |
| v1.2 ✅ live 2026-10-31 (6ad0443 + e1224da; vitest 257, smoke 91, e2e 14; B2 → 2278; served = built) | Reach what you saved; pin from the chooser | T1 T2 B3 | 1 day | Sonnet | Opus | my-sessions GET+POST (+2 fields, `json_each` binding) | — |
| v1.3 | A browsable library, in Dutch too | P1 P3 D1, R4 synonyms | 2 days | Opus (order + data) · Sonnet (UI) | Fable | execution GET (+1 column) | 0123 (data) |
| v1.4 | One row for numbers; reachable controls | B2 B4 B7 A1 | 2 days | Opus | Fable | — | — |
| v1.5 | Dutch exercise names | R4 data, rest of P2 | 2–3 days + owner review | Opus (names) · Sonnet (wiring) | Fable + owner | plan step builder extracted; exercises GET | 0124 (name_nl) |
| v1.6 | A Dutch shell around the sheets | X1 | 1–2 days | Sonnet | Opus | — | — |

Ten to eleven working days of agent time in six deploys. v1.1 and v1.2 remove the three
🔴 findings; v1.3 removes the fourth. Everything after that is quality.

---

## 0. Rules that apply to every version

These come from the two CLAUDE.md files and from how this feature has been built so far. They
are repeated here so a build agent's brief can point at one section.

1. **One version = one deploy.** Design → build → `npm run release` (smoke + e2e, 12
   journeys) → `git push` → `wrangler pages deploy` → verify the served bundle hash equals the
   built one → update docs (`CLAUDE.md` build status, root `FUNCTIONAL_DOCS.md`, root
   `ROADMAP.md`, and the status column of this file). Never start the next version before the
   previous one is live and documented.
2. **Every guard is broken once to prove it fails.** The "Guard" block of each version names
   the break. The agent's report must quote the failing output.
3. **Line budgets are at their ceilings.** `App.jsx` is 1800/1800, `plan.js` 3827/3827,
   `onRequestPost` 99/99, inline styles 2297. A version that must touch one of them either
   adds to an existing line (a prop on a line that already has props), or extracts first and
   lowers the ratchet in the same commit. No version may raise a ceiling.
4. **Styling is classes in `styles.css`.** `MyTrainings.jsx` still carries inline styles; a
   version that edits it migrates what it touches and lowers ratchet B2.
5. **Dutch first.** Every new string goes through `t()` with an entry in `i18n.js`. The
   agent's brief lists the Dutch copy; the English key is the fallback.
6. **Pure logic lives in a `.js` module with a vitest file.** React files hold rendering only.
   The builder already follows this (`ownTraining.js`, `logSession.js`); v1.1 adds
   `exerciseSearch.js`.
7. **Functions are plain ESM, no npm.** Migrations only through `scripts/migrate.mjs`; a seed
   that writes zero rows fails; the baseline is regenerated after any data migration.
8. **Each version is built in a git worktree by the named model**, reviewed by the named
   reviewer against the acceptance list, merged by the manager (this session), then released.
   The brief is this file's section for the version plus the assessment's findings it cites.

---

## 1. v1.1 — List first, then the picker

**Fixes:** B1 (added exercises land out of view), B5 (template panel, success text, default
name), B6 (advice two steps late), L1a–d (log-sheet polish incl. the missing unit), and the
wrong "niets past bij je uitrusting" message (the copy half of P2).

### User-visible result

Samenstellen reads top to bottom as: what you built → add more → start. An added exercise
appears as the last card, scrolled into view and outlined for a moment, exactly as in
Registreren. The search sits under the list; "+ Oefening toevoegen" in the footer jumps to
it. A session you start without naming is called after its first two exercises. Coach advice
shows on the card it concerns before you choose extra or replace. In Registreren the skipped
toggle is quiet, an empty value field no longer looks filled, the pre-filled rest is one of
the chips, and a timed exercise is stored with its unit.

### Design

```
  JE EIGEN TRAINING                                        ×
  Kies oefeningen … tellen mee voor je voortgang.
  JOUW SESSIE · 3
  ┌ 1  Push-up                                     ↑ ↓ × ┐
  │  SETS  − 3 +   HERHALINGEN  − 10 +   RUST  − 45s +   │
  └───────────────────────────────────────────────────────┘
  ┌ 2  Plank …                                            ┐
  ┌ 3  Air Squat …                       ← outlined 1.2 s ┐
  ┌ Coach-advies · De coach zou dit normaal weglaten: … ┐   ← only after Starten found a note
  [ Zoek oefeningen…              ] [ Toon alles ]
  Gefilterd op je uitrusting
  ┌ results (210 px) …                                    ┐
  ───────────────────────────────────────────── sticky ───
  ≈ 12 min                                  je tijd 45 min
  [ + Oefening toevoegen ]  [        Starten        ]
                   Bewaar als sjabloon
```

- **Order.** `SessionBuilder` renders: intro → eyebrow + cards (or the empty hint "Zoek
  hieronder en tik op een oefening") → `ExercisePicker` with `inputRef` → footer. Pin mode
  (planning-mode builder) keeps its own order: picker → pinned chips, since there the list
  *is* the picker.
- **Add feedback.** `data-sb-key` on each card; after `addStep`, `scrollIntoView({ block:
  "nearest", behavior: "smooth" })` and the class `jf-sb-step--new` (accent border, cleared
  after 1.2 s or on the next add). Same mechanism as `jf-log-item--new`.
- **Footer.** Reuse `jf-log-footer-row`: secondary "+ Oefening toevoegen" (scroll + focus the
  search, `preventScroll`) and primary Starten / Gebruik vandaag. The template link stays
  under it.
- **Template panel** opens *above* the footer, inside the scrollable body, as a one-line card:
  name field + Opslaan / Annuleren. The success line "Opgeslagen in Mijn trainingen." clears
  after 3 s (`setTimeout`, cleared on unmount). "Sjabloon bijwerken" remains as the quiet
  link.
- **Auto-name.** `sessionName(steps, tplName)` in `ownTraining.js`: the template's name if
  any, else the first two exercise names joined with " + " ("Push-up + Plank"), else "Mijn
  training". Used by Starten and by "Gebruik vandaag".
- **Advice before the choice (Starten mode only).** On Starten, call the extra path once as
  a preview (`api.startOwnSession(ownSessionBody({ …, mode: "extra" }))` — it stores nothing,
  which is why it can serve as a dry run). 200 → notes rendered on the cards (`step_index`),
  session notes above the list; 409 → the same, plus the acknowledgement checkbox inline; the
  run-mode sheet opens only after the checkbox. The second, real request carries
  `safety_ack`. The "Klaar om te starten" sheet is then shown only for the self-measurement
  offer. One extra POST per Starten; the body is identical, so the server does no new work.
- **Miss message.** New `exerciseSearch.js`:
  `filterLibrary(library, { query, owned, showAll })` returns `{ results, matchedAny,
  matchedOwned }`; `emptyMessage({ query, showAll, matchedAny, matchedOwned })` returns one
  of: "Geen oefening gevonden voor '{q}'" (nothing matches the query at all) · "Niets past bij
  je uitrusting — probeer Toon alles" (matches exist outside the kit) · "Niets gevonden"
  (showAll and no match). `ExercisePicker` uses both.
- **Registreren polish.** "Overgeslagen" becomes a `jf-link`-styled button in the tools row
  (right of "+ Rij"), still `aria-pressed`. Value placeholder becomes "reps" / "sec" in the
  muted label colour, not a number. Rest chips are `unique([defaultRest, 60, 90, 120])` sorted.
  `loggedStep` writes `actual.unit: "reps" | "sec"`; `summarizeLogged` appends " s" when
  `unit === "sec"`; `HistoryView` and `PlanWeekView` record lines show it. The server stores
  `actual` verbatim (`JSON.stringify(step.actual)`), so no API change.

### Changes

| Area | Files |
|---|---|
| Client | `SessionBuilder.jsx` (order, footer, add feedback, preview on Starten, template panel), `sessionSheet.jsx` (uses `exerciseSearch.js`), `exerciseSearch.js` (new), `ownTraining.js` (`sessionName`), `LogSessionSheet.jsx`, `logSession.js` (`unit`), `HistoryView.jsx`/`PlanWeekView.jsx` (unit in record lines), `styles.css` (`jf-sb-step--new`, template-panel placement), `i18n.js` |
| Server | none |
| Data | none |

### Tests and guards

- **e2e (a) extended:** after each of three adds, assert the new card's bounding box is inside
  the viewport and its `y` is greater than the previous card's; assert the search input's `y`
  is greater than the last card's. *Break:* restore the picker above the list — the second
  assertion fails.
- **vitest `exerciseSearch.test.js`:** a table of (query, showAll, matchedAny, matchedOwned) →
  message; "opdrukken" with nothing matching must not mention the kit. *Break:* return the kit
  message unconditionally.
- **vitest `ownTraining.test.js`:** `sessionName` — template name wins; two names joined; one
  name alone; empty → "Mijn training".
- **`scripts/logSession.test.mjs`:** `loggedStep` carries `unit`; `summarizeLogged` prints
  "30/30 s" for seconds and "10/10" for reps. *Break:* drop the suffix.
- **e2e (a) also checks** that the advisory preview does not change today's stored plan id
  (already asserted) — the preview runs the extra path, so this is the guard that it stores
  nothing.

### Acceptance

1. Add three exercises on a 390 × 844 viewport without scrolling by hand; each new card is
   visible when added.
2. Tap Starten on a session the coach would advise against (persona: pain day + loaded
   exercise, from the behaviour matrix) → the note is on the card before the run-mode sheet.
3. Save a template, see the confirmation, and see it gone three seconds later.
4. Start without saving → WorkoutView title is "Push-up + Plank".
5. Log a 30 s plank → History shows "3 sets · 30/30/30 s".

**Effort:** one day Sonnet, Opus review. **Risk:** the preview doubles the POST on Starten.
It has not been measured; the build agent times it against the local server and records the
number in the release note. If it is noticeable, the preview can be dropped without touching
anything else — the notes then stay on the "Klaar om te starten" sheet as today.

---

## 2. v1.2 — Reach what you saved; pin from the chooser

**Fixes:** T1 (edit/delete unreachable), T2 (rows say little), B3 (pin + fill unreachable;
dead "Pro feature" branch).

### User-visible result

In Hergebruiken each training has "⋯" → Bewerken / Verwijderen. Its row says which exercises
it holds and when you last did it. The chooser has a fourth row, **Vastzetten** — pick one to
three exercises, the coach completes today's session around them.

### Design

```
  EIGEN TRAINING                                           ×
  ▸ Registreren     Iets gedaan zonder de app? Leg het vast.
  ▸ Hergebruiken    Mijn trainingen
  ▸ Samenstellen    Nu een sessie bouwen en starten.
  ▸ Vastzetten      Kies 1–3 oefeningen, de coach vult aan.     ← only while today's plan is open

  HERGEBRUIKEN
  MIJN TRAININGEN
  ┌ Hotel sessie                                        ⋯ ┐
  │ Push-up · Plank · Air Squat                           │
  │ ≈ 12 min · 3 oefeningen · laatst gedaan di 28 okt     │
  └───────────────────────────────────────────────────────┘
      ⋯ →  [ Bewerken ]  [ Verwijderen ]
      Verwijderen → "Deze training verwijderen?"  [ Ja, verwijderen ] [ Annuleren ]
```

- **Row menu.** `TemplatePickList` gets `onEdit`, `onDelete`; "⋯" is a 44 px icon button that
  toggles an inline action row (no new sheet). Delete confirms inline, as the Coach card does.
  Tapping the row body still picks it.
- **Bewerken** sets `EigenTraining`'s `editing` state and renders the existing
  `<SessionBuilder template={editing} onStart=… />` — the builder already supports `template`;
  "Sjabloon bijwerken" is already its quiet action. After an update, `onTemplateSaved`
  refreshes the list (already wired to App).
- **Verwijderen** calls `api.deleteMySession(id)` (exists) through a new `onDeleteTemplate`
  prop on `EigenTraining`, bound to App's existing `handleDeleteTemplate`. App.jsx budget: the
  prop goes on the `<EigenTraining …>` line that already carries `onTemplateSaved` — zero new
  lines.
- **Row meta from the server.** `GET /api/my-sessions` adds two fields per template:
  `step_names` (first three names, one query joining `exercises` on the ids in `steps_json`,
  in step order) and `last_done_at` (the latest `executions.date` with
  `source_ref = 'template:' || id`, one query). Client meta line: names · "≈ N min · k
  oefeningen" · "laatst gedaan {date}" when present.
- **Vastzetten.** Chooser row shown when `!todayCompleted` (a rest day is allowed: the server
  explains removed pins with `guard: 'rest_day'`, and the saved-state sheet already renders
  that). Opens `<SessionBuilder initialMode="pin" lockMode onInstalled={onPlanInstalled} />`:
  `initialMode` and `lockMode` are two new props; `lockMode` hides the mode toggle. Intro
  copy: "Zet 1–3 oefeningen vast. De coach maakt de sessie van vandaag eromheen af — dit
  vervangt het plan van vandaag." Primary stays "Laat de coach de rest invullen" → existing
  `pinAndFill` (sends `replace_user_plan: true`, so a user-authored plan is replaced
  knowingly — the intro says so) → `onInstalled(plan)` → App `setPlan`. New `onPlanInstalled`
  prop on `EigenTraining`, zero-line in App.jsx as above. No run-mode sheet: pinning is a
  re-plan of today by definition (design §3).
- **Dead branch.** Remove the `if (data.plan?.capped)` block in `fill()` and the string
  "Letting the coach fill in is a Pro feature…" from `i18n.js`.

### Changes

| Area | Files |
|---|---|
| Client | `EigenTraining.jsx` (row menu, editing, Vastzetten, two props), `MyTrainings.jsx` (`TemplatePickList` menu, meta; migrate its inline styles to classes while there, lower B2), `SessionBuilder.jsx` (`initialMode`, `lockMode`, dead branch), `App.jsx` (two props on existing lines), `styles.css`, `i18n.js` |
| Server | `functions/api/my-sessions.js` GET: `step_names`, `last_done_at` |
| Data | none |

### Tests and guards

- **e2e (c) new, "reuse: edit, rename, delete":** save a template via the builder → Eigen
  training → Hergebruiken → ⋯ → Bewerken → rename to "Hotel 2" → Sjabloon bijwerken → back
  in Hergebruiken the row reads "Hotel 2" and lists "Push-up · Air Squat" → ⋯ → Verwijderen →
  Ja → list empty state. *Break:* make Bewerken open the builder without `template` — the
  rename assertion fails.
- **e2e (d) new, "pin from the chooser":** as a free user with today's plan open → Eigen
  training → Vastzetten → pin Push-up → Laat de coach de rest invullen → sheet closes → Today
  card lists Push-up and the stored plan's `pinned` contains its id. *Break:* send
  `pinned_exercise_ids: []` — fails.
- **`scripts/my-sessions-requests.mjs`:** after logging an execution with
  `source_ref: 'template:<id>'`, GET returns `last_done_at` equal to that date and
  `step_names` in step order; a template whose exercise left the library returns the names
  that remain. *Break:* drop the `ORDER BY step order`.
- **smoke:** `SessionBuilder.jsx` contains no `capped`; `i18n.js` has no "Pro feature" string
  in the builder section. *Break:* reintroduce the branch.
- **smoke B2:** the inline-style count falls by the number migrated out of `MyTrainings.jsx`
  (it holds 23 `style={` props today, so the ceiling drops from 2297 to 2274 if all go); the
  agent records the new ceiling.

### Acceptance

1. A user without a trainer can rename and delete a saved training without ever seeing the
   Coach view.
2. The Hergebruiken row shows the exercise names and "laatst gedaan" after one use.
3. Vastzetten from the chooser installs a plan that contains the pin, for a free account, on
   a day a plan already existed — no Pro message anywhere.

**Effort:** one day Sonnet, Opus review. **Risk:** `step_names` adds one query per GET; the
list is ≤ 30 rows and loads once per app session.

---

## 3. v1.3 — A browsable library, in Dutch too

**Fixes:** P1 (40-row cap, alphabetical, protocol rows first), P3 (profile kit only), D1
(duplicates, digit-led names), and the synonym half of R4.

### User-visible result

With an empty search the picker shows, in sections, what you are most likely to want: today's
plan, what you did recently, what is in your saved trainings, then the library by category.
Category chips narrow it in one tap. Equipment chips let you say what you have *today*. The
list says how much it is not showing. Typing "opdrukken" finds Push-up. Test protocols are
marked and listed last. The two exercises that appeared twice appear once.

### Design

```
  [ Zoek oefeningen…                            ] [ Toon alles ]
  Alle · Kracht · Cardio · Mobiliteit · Herstel            ← category chips (one active)
  Geen · Dumbbell · Band · Kettlebell · Stang · Bank …      ← kit chips, profile pre-selected
  VANDAAG IN JE PLAN
  ┌ Pike Push-up            strength                    + ┐
  ONLANGS GEDAAN
  ┌ Push-up                 strength                    + ┐
  UIT JE TRAININGEN
  ┌ Plank                   strength                    + ┐
  KRACHT
  ┌ Air Squat …
  …
  TESTS & PROTOCOLLEN                                       ← protocol / assessment tags, last
  ┌ Cooper Test (12 min)    cardio · TEST               + ┐
  40 van 274 — zoek of kies een categorie
```

- **Ordering** in `exerciseSearch.js`: `orderLibrary(rows, ctx)` where `ctx = { planIds,
  recentIds, templateIds }`. Sections in that order, each alphabetical with digit-led names
  after letters; rows tagged `protocol` or `assessment` go to the final section regardless;
  a row appears in the first section it qualifies for. With a query, sections collapse to one
  ranked list: name starts with the query → contains it → slug contains it. The 40-row cap
  stays but is reported: `{ shown, total }` → "40 van 274 — zoek of kies een categorie".
- **Context.** `EigenTraining` receives `history` (App has it; the prop goes on an existing
  `<EigenTraining>` line) and derives `recentIds` = exercise ids of executions in the last 14
  days; `planIds` from `plan.steps`; `templateIds` from `templates`. Passed to the builder and
  the log sheet as `pickerContext`.
- **Server, one column.** The history step rows carry `exercise_name` but not the id. Add
  `es.exercise_id` to the SELECT in `execution.js` GET (same statement, no new line) and to
  the mapped row. Nothing else reads it yet.
- **Category chips** map to `category` (strength / cardio / mobility / recovery; `skill` and
  `mixed` fall under Kracht). **Kit chips** come from `EQUIPMENT_OPTIONS` (`appConstants.js`),
  pre-selected from the profile, toggled for this sheet only (state in `ExercisePicker`;
  never written to the profile). "Toon alles" remains as "select every chip".
- **Synonyms** in `exerciseSearch.js`: `expandQuery(q)` maps Dutch tokens to the English
  tokens the names use — opdrukken→push-up · optrekken→pull-up · kniebuiging→squat ·
  uitvalspas→lunge · buikspieren→sit-up,crunch · rugspieren→row,superman · schouders→shoulder ·
  benen→leg,squat · billen→glute,bridge · kuiten→calf · plank→plank · burpee→burpee ·
  touwtjespringen→jump rope · hardlopen,rennen→run · wandelen→walk · fietsen→bike,cycling ·
  roeien→row(ing) · rekken,stretchen→stretch · ademhaling→breathing · heup→hip ·
  rug→back · borst→chest · armen→arm,curl,press · dip→dip · brug→bridge · klimmen→climber ·
  springen→jump · zwaaien→swing · halter→dumbbell · gewicht→weight · band→band · bal→ball ·
  bank→bench · trap→step · zit→seated · lig→lying · staand→standing. About forty entries; the
  table is the test. Matching runs on the expanded token set.
- **TEST marker.** Rows tagged `protocol`/`assessment`/`measurable` show "TEST" in the meta
  line.
- **Data, migration `0123_exercise_dedupe.sql`.** The library has two pairs of identical
  names: `4-7-8-breathing` (0 substitution references) vs `478-breathing` (3), and
  `progressive-muscle-relaxation` (0) vs `progressive-relaxation-body` (3). The build agent
  checks `execution_steps`, `user_session_templates` and `program_template_items` for the
  unreferenced slug on live D1; if unreferenced, `UPDATE exercises SET is_active = 0` for it
  (the planner, the public library and the picker all filter `is_active = 1`); if referenced,
  rename instead ("4-7-8 Breathing (variant)") and record why. The two Cooper rows are
  different exercises (one is the DCP baseline run with `fitness-test`/`baseline` tags, one the
  assessment protocol) and stay; the TEST marker and the last section disambiguate them. No
  other renames: the sort rule handles digit-led names. Then `npm run baseline:seeds`.

### Changes

| Area | Files |
|---|---|
| Client | `exerciseSearch.js` (order, sections, synonyms, cap report), `sessionSheet.jsx` (chips, sections, marker), `EigenTraining.jsx` (`pickerContext`), `SessionBuilder.jsx`/`LogSessionSheet.jsx` (pass it), `PlanWeekView.jsx` (log sheet from Deze week passes `history` too), `App.jsx` (one prop on an existing line), `styles.css`, `i18n.js` |
| Server | `functions/api/execution.js` GET: `es.exercise_id` |
| Data | `migrations/0123_exercise_dedupe.sql`; `1020_seed_exercises.sql` regenerated |

### Tests and guards

- **vitest `exerciseSearch.test.js`:** plan ids first; a row in the plan does not repeat in
  "recent"; protocol rows last even when alphabetically first; digit-led after letters;
  "opdrukken" → Push-up ranked first; `{ shown: 40, total: 274 }` for a bodyweight profile on
  the fixture library; kit chips narrow correctly. *Break:* remove the protocol rule — the
  Cooper test leads again.
- **smoke G-series:** load the regenerated baseline into sqlite and assert no two active
  global rows share a `name` (`GROUP BY name HAVING count(*) > 1 … AND is_active = 1`).
  *Break:* set the deactivated row back to active in the baseline.
- **`scripts/execution-requests.mjs`:** GET history step rows carry `exercise_id`. *Break:*
  drop the column.
- **e2e (a):** opens the builder and asserts the first visible result is not a Cooper test
  and that the cap line is present. *Break:* restore alphabetical order.
- **migrate.mjs** refuses a zero-row migration, which proves 0123 touched its rows.

### Acceptance

1. Fresh bodyweight user, empty query: Push-up is reachable within one scroll; the first row
   is from today's plan.
2. "opdrukken" finds Push-up; "Geen oefening gevonden voor 'xyz'" for a true miss.
3. Kit chips: toggle Dumbbell on for this sheet → dumbbell rows appear; the profile is
   unchanged afterwards (check Settings).
4. `node scripts/migrate.mjs status` matches; "4-7-8 Breathing" appears once.

**Effort:** two days (Opus on `exerciseSearch.js` and the data decision; Sonnet on the picker
UI), Fable review. **Risk:** section headers plus two chip rows make the picker taller; the
result list keeps its 210 px scroll box so the sheet's shape does not change.

---

## 4. v1.4 — One row for numbers; reachable controls

**Fixes:** B2 (steppers only), B4 (10 px toggle), B7 (card chrome), A1 (contrast, hit areas).

### User-visible result

Samenstellen and Registreren enter numbers the same way: `3 × 12 @ 60 s`, tapped fields with
a numeric keypad, shorthand accepted. Reps or time is a chip pair. Labels are readable, every
control is at least 44 px to the thumb, and reorder arrows hide behind "⋯".

### Design

```
  ┌ 1  Push-up                                          ⋯ × ┐
  │  [ Reps ] [ Tijd ]                                       │  ← only when both are supported
  │  [ 3 ] × [ 12 ] @ [ 60 ] s                               │
  │  3 sets · 12 reps · 60 s rust                 ≈ 4 min    │  ← read-back line
  └──────────────────────────────────────────────────────────┘
        ⋯ →  [ ↑ Omhoog ] [ ↓ Omlaag ]
```

- **`SetRow`** in `sessionSheet.jsx`: props `{ sets, value, rest, unit, onChange, errors,
  showRemove }`; 44 px fields, `inputMode="numeric"`, the `×` / `@` / `s` symbols, the
  `jf-log-val` classes. Both sheets use it: the log sheet with one row per set group and
  "+ Rij"; the builder with exactly one row per exercise and no "+ Rij". One parser:
  `rowGroups` from `logSession.js`. In the builder, shorthand "3x12" fills sets 3 and value 12
  (one group only; a second group is an error with the hint "In Samenstellen geldt één waarde
  voor alle sets"). Blur commits; the builder keeps its clamps (`LIM`) on commit and the
  read-back line shows the clamped values so what is on screen is what is sent.
- **Steppers removed.** `Stepper` and `jf-stepper*` go. If the owner wants nudges, a `− / +`
  pair beside the value with `.jf-tap` is a ten-line add later; the row primitive does not
  depend on it.
- **Unit chip pair** replaces the `jf-link` toggle, same component as the log sheet's
  `jf-log-unit`.
- **Card chrome.** Header: number · name · "⋯" (44 px) · "×" (44 px). "⋯" toggles an action
  row with "↑ Omhoog" / "↓ Omlaag" (text buttons, 44 px). Same in the log sheet's phase 1.
- **Accessibility.** New token `--label: rgba(var(--overlay-rgb), 0.72)` (≈ 9:1 on the sheet)
  for stepper/eyebrow-style labels that carry meaning; eyebrow labels in both sheets move to
  11 px; `.jf-tap` on `.jf-chip` and `.jf-icon-btn` (hit area 44 px without changing the look);
  `Sheet` closes on Escape and moves focus to its title on open.

### Changes

| Area | Files |
|---|---|
| Client | `sessionSheet.jsx` (`SetRow`, unit chips, Escape/focus), `SessionBuilder.jsx` (rows, ⋯ menu, no steppers), `LogSessionSheet.jsx` (use `SetRow`, ⋯ menu), `logSession.js` (single-group rule for the builder), `styles.css` (`--label`, 11 px eyebrows, `.jf-tap` on chips/icons), `tokens.js` (`--label` in both themes), `i18n.js` |
| Server | none |
| Data | none |

### Tests and guards

- **smoke:** `grep -c jf-stepper SessionBuilder.jsx` = 0 and `styles.css` has no
  `.jf-stepper`. *Break:* leave one.
- **smoke:** a source scan asserts `.jf-chip` and `.jf-icon-btn` rules include `.jf-tap` or
  `min-height: 44px`, and no label rule under `.jf-sb-*` / `.jf-log-*` is below `11px`.
  *Break:* set an eyebrow to 9.5 px.
- **vitest `logSession.test.mjs`:** builder mode accepts "3x12" → `{ sets: 3, value: 12 }`
  and rejects "3x3, 2x4" with `error: "single_group"`. *Break:* allow two groups.
- **e2e (a)** rewritten to type: fill sets "1", value "5" → WorkoutView prescribes 1 × 5.
  *Break:* ignore the typed sets.
- **e2e (b)** unchanged, which proves the log sheet still works through the shared row.
- **Manual (recorded in the release note):** VoiceOver on iOS reads the row as "Sets 1,
  Herhalingen 1, Rust 1"; Escape closes the sheet on desktop.

### Acceptance

1. 10 → 20 reps is one tap and two digits.
2. Both sheets look and behave identically on the row.
3. No text in either sheet below 11 px; every tappable control measures ≥ 44 px in DevTools
   with `.jf-tap` outlines on.

**Effort:** two days Opus, Fable review. **Risk:** the builder's "one value for all sets"
semantics against the log row's groups; settled by the single-group rule and its test.

---

## 5. v1.5 — Dutch exercise names

**Fixes:** the data half of R4 and the rest of P2; gives the Today card and WorkoutView Dutch
names as a side effect.

### User-visible result

The picker, the cards, the Today card, WorkoutView and History show "Opdrukken" instead of
"Push-up" for a Dutch user; search matches both. English users see nothing change.

### Design, in three parts

**Part A — the names (content, owner-reviewed).** An Opus agent writes
`docs/exercise-names-nl.md`: a table of all 482 active global rows — slug, English name,
proposed Dutch name — grouped by category, following the conventions already in the app
(training-science terms stay English: Plank, Burpee, Dead Bug, Cooper Test, Zone 2; Dutch
for movements: Opdrukken, Optrekken, Kniebuiging, Uitvalspas, Buikdraai, Superman stays).
The owner reviews the table (edits in place). Only then does the agent generate
`migrations/0124_exercise_name_nl.sql` from the reviewed table — one `UPDATE … SET name_nl
= ? WHERE slug = ?` per row, generated by a script, never hand-typed. `migrate.mjs` fails if
zero rows are written. Baseline regenerated.

**Part B — the plan carries both names (and plan.js gets smaller).** Plan steps are built in
six places in `plan.js` (lines ≈ 1315, 2242, 3047, 3218, 3288, 3334), each spelling the same
object literal. Extract one `makePlanStep(ex, overrides)` into
`functions/api/_shared/planStep.js`, used by all six; it emits `name` and `name_nl`. The
exercise rows the planner loads add `name_nl` to their SELECT (one statement, no new line).
Net effect on `plan.js`: about −60 lines; the ratchet is lowered to the new count in the same
commit. `GET /api/exercises` adds `name_nl` to its SELECT.

**Part C — the client reads one helper.** `exerciseName(ex)` in `i18n.js`: `lang === "nl" &&
ex.name_nl ? ex.name_nl : ex.name`. Used by the picker, both sheets' cards, the Today card
step list, WorkoutView header and alternatives sheet, PlanWeekView and HistoryView record
lines, the Hergebruiken meta (server sends `step_names_nl` too), and `summarizeLogged`
callers. Search in `exerciseSearch.js` matches `name`, `name_nl` and the expanded synonyms.
Stored records are unaffected: `execution_steps` keep `exercise_id`; names are resolved at
display time, as they are today.

### Changes

| Area | Files |
|---|---|
| Client | `i18n.js` (`exerciseName`), `sessionSheet.jsx`, `SessionBuilder.jsx`, `LogSessionSheet.jsx`, `Dashboard.jsx`, `WorkoutView.jsx`, `PlanWeekView.jsx`, `HistoryView.jsx`, `MyTrainings.jsx`, `exerciseSearch.js` |
| Server | `functions/api/_shared/planStep.js` (new), `plan.js` (six call sites, SELECT, ratchet lowered), `exercises.js`, `my-sessions.js` (`step_names_nl`) |
| Data | `docs/exercise-names-nl.md` (review artefact), `migrations/0124_exercise_name_nl.sql` (generated), baseline 1020 regenerated |

### Tests and guards

- **smoke:** `plan.js` builds no step object itself — a source scan for an object literal
  that carries both `exercise_slug:` and `target_duration_sec:` returns 0 in `plan.js` (today
  it finds six; the `pinsRemoved` records also carry `exercise_slug` but are not steps and
  stay as they are), and the line ratchet is at the new, lower number. *Break:* re-inline one
  constructor.
- **`scripts/planner-behaviour.mjs`:** every step of every persona has a non-empty `name_nl`
  after 0124 (the fixture library is regenerated from live). *Break:* blank one row's
  `name_nl` in the fixture.
- **vitest `i18n.test.js`:** `exerciseName` falls back to `name` when `name_nl` is empty or
  the language is English.
- **e2e (a)** in Dutch (the suite sets `jf_lang=en`; this journey sets `nl` after signup and
  asserts the WorkoutView title shows the Dutch name for Push-up). *Break:* return `name`.
- **migrate.mjs** zero-row check on 0124; `npm run baseline:schema --check` unchanged (no
  schema change).

### Acceptance

1. Owner has signed off `docs/exercise-names-nl.md` before 0124 is applied.
2. "opdrukken" and "push" both find the same row; the row is labelled "Opdrukken" in Dutch
   and "Push-up" in English.
3. `plan.js` is shorter than before the version, and `node scripts/migrate.mjs status`
   matches.

**Effort:** two to three days including the owner's review (Opus writes the names and the
extraction; Sonnet wires the client), Fable review. **Risk:** 482 names reviewed by one person;
mitigated by grouping the table by category and marking the ~120 rows where the Dutch name is
a plain translation versus the ~40 where the agent proposes keeping English.

---

## 6. v1.6 — A Dutch shell around the sheets

**Fixes:** X1. Not a builder defect, but the assessment listed it and the owner asked for all
of it. Scoped to the surfaces that frame the builder: the Today card, WorkoutView's chrome,
and the Coach view's header strip.

### User-visible result

"VANDAAG · DAG 1", "GEZONDHEIDSSESSIE", "15 min | 6 oefeningen | GEMIDDELD", "+ 3 meer",
"START SESSIE", "Waarom dit plan?", "DEZE WEEK", "Start training", "HERIJKEN", "Algemene
gezondheid · Elke dag consequent trainen". Session names that are engine output ("Health
Session") get an i18n entry per `session_name` the engine emits (they are a fixed set in
`plan.js`; the key is the English name).

### Design

- Wrap every user-visible literal in `Dashboard.jsx`, `WorkoutView.jsx` and the header strip
  of `CoachView.jsx` in `t()`; add the Dutch entries. The `PATH` / `COACH` constant tables
  (`label: "General health"`) become keys resolved at render.
- Intensity words (`MODERATE`, `LOW`, `HIGH`) and `slot_type` words get a small map in
  `messagePolicy.js` next to the rule labels, so the Today card and WorkoutView share one
  translation.
- Training-science terms stay English per the house rule (FTP, TSS, RPE, Zone 2, Cooper).

### Changes

| Area | Files |
|---|---|
| Client | `Dashboard.jsx`, `WorkoutView.jsx`, `CoachView.jsx`, `messagePolicy.js`, `i18n.js` |
| Server | none |
| Data | none |

### Tests and guards

- **smoke:** a source scan of the three files for a fixed list of the literals the assessment
  photographed (`TODAY ·`, `START SESSION`, `moves`, `Why this plan?`, `THIS WEEK`, `Start
  workout`, `RECALIBRATE`, `Consistent daily training`, `+ {n} more`) outside a `t(`/`t("`
  call. *Break:* unwrap one.
- **vitest `i18n.test.js`:** every key added in this version has a non-empty Dutch value and
  no Dutch value equals its key (catches copy-paste). *Break:* leave one untranslated.
- **e2e:** the Dutch journey from v1.5 also asserts the Today button reads "START SESSIE".

### Acceptance

The twelve screens of the assessment's contact sheet, re-captured in Dutch, contain no
English outside training-science terms and exercise names the owner chose to keep English.

**Effort:** one to two days Sonnet, Opus review. **Risk:** `Dashboard.jsx` is 1113 lines of
inline styles; wrapping strings must not touch styling (B2 stays where it is).

---

## 7. Order and dependencies

- **v1.1 before everything.** It fixes the inversion the owner hit personally, costs a day,
  and creates `exerciseSearch.js`, which v1.3 and v1.5 extend.
- **v1.2 second.** It removes the second 🔴 (unreachable edit/delete) and is independent of
  v1.1 except for sharing `SessionBuilder.jsx` — build it after v1.1 is merged to avoid a
  three-way merge in that file.
- **v1.3 before v1.4.** v1.3 changes what the picker lists; v1.4 changes the card. They touch
  different parts of the sheets and could be swapped, but the picker is the bigger usability
  gain.
- **v1.4 before v1.5.** The row primitive settles the card layout that Dutch names then
  render into; doing names first would mean touching the cards twice.
- **v1.5 before v1.6.** Dutch exercise names are the visible half of "a Dutch app"; the shell
  sweep is cheap and last so it can also cover any English string the first five versions
  introduced.
- Any version can be **stopped after** without leaving the product inconsistent: each one
  leaves both sheets agreeing with each other.

## 8. Foundation check, once for the whole plan

| Principle | Answer |
|---|---|
| 1 — Free users get real value | Every item is free; nothing that was free is gated. v1.2 deletes a misleading Pro string. |
| 7 — Every number must be correct | v1.1 stores the unit of timed work; v1.4 shows the clamped values before sending. Both tested. |
| 8 — No hidden intelligence | Ordering rules in `exerciseSearch.js` are five named sections and a tested sort; no scoring. |
| 10 — Performance | One extra POST on Starten (v1.1); one extra column on history GET and two small queries on the template list (v1.2–1.3); `plan.js` shrinks (v1.5). No new bundle dependency. |
| 11 — Data austerity | No new personal data. `name_nl` is content; `unit` is part of a record the user already owns; "laatst gedaan" is derived from existing rows; kit chips are sheet-local state, never stored. |
| 12 — Lean architecture | One row primitive for two sheets; one search module; six step constructors become one. Duplication goes down in every version that touches it. |

## 9. Excluded, deliberately

Drag-to-reorder (arrows behind "⋯" instead); the trainer's library in Hergebruiken (phase 2
of the design, gated on a trainer authoring a session); weights or load per set (no load axis
in the engine); removing the equipment filter (v1.3 makes it adjustable instead); a
full-screen builder (the sheet is right).

## 10. Execution protocol per version

1. **Brief.** The manager (this session) hands the build agent: this file's section, the
   assessment findings it cites, the screenshots, the rules in §0, and the exact Dutch copy.
   Work happens in a git worktree off `main`.
2. **Build and prove.** The agent implements, writes the tests and guards, breaks each guard
   once and quotes the failure, runs `npm test`, `npm run smoke`, `npm run e2e`, and reports
   the ratchet numbers before and after.
3. **Review.** The named reviewer reads the diff against the acceptance list and the §0 rules
   (classes only, Dutch first, line budgets, pure logic in `.js`), and runs the e2e suite
   from the worktree.
4. **Release.** The manager merges, runs `npm run release` on `main`, pushes, deploys, and
   verifies the served bundle hash equals the built one with `curl`.
5. **Docs.** `CLAUDE.md` build-status row, root `FUNCTIONAL_DOCS.md` (what is live), root
   `ROADMAP.md` (remove the item), this file's status column with the commit, and the
   release-evidence block in the commit message or release note.
6. **Next** only after 5.
