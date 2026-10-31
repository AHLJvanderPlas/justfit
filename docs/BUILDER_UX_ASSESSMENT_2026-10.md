# Session builder — UX assessment and improvement advice

**Date:** 2026-10-31
**Scope:** everything behind "Eigen training" on the Today card — the chooser, **Samenstellen**
(`SessionBuilder.jsx`), the shared exercise picker (`sessionSheet.jsx`), **Hergebruiken** and
saved trainings (`MyTrainings.jsx`), the run-mode and "Klaar om te starten" sheets
(`EigenTraining.jsx`), and **Registreren** (`LogSessionSheet.jsx`) where it shares parts with
the builder. The planning-mode builder reached from the Coach view is covered too.
**Follows:** `MANUAL_TRAINING_DESIGN.md` (phase 1 live 2026-10-06).
**Method:** the live flow was driven on the local build of commit `7c2dbe3` (the deployed one)
at phone width, 390 × 844, Dutch UI, as a fresh general-goal user with no equipment — 26
screenshots, all walked end to end (chooser → build → save as template → Starten → Als extra →
WorkoutView; Hergebruiken; Registreren both phases; the Coach-view builder; pin mode). Every
claim below is tied to a screenshot, the source, or a query against the e2e database, which is
production's schema and seed. Nothing is estimated.

---

## 0. Verdict

The **decisions** are right and the **flow** is right: three verbs, one new choice ("Als extra"
is the default and says what it does), one primary action per sheet, an honest time estimate,
safety that advises instead of blocking, and a built session that runs as a first-class session
in WorkoutView. The e2e journeys hold all of that.

What is weak is the **building itself**, in four ways. (1) In Samenstellen the exercise you add
lands out of view, under the picker and behind the sticky footer — the exact pattern the
product owner flagged in the log sheet, which was then fixed there and not here, so the two
sheets now contradict each other. (2) The library cannot be browsed: with an empty search the
picker silently shows 40 of 274 exercises, alphabetically, so the list opens on two Cooper tests
and four breathing drills. (3) Numbers are ± steppers only (ten taps for 10 → 20 reps) while the
log sheet types them. (4) Editing or deleting a saved training lives on the Coach view, which is
not in the bottom nav for anyone without a trainer.

| # | Finding | Severity | Effort |
|---|---|---|---|
| B1 | Added exercises land below the picker, out of view; the log sheet already solved this the other way round | 🔴 | S |
| T1 | Saved trainings can only be edited or deleted on the Coach view, which most users cannot reach | 🔴 | S |
| P1 | The picker caps at 40 rows with no notice, sorts alphabetically, and opens on Cooper tests and breathing drills | 🔴 | M |
| B2 | Sets, reps, time and rest are ± steppers only; no direct entry, unlike the log sheet | 🟡 | M |
| P2 | Search is English-only on a Dutch UI, and a miss shows the wrong message ("niets past bij je uitrusting") | 🟡 | S now, L for data |
| B3 | "Vastzetten + aanvullen" (pin + coach fills) is unreachable from the chooser; the client still carries a dead "Pro feature" branch for it | 🟡 | S |
| A1 | Labels at 9–10 px in ≈2.8:1 and ≈3.8:1 contrast; stepper buttons 32 px wide | 🟡 | S |
| P3 | Equipment filter is the profile's kit; "Toon alles" is the only alternative — no per-item chips for "today's gym" | 🟡 | M |
| B4 | Reps/time toggle is a 10 px mono link; the log sheet uses a chip pair | 🟢 | S |
| B5 | Template-name panel opens inside the sticky footer; success text never clears; unsaved sessions are all named "Mijn training" | 🟢 | S |
| B6 | Advisory notes appear two steps after the decision point in Starten mode | 🟢 | S |
| T2 | Hergebruiken rows show "≈ 12 min · 3 oefeningen" but not which exercises nor when last done | 🟢 | S |
| L1 | Log sheet: "Overgeslagen" is the most prominent control on every card; value placeholder "10" looks filled; default rest 45 s is not among the 60/90/120 chips | 🟢 | S |
| D1 | Library data: 2 names appear twice (two rows each), 8 names start with digits, two Cooper tests | 🟢 | S |
| X1 | The Dutch sheets sit in an English shell (TODAY · DAY 1, HEALTH SESSION, 6 moves, START SESSION, Start workout, RECALIBRATE) | 🟢 | M (app-wide) |

