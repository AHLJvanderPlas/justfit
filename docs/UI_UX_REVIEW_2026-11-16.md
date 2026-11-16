# UI/UX review of the current build — 2026-11-16

Build reviewed: `fbacf9c` (main, live). Method: all 30 UAT personas replayed on phone viewports
(390, 393 and 320 px wide) with `scripts/uat/uat.mjs`, every main screen read from the
screenshots, plus a source scan for accessibility basics. Dark theme, Dutch.
Result of the replay: 0 page or console errors, 0 horizontal overflow, 0 text under 11 px,
8 taps from signup to the first session. 5 runner steps failed; four are runner-side (it looked
for a button on the wrong screen, or a sheet was still open). The fifth exposed finding 0 below.

## What works well

- The first five minutes: 3 onboarding steps, a session on Today without a modal in between.
- Today has one clear primary action (START SESSIE) and the rest-day / stop-and-keep flows are
  kind and unambiguous ("Stoppen en bewaren" is the default, "Weggooien" is quiet).
- Rest timer: one number, one ring, the next set named underneath.
- Empty states say when content will appear ("Na 3 sessies zie je hier…").
- Trofeeënkamer shows earned + next, hides the far horizon.

## Findings, by priority

### P0 — check before anything else

0. **A user with chronic shoulder complaints was given explosive push-ups, with no way out.**
   Omar (p13: shoulder marked as a chronic injury, pain reported in the check-in) got
   "Opdrukken explosief (plyo)" 3 × 12 as his first exercise, and "Alternatieven tonen" answered
   "Geen alternatieven gevonden voor deze oefening". Not yet verified whether the injury filter
   (R562–R565) ran on this plan or the plan was built before the profile held the injury; either
   way the user saw it. *Advice:* reproduce with the planner matrix (shoulder injury → no
   `loads_shoulder` step, ever), and never show an empty alternatives sheet — fall back to
   "Overslaan" with one line of reassurance.

### P1 — the core loop

1. **The working screen repeats itself and hides its main action.** The exercise name is shown
   twice (header and title), the set twice ("SET 1/2" and "SET 1 VAN 2"), reps three times
   (stepper, dots, counter). In the bottom bar "Overslaan", "Alternatieven tonen" and
   "Set afronden" have the same weight; the primary one is not in the accent colour.
   *Advice:* one name, one set label; "Set afronden" as the only accent button; skip and
   alternatives behind one "⋯" or as quiet text links. Principle 7: glanceable in 2 seconds.
2. **A permanent amber tip takes the top of every workout screen** when the wake lock is not
   available. *Advice:* show it once per session, dismissible, then a small icon.
3. **Mixed language inside a session.** Names are Dutch, the instruction text under them is
   English ("Lower yourself fully to the floor…"), award names are English. *Advice:* Dutch
   instruction steps for the ~50 most-prescribed exercises first (generated the same way as
   `name_nl`), then the rest.
4. **The session rating asks for jargon and two controls.** "RPE 1–10", a slider and ten dots
   for the same value, pre-set at 5, and "Hoe was het gewicht" after a bodyweight session.
   The server only uses three levels. *Advice:* three large buttons — Te licht / Net goed /
   Te zwaar — nothing pre-selected, the note field behind "Notitie toevoegen".