---

## 1. What works well — keep it

- **The chooser.** Three verbs, one line of consequence each, 60 px rows, nothing else. A user
  who has never seen it understands it in a glance (screenshot 03).
- **The run-mode sheet.** "Als extra — Je plan van vandaag blijft staan" is highlighted as the
  default; "In plaats van — Vervangt "Health Session" voor vandaag" names what it replaces. The
  consequence is on the button, not in a help text (09).
- **One primary action per sheet**, always in a sticky footer: Starten / Gebruik vandaag / Laat de
  coach de rest invullen / Verder → / Opslaan voor za 31 okt. The quiet "Bewaar als sjabloon"
  under it is the right hierarchy.
- **The estimate.** "≈ 12 min · je tijd 45 min", amber when over budget, computed by the same
  function the Today card uses. Honest and cheap.
- **Safety advises, it does not edit.** Notes are amber cards on the exercise they concern; a
  blocking note asks for one explicit checkbox. This is the override the owner asked for.
- **The built session is a real session.** WorkoutView shows "Hotel sessie · 3 oefeningen ·
  ~12 min", the same timers, counters and rest ring (10). Progression, streak and history treat
  it like any session.
- **The log sheet's two-phase model**: exercises first with the search at the bottom where new
  items appear, then one card per exercise with set-group rows (`3 × 3 @ 45 s`), "+ Rij"
  duplicating the last row, typed shorthand `3x3, 2x4` expanding on blur, and a summary line
  "5 sets · 3/3/3/4/4 @ 45 s" that reads back exactly what will be saved (13, 16).
- **Everything is covered**: e2e journeys (a) build → Starten → Als extra → a set in
  WorkoutView → done card, (b) Registreren for today; unit tests for the rules
  (`ownTraining.test.js`, `logSession.test.mjs`).

---

## 2. Findings

### 2.1 Samenstellen — the builder