5. **Numbers without a label.** "0" top right on Today, "1D · 10" after a session, "0" beside a
   recent session, bare week numbers 36–47 under the chart, a "1%" ring, "training · 0 min" and
   "1 set × 0s" in Deze week. *Advice:* every number gets a unit or a word ("Reeks 1 dag ·
   score 10", "wk 47"); hide a duration or set that was not recorded instead of printing 0.
6. **Session length does not match what was asked.** Sanne chose 20 minutes and gets 7 and
   6 minute sessions with a "TIJD AANGEPAST" chip that does not say why. *Advice:* check the
   planner's beginner scaling against the chosen duration; the chip should state the reason
   ("Korter: eerste week") or go.

### P1 — accessibility

7. **Secondary text is below WCAG AA.** Muted text `#64748b` on `#020617` is 4.25:1 (4.5 needed
   for small text) and it carries real content at 11–13 px; placeholders are dimmer still.
   *Advice:* raise `--muted` to about `#8391a7` (≈ 6:1) in the dark theme, check each accent
   colour and the light theme the same way, and add the check to smoke.
8. **Keyboard and screen-reader support is thin.** One `:focus-visible` rule against 30
   `outline: none`; one `aria-live` region in the whole app, so the rep counter, timers and
   "set klaar" are silent; 40 `aria-label`s for an icon-heavy UI. *Advice:* one global
   focus ring, `aria-live="polite"` on counter/timer/save confirmations, labels on every
   icon-only button (⋯, ×, ‹, trash).
9. **Controls under 44 px remain:** login tabs and legal links (15 px tall), "Doorgaan zonder
   account" 36, UITLOGGEN 34, back "‹" 40×36, injury chips 33, check-in chips 39, builder
   "⋯"/"×" 36, "Waarom dit plan?" 32. *Advice:* one `min-height: 44px` hit-area class, applied
   to these seven.

### P2 — clarity and consistency

10. **Today carries duplicate and static cards.** Two cards titled DEZE WEEK, a Trainingsdoel
    card that never changes, and a coach sentence that restates the title ("Sessie van vandaag:
    gebalanceerde sessie."). *Advice:* merge the two week cards, move the goal to Doel & coach,
    show the coach sentence only when it adds a reason.
11. **The header costs ~120 px on every tab** (logo row + CHECK-IN), also on Settings and
    Trofeeënkamer where a check-in makes no sense. *Advice:* check-in only on Today; elsewhere
    the page title is the header.
12. **"Deze week" means two things.** The tab says "Je afgelopen 7 dagen" and shows a rolling
    strip (di 10 – ma 16); the week pill, the target and Voortgang count Monday–Sunday.
    *Advice:* one definition — the ISO week — everywhere.
13. **Onboarding's sticky footer covers choices.** "Gevorderd" is cut off behind the buttons on
    step 2, and the session-length chips sit below nine equipment rows on step 3. Three actions
    compete (Terug / Doorgaan / Sla deze stap over). *Advice:* length first, then the 4 common
    equipment options with "Meer materiaal"; a fade at the scroll edge; drop "Sla over" where
    a default is already selected.
14. **Login has two tab levels and a consent box in the sign-in path** (Inloggen/Account maken ×
    Magische link/Wachtwoord, then the guest checkbox). It is coral while the app is emerald.
    *Advice:* one field ("E-mail") + "Ga verder", password as a link, guest as its own small
    section; one brand accent.
15. **Back and exit are inconsistent:** "← Vandaag", "← Voortgang", "‹", "← Terug",
    "← Annuleren"; UITLOGGEN sits in the top-right of every Settings screen. *Advice:* one back
    pattern (chevron + parent name); Uitloggen at the bottom of Account.
16. **The builder speaks in symbols** ("3 × 10 @ 45 s"). The read-back line helps; small column
    labels (sets · reps · rust) above the first row would remove the guess.
17. **Coach view and Trofeeënkamer are only reachable through links.** Fine for now; the coach
    card on Today should look tappable (chevron) for every path.

### P3 — polish

- No confirmation pattern after a save (chips save silently): a short "Opgeslagen" line.
- Award names in Dutch, or keep English and add a Dutch one-liner under each.
- A skeleton for the Today card while the plan loads; desktop width is a stretched phone.
- Re-run this review in the light theme and with two non-default accent colours.

## Suggested order

| Release | Content | Size |
|---|---|---|
| 0 | Finding 0: reproduce, fix, guard | S |
| A | Workout screen: findings 1, 2, 4 | M |
| B | Labels and language: 5, 6 (after the planner check), 12, 3 for the top 50 exercises | M |
| C | Accessibility: 7, 8, 9, with smoke guards for contrast and hit area | M |
| D | Today and chrome: 10, 11, 15 | S |
| E | Onboarding and login: 13, 14, 16 | M |

Evidence: `.uat-out/` (gitignored) — screenshots per persona and `sheet-*.png` contact sheets;
rerun with the command in `docs/UAT_PERSONAS_2026-11.md` Appendix B.