**B1 — What you add appears out of view.** The sheet is: intro → search → a 210 px result list →
"JOUW SESSIE" → the cards → sticky footer. On a phone the first card sits under the footer
(screenshot 05: the card's top edge is just visible behind "≈ 12 min"). Tapping "+" on a result
gives one signal — the row's marker turns to "+1" — and nothing scrolls. After three adds the
user has to scroll past the picker to see what they built (06). The log sheet was redesigned on
2026-10-06 for precisely this complaint ("when adding, it will add to the bottom of the list,
where adding new items is at the top"): list first, search at the bottom, the new item
scrolled into view and outlined (13, 14). Samenstellen never got the same treatment, so the two
sheets that look alike behave opposite.

**B2 — Numbers are steppers only.** Sets ±1, reps ±1, time ±5 s (±30 s above 2 min), rest ±15 s,
with 32 × 40 px buttons 3 px apart (06). From the default 10 reps to 20 is ten taps; from 45 s
rest to 2 min is five; a 5-minute plank hold is nineteen. The log sheet, one tap away in the
same chooser, types `3 × 12 @ 60` into 44 px fields with a numeric keypad and accepts
shorthand. Principle 7 asks for about two seconds per interaction; a stepper gets there only
for ±1 nudges.

**B3 — Pin + coach fills is hidden where it is useful.** The chooser's Samenstellen opens the
builder in Starten mode, which deliberately hides the "Vastzetten + aanvullen" tab (pinning
re-plans today; it is not an extra). The tab exists only in the planning-mode builder, which is
reached from the Coach view (see T1) or from "Lukt dit niet?" — and "Lukt dit niet?" no longer
has an "Ik doe iets anders" option (18). So "I want push-ups today, you fill in the rest", the
lightest form of override, is effectively unreachable. The builder's `fill()` also still checks
`data.plan?.capped` after the POST and would show "Letting the coach fill in is a Pro feature"
— but pins have been exempt from the C-G4 cap since 2026-10-04 (`decideExistingPlan`, and
`plan-override-requests.mjs` asserts it), so that branch can never run. Dead code with a
misleading string; remove it. *(Corrected 2026-10-31: an earlier draft of this finding said the
Pro gate fired late. There is no Pro gate on pins.)*

**B4 — The reps/time toggle is a 10 px mono link** ("Tijd gebruiken" / "Reps tellen"), shown
only on exercises that support both, below the steppers. Easy to miss; the log sheet shows the
same choice as a two-chip group at the top of the card.

**B5 — Template save, three small things.** The name panel opens *below* "Starten", inside the
sticky footer, so the footer grows to ~40 % of the screen (07). After saving, "Sjabloon
bijwerken" plus "Opgeslagen in Mijn trainingen." stays for the life of the sheet (08). A
session started without saving is named "Mijn training" — every unsaved own session in
history has the same name.

**B6 — Advice arrives late in Starten mode.** The advisory pass runs only when the run-mode
choice is submitted; notes show on "Klaar om te starten". The user has built, chosen extra or
replace, and only then learns the coach would leave an exercise out. The planning-mode builder
shows notes on the card itself after a 409; Starten mode could do the same before the run-mode
sheet.

**B7 — Heavy card chrome.** Each card carries three 36 px outlined icon buttons (↑ ↓ ×) beside a
14 px name. Reordering a 6-exercise session is up to fifteen taps. Minor; drag-to-reorder is
the fix and not cheap without a library. A single "⋯" that reveals the arrows would do.

### 2.2 The picker (shared by Samenstellen and Registreren)

**P1 — The library cannot be browsed.** `ExercisePicker` filters by the profile's equipment,
sorts by name, and slices to 40. For a bodyweight user that is 40 of 274 rows, with no sign that
234 more exist. Alphabetical puts digits first, so the list opens on "12 minuten loop (Cooper
test)", "12-Minute Cooper Test", "360 Breathing", "4-7-8 Breathing", "4-7-8 Breathing" (two
library rows share the name), "5 Senses Grounding", "90-90 Stretch", "90/90 Hip Switch" … (04,
12). Nothing a user building a hotel session wants is on the first screen; the Push-up is 40+
rows down and only reachable by typing. There is no category filter, no "from today's plan",
no "recently done". Note the picker does not apply R596's civilian filter, so military protocol
rows (Cooper tests, rucksack marches) sit among the first results — by design the user may add
them, but they should not lead the list.

**P2 — Search is English-only, and a miss says the wrong thing.** `name_nl` is empty on all
482 rows (query against the e2e database, which mirrors live); the picker matches `name` and
`slug`. A Dutch user typing "opdrukken" gets "Niets past bij je uitrusting — probeer Toon
alles." (21). That is false on both counts: the miss is the query, not the kit, and Toon alles
will not help. The copy is chosen only on the `showAll` flag, not on whether the query matched
anything.

**P3 — Equipment is the profile's, not today's.** "Gefilterd op je uitrusting" uses
`available_equipment` from the profile. The design's own use case is a hotel gym with one
bench — a kit that differs from the profile for one day. The only alternative is "Toon alles",
which lifts the filter to all 482. There are no per-equipment chips.

**P4 — Result rows are fine.** Name 13 px, category + kit in 10 px mono, 48 px rows, "+" / "+1"
marker, the row tinted when added. Keep.

### 2.3 Hergebruiken and saved trainings

**T1 — Edit and delete are on a view most users cannot reach.** "Mijn trainingen" with
Gebruik vandaag / Bewerken / Verwijderen lives on the Coach view. The Coach tab is in the
bottom nav only when `hasTrainer` is true (`Nav.jsx`). Everyone else reaches the Coach view
through the "Explore coaches →" discovery card on Today — shown only after three sessions,
hidden once any coach is active, dismissible for good — or through Settings → Jouw coach. The
Hergebruiken sheet itself offers no edit, no delete (11). In practice a saved training is
read-only for most users, and a typo in its name is permanent.

**T2 — Rows say little.** "Hotel sessie · ≈ 12 min · 3 oefeningen". Which three, and when did
I last do it? `source_ref` on executions (migration 0122) already makes "laatst gedaan op …"
a one-join query; the step names are in `steps_json`. Phase 3 of the design lists this.

**T3 — "Van je trainer · Binnenkort"** is a disabled row for gym members. Acceptable as a
phase-2 placeholder; it should not outlive phase 2.

### 2.4 Run mode and start

Strong (09). Two notes: the "← Terug" link at the bottom is 12 px muted; and when the choice is
skipped (plan already done, or no plan) the session starts as an extra with no sheet, which is
right, but the sheet title "Eigen training" flashes for the request's duration with only
"Starten…" in it. Fine.

### 2.5 Registreren — the log sheet

Reads well; the two-phase model is the one the builder should copy. Three small things (15–17):

**L1a** — "Overgeslagen" is an outlined pill at the top right of every card, the most prominent
control in the card for the exception case. A quiet text link in the tools row would do.
**L1b** — The value field's placeholder "10" is grey but reads as a value next to the white
"3" and "45" (15). An empty field with a unit hint ("reps") is clearer; the summary line "Vul de
herhalingen per set in." already covers the state.
**L1c** — Rest is pre-filled with 45 s (`getDefaultRest` for bodyweight) but the chips are
60 / 90 / 120, so no chip is lit and the pre-fill looks unchosen. Add the default to the chips
or pre-fill 60.
**L1d** — Known and recorded elsewhere: timed logged work carries no unit in the stored record.

### 2.6 Consistency — the two sheets side by side

| | Samenstellen | Registreren |
|---|---|---|
| Where new items appear | below the picker, out of view | list first, search below, scrolled into view |
| Entering numbers | ± steppers only | typed fields, numeric keypad, shorthand |
| Reps or time | 10 px link under the steppers | chip pair at the top of the card |
| Rest | ±15 s stepper | typed + 60/90/120 chips |
| Structure | one screen | two tabbed phases |
| Row grammar | SETS · HERHALINGEN · RUST | `3 × 12 @ 60 s` |

They share the sheet chrome, the picker and the card styling, so users will expect them to
behave the same. The log sheet's choices are the better ones on every row.

### 2.7 Accessibility

- **Contrast.** Eyebrows ("JOUW SESSIE", "VASTGEZET · 2/3") are 9.5 px at 32 % white on the
  sheet (`--sheet` `#0f172a`), ≈2.8:1. Stepper labels (SETS / HERHALINGEN / RUST) are 9 px in
  `--muted` (`#64748b`), ≈3.8:1 on the sheet — below the 4.5:1 AA threshold for small text,
  and they are the only labels the steppers have. The Today entry line "Eigen training · Lukt
  dit niet?" is 12 px in the same colour on the app background, ≈4.2:1. `--muted` is a system
  token, so this is wider than the builder, but the builder is where it carries meaning.
- **Touch targets.** Stepper buttons 32 × 40 px with 3 px gaps (mis-taps between − and the
  value); chips ≈34 px tall; icon buttons 36 px. The `.jf-tap` helper that expands a hit area
  to 44 px exists in `styles.css` and is not applied here. Log inputs (44 px) and picker rows
  (48 px) are fine.
- **Semantics.** Steppers have `aria-label`s, chips use `aria-pressed`, the sheet is a
  `role="dialog"` — good. The sheet does not trap focus or close on Escape; minor on a phone.

### 2.8 Language

The sheets are Dutch; the shell around them is not (02, 10, 22): "TODAY · DAY 1", "HEALTH
SESSION", "15 min | 6 moves | MODERATE", "+ 3 more", "START SESSION", "Why this plan?", "THIS
WEEK", "Start workout", "RECALIBRATE", "General health · Consistent daily training". Not a
builder defect, but the builder is the newest and most Dutch surface, so the seam shows most
there. An i18n sweep of Dashboard and WorkoutView headers is a separate, mechanical job.

---

## 3. Recommendations

### R1 — Mirror the log sheet in Samenstellen (fixes B1; S)

Reorder the sheet: intro → "JOUW SESSIE" with the cards → the picker (search + results) → sticky
footer with "+ Oefening toevoegen" (scrolls to and focuses the search) beside "Starten". On
add: append the card, `scrollIntoView({ block: "nearest" })`, outline it for a moment, exactly
as `LogSessionSheet` does with `data-log-key` and `jf-log-item--new`. The picker component is
shared, so this is a layout change in one file plus two CSS classes.

```
  JE EIGEN TRAINING                              ×
  Kies oefeningen … tellen mee voor je voortgang.
  JOUW SESSIE · 3
  ┌ 1  Push-up                          ↑ ↓ × ┐
  │    3 sets · 10 reps · 45 s rust            │
  └────────────────────────────────────────────┘
  ┌ 2  Plank  …                                ┐
  ┌ 3  Air Squat  …                   (outlined, just added)
  [ Zoek oefeningen…          ] [Toon alles]
  Gefilterd op je uitrusting
  ┌ results …                                  ┐
  ──────────────────────────────── sticky ─────
  ≈ 12 min                        je tijd 45 min
  [ + Oefening toevoegen ] [     Starten      ]
         Bewaar als sjabloon
```

**Guard:** the own-training e2e journey asserts, after each add, that the new card's bounding
box is inside the viewport and the picker is below it. Break it by restoring the old order
and watch it fail.

### R2 — One row primitive for both sheets (fixes B2, B4, part of A1; M)

Replace the three steppers with the log sheet's row: `[sets] × [reps|sec] @ [rest] s`, 44 px
fields, numeric keypad, shorthand accepted, and the Reps / Tijd chip pair where an exercise
supports both. Keep ± as small nudge buttons beside the value if the owner wants them; the
field is the primary. One component (`SetRow`) in `sessionSheet.jsx`, used by both sheets, with
`logSession.js`'s `rowGroups` as the single parser. The builder's clamps (`LIM`) stay — the
server clamps again anyway.

Trade-off to decide: the builder's row is a *target* (one value for all sets), the log row is a
*record* (one row per group of equal sets). Use the same visual row; the builder simply has
one row per exercise and no "+ Rij".

### R3 — Make the picker browsable (fixes P1, P2 copy, D1; M)

1. **Default order is relevance, not alphabet.** With an empty query show, in sections:
   *Vandaag in je plan* (today's steps), *Onlangs gedaan* (last 14 days from history), *Uit je
   trainingen* (steps of saved templates), then the library by category with digits and
   `protocol`-tagged rows last.
2. **Category chips** above the list: Kracht · Cardio · Mobiliteit · Herstel. One tap narrows;
   combined with the equipment filter this gets most users to the exercise in two taps.
3. **Say when the list is cut.** "40 van 274 — zoek of kies een categorie" under the list.
4. **Fix the miss message.** Compute whether the query matches anything *without* the equipment
   filter: if yes, "Niets past bij je uitrusting — probeer Toon alles"; if no, "Geen oefening
   gevonden voor 'opdrukken'". Pure function, unit-tested.
5. **Data:** deactivate or rename the duplicate rows (`478-breathing`,
   `progressive-relaxation-body`) in a migration; rename digit-led names to lead with the word
   ("Cooper test, 12 minuten").

### R4 — Dutch search (fixes P2; S now, L for the data)

Now: a synonym map of the 40 most common Dutch exercise words → English tokens (opdrukken →
push-up; buikspieren → sit-up, crunch; kniebuiging/squat → squat; plank → plank; optrekken →
pull-up; uitvalspas → lunge; burpee; touwtjespringen → jump rope; rekken → stretch; hardlopen →
run; wandelen → walk …) applied to the query before matching. Tested as a table.
Then: seed `name_nl` for the 482 rows. This is a content job, not a code job; a generated
first pass reviewed by the owner is realistic in one session. Once seeded, search on both
columns, and the Today card and WorkoutView gain Dutch names for free.

### R5 — Reach the trainings you saved (fixes T1, T2; S)

In the Hergebruiken sheet give each row a "⋯" (or long-press) with **Bewerken** (opens the
builder preloaded, Starten mode) and **Verwijderen** (inline confirm, as the Coach card does).
Add the first three exercise names and "laatst gedaan op …" (from `executions.source_ref`) to
the meta line. The Coach-view card then becomes a secondary surface rather than the only one.

### R6 — Pin + coach fills from the chooser (fixes B3; S)

Add a fourth chooser row — **Vastzetten** · "Kies 1–3 oefeningen, de coach vult aan." — that
opens the builder in pin mode. Pinning re-plans today, so it goes straight to "Gebruik
vandaag" semantics (no run-mode sheet) and says so in its intro. Pins are cap-exempt on the
server for free and Pro alike; remove the client's dead `capped` branch and its "Pro feature"
string so the message can never mislead.

### R7 — Accessibility pass (fixes A1; S)

Stepper and card labels ≥ 11 px at ≥ 4.5:1 (use `--text` at 70 % rather than `--muted`); apply
`.jf-tap` to stepper buttons and chips so every control has a 44 px hit area without changing
the look; add Escape-to-close on the sheet. If R2 ships, the steppers go anyway.

### R8 — Small polish (B5, B6, L1; S, bundle with R1)

- Template name field opens *above* the footer as a one-line panel; success text clears
  after 3 s.
- Auto-name an unsaved session from its first two exercises ("Push-up + Plank") instead of
  "Mijn training".
- In Starten mode, run the advisory pass on **Starten** (a dry-run flag on the same endpoint)
  and show notes on the cards before the run-mode sheet; the acknowledgement stays where it is.
- Log sheet: "Overgeslagen" as a text link in the tools row; empty value placeholder with unit
  hint; default rest included in the chip row.

---

## 4. Proposed releases — one function at a time

| Release | Contents | Guard that fails without it |
|---|---|---|
| 1 | R1 layout mirror + R8 polish + R3.4 miss message | e2e: new card in viewport after add; unit test for the miss-message function |
| 2 | R5 reach saved trainings + R6 pin from chooser | e2e: edit a template from Hergebruiken, rename, reuse shows the new name; e2e: chooser → Vastzetten → pin as a free user → Today lists the pinned exercise; smoke: no `capped` check left in the pin path |
| 3 | R3.1–3 picker order, chips, cut notice + D1 data migration | unit test for the ordering function (today's plan first, protocol last); migration row-count check |
| 4 | R2 one row primitive + R7 accessibility | smoke: no `jf-stepper` left in `SessionBuilder.jsx`; a source scan that every `.jf-chip` and stepper carries `.jf-tap` or ≥ 44 px |
| 5 | R4 synonym map, then `name_nl` seed | table test for the synonym map; migration refuses a zero-row seed (already enforced) |

Releases 1–2 are a day each; 3–4 two days; 5 depends on the content pass. Each is a separate
deploy with its own `npm run release`, as the house rule requires.

---

## 5. Not recommended

- **A full-screen builder instead of a sheet.** The sheet keeps the Today card as context and
  is the same chrome as every other decision in the app. R1 fixes the real problem.
- **Drag-to-reorder now.** Arrows are clumsy but correct; a drag implementation without a
  library is a source of subtle bugs on iOS Safari. Revisit after real use shows sessions longer
  than four exercises.
- **Weights or load per set.** Out of scope of the library model; the engine has no load axis.
  Note it, do not build it into the row.
- **Removing the equipment filter.** It is the right default; R3's chips make it adjustable.

---

## Appendix — screenshots

Captured to the session scratchpad as `shots/NN-name.png`; the contact sheet
`builder-ux-contact-sheet.png` has the twelve that matter. Numbers in the text refer to these:
02 Today entry · 03 chooser · 04 builder empty · 05/06 builder with three exercises (top /
bottom) · 07/08 template panel / saved · 09 run mode · 10 WorkoutView · 11 Hergebruiken ·
12–14 Registreren phase 1 · 15–17 phase 2 · 18 "Lukt dit niet?" · 21 Dutch query ·
22 Coach view · 23/24 planning-mode builder · 25/26 pin mode.
