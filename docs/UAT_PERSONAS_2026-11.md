# UAT with 30 buyer personas — JustFit consumer app (2026-11-01)

**Build under test:** main `dc6bb11` (the deployed build), served locally by `wrangler pages dev` on
the e2e D1. **Method:** a Playwright runner (`scripts/uat/uat.mjs` + `personas.mjs`) drives 30
scripted personas through the flows that person would attempt in week one, on three phone profiles
(iPhone 13 390×844, iPhone SE 320×568, Pixel 5 393×851), in Dutch (28) or English (2). Every screen
is screenshotted and audited in the DOM (controls under 40 px, text under 11 px, horizontal
overflow, controls under the bottom nav); page and console errors are captured; taps and seconds
are counted per flow. Output: `.uat-out/<persona>/` (521 screenshots, a `log.json` each),
`.uat-out/summary.json`, and three contact sheets `sheet-*.png`. Appendix B says how to rerun it.

**What a simulated UAT can and cannot judge.** It proves that a flow completes, counts what it
costs in taps, catches crashes and console errors, measures touch targets and text sizes, and shows
what every screen looks like to every persona. It cannot feel motivation, confusion or trust, and
it cannot judge whether a session is right for a body. Those judgements below are mine, from the
screenshots, and are labelled as such. What it reliably replaces is the first hour of a human UAT:
the walls, the dead ends and the crashes.

## 0. Headline

The core loop works for every persona that reached it: sign-up → onboarding → check-in → path →
Today → session → feedback → Voortgang, in Dutch, on all three phones. The daily check-in is two
taps. The session builder, the week log, the DCP norm and the return-after-a-break ramp all do what
they say. The app's problem is not missing function. It is that five defects sit on the most common
day-one paths, and that the screens after Today show everything the app knows to a user who has
done nothing yet.

| | Severity | Finding | Who hit it |
|---|---|---|---|
| D1 | **P0 crash** | "← Annuleren" during a session crashes the app to "Something went wrong — Reload app" (`ReferenceError: Glass is not defined`, `WorkoutView.jsx:517`). Live since the monorepo restructure `c50810a` (2026-05-20). | 13 of the 13 personas who tapped it |
| D2 | **P1 broken feature** | Production CSP `worker-src 'none'` blocks `/sw.js`. The service worker has never installed since `fdd8884` (2026-05-22): no offline shell, and Pro push notifications cannot subscribe (the toggle hangs on `serviceWorker.ready`). | every page load, all 30 |
| D3 | **P1 trust** | Choosing a path (Hardlopen, Fietsen, Militair) saves to the server but the app keeps running on stale state: Today is not replanned, the coach card never appears, Doel & coach still shows the old goal as "JE PAD", and "Waarom dit plan?" says "er is geen militaire coach actief" to the user who just activated it. Everything is right after a reload. | Daan, Fleur, Tim, Luc (4 of 4) |
| D4 | **P1 planner** | The first check-in's signals never reach the session: `prefs.isPro` is always false since `preferences.isPro` was removed (F8), so every check-in takes the free "adapt" path and the Pro "full daily replanning with check-in" branch is dead code. "Rustig aan" produced tuck jumps and broad jumps; "Slechte nacht + Weinig energie + Niet zo goed" kept GEMIDDELD and no sleep/energy/stress rule in the why-panel. | Marieke, Hanna, Mohammed (3 of 3 with chips) |
| D5 | **P1 conversion** | A brand-new user on the 14-day Pro trial is locked out of Fietsen and sent to the paywall, which then says "Je hebt al een actief abonnement." The Pro flag is only fetched after an *existing* profile loads. Same root cause: the guest Account page reads "Nog  dagen gratis Pro toegang" (no number) and offers "Upgrade naar Pro" for push. | Tim; Anouk's Account page |

Then: numbers that disagree with each other (D6), coach sentences that contradict the session (D7),
two screens outside the design system (D8), small-phone fit (D9) and the Dutch-first gaps (D10).

Of 189 flows, 19 failed; 16 of those are the app (13 × D1, 2 × D3, 1 × D5) and 3 are the runner.

## 1. The defects (all reproducible from the screenshots and the local D1)

### D1 — Cancel crashes the session (P0)
`WorkoutView.jsx` renders `<Glass>` in the cancel overlay (lines 517–528) but never imports it; the
import list has not contained `Glass` since the May restructure. React throws on the first render of
the overlay, the error boundary replaces the whole app, and the session is gone (the boundary offers
only "Reload app", in English, in a fallback serif font). Why it was never caught: no e2e journey
cancels a session, and ESLint's `no-undef` does not check JSX tag names (that needs
`react/jsx-no-undef` from `eslint-plugin-react`). **Fix:** import `Glass` from `uiComponents.jsx`;
add `eslint-plugin-react` with `jsx-no-undef` as an error (break it once to prove it fails); one e2e
step: start → ← Annuleren → Stoppen → "START SESSIE" visible again.

### D2 — The service worker is blocked by our own CSP (P1)
`index.html` loads `/register-sw.js`, which registers `/sw.js` (written by `vite.config.js` with the
hashed asset list). `_headers` sends `worker-src 'none'`, so Chrome refuses the registration on every
load ("Creating a worker from '/sw.js' violates the following Content Security Policy directive").
Consequences: no offline app shell (the IndexedDB plan cache still works); `SettingsView.jsx:659`
awaits `navigator.serviceWorker.ready`, which never resolves without a registration, so the Pro push
toggle hangs forever after the browser's permission prompt; the `justfit-ops` dispatcher has no
subscriptions to send to. **Fix:** `worker-src 'self'` in `_headers` (count the served header with
curl, per the guardrail); a smoke/e2e assertion that the console shows no CSP violation; verify the
push toggle end to end once.

### D3 — A path choice does not take effect until the next app load (P1)
`handlePathChoiceComplete` (`App.jsx:588`) only closes the modal and writes `primary_intent` into
local state. The coach prefs the modal saved (`military_coach`, `run_coach`, `cycling_coach`) are not
in the client's state and nothing regenerates today's plan. Four visible symptoms, all from the
screenshots: Daan (Militair, keuringsdatum set) and Fleur (Hardlopen 10 km) see "CARDIOVERBRANDING"
with tuck jumps and "Defensie-protocoloefeningen weggelaten — er is geen militaire coach actief"; Tim
sees a generic cardio session while the Coach view says "FIETSEN · WEEK 1 · FTP 200 W"; Luc's
Doel & coach shows "JE PAD · AFVALLEN" with Militair under ANDERE COACHES; none of the four got the
coach card on Today. Joris, whose coach was set through the API before a reload, got "COOPER TEST ·
BLOK 1 · NULMETING" with the coach pill and the coach card. **Fix:** after the modal
saves, reload the profile into state and regenerate today's plan (the path choice is a one-time
event, so it may bypass the free regeneration cap).

### D4 — The check-in cannot change the session's intensity or selection (P1)
The check-in Apply handler (`App.jsx:840`) branches on `prefs.isPro`. That flag was removed from
`preferences` in F8 and the subscription state is never merged into `prefs`, so the branch is always
false: every user, paid or trial, takes the free "adapt the stored plan" path, which scales reps and
rest but cannot change intensity, swap the pool to mobility/recovery (R513, R559), or add the rule to
the trace. Evidence from the local D1: Marieke's stored check-in is sleep 4 h, energy 3, stress 8;
her stored plan's trace has no R511/R512/R513 and the card says GEMIDDELD. Mohammed's check-in has
`recovery_mode: true`; his Today was "CARDIOVERBRANDING" with Tuck Jump 2 × 12, unchanged from
Tom's. Hanna (sleep 4) kept GEMIDDELD. The "Lukt dit niet?" path (line 1100) regenerates with an
override and works, which is why Tom's "Geen tijd" produced a 4-minute session. **Fix:** decide the
branch on the entitlement state (`isPro`), and have the server read today's stored check-in when a
plan request carries none, so a later regeneration cannot drop it; one e2e: check-in "Rustig aan" →
the session is mobility/recovery and the why-panel says so.

### D5 — Day-1 trial users meet the paywall (P1)
`App.jsx` fetches `/api/subscribe` only inside the profile-loaded branch (line 552). A fresh account
has no profile, goes through onboarding, and the path modal opens with `isPro = false`;
`PathChoiceModal` locks Fietsen on that flag; the paywall it opens detects the trial correctly and
prints "Je hebt al een actief abonnement" under "Start nu Pro →". The path choice is closed, so the
user lands on Today with no path. The guest Account page shows the same unknown-state: "Gratis
proefperiode · Nog  dagen gratis Pro toegang" and "Dagelijkse trainingsherinnering PRO · Upgrade
naar Pro →". **Fix:** fetch the entitlement at mount (the token is known), lock only on "known and
not Pro", never close the path modal to show a paywall to someone already entitled.

### D6 — Numbers that disagree with each other (P2, Principle 7)
- Pregnancy banner: header "Week 21 of your pregnancy", body "Week 20 · Halfway there" (Lotte).
- Postnatal banner: "Day 56 after birth" next to "Week 6" (day 56 is week 8), and it tells a user
  whose clearance is recorded to "check in with your midwife or GP about exercise clearance" (Eva).
- Voortgang right after the first completed session: "Herstel — Niets gelogd in de afgelopen 14
  dagen"; "STERKSTE Duwen · Score 0" next to "ZWAKSTE Duwen · Score 0"; "DEZE WEEK · ACHTERSTAND"
  on the day the user completed the day's session (Bram, Bas).
- Timed holds come out as "2 × 32s", "1 × 23s", "2 × 48s": volume scaling leaks into the
  prescription. Round timed targets to 5 s.
- "Sessie 0 van 3" on the cycling Coach view before any session, "FTP 200 W" never entered.

### D7 — Coach sentences that do not match the session (P2, Principle 4)
- Mark (dumbbells, no running shoes): "Loop-ren intervallen — de veilige manier om
  hardloopcapaciteit op te bouwen" above Pike Push-up, Tricep Chair Dip and Dumbbell Shoulder
  Press; the why-panel adds "Sessie met je eigen lichaamsgewicht — geen materiaal" with a dumbbell
  press in the list.
- Lotte (pregnant): "Sessie van vandaag: beweging van vandaag." where the pregnancy-safe
  rationale should be.
- Hanna (perimenopause): "Intensity capped at moderate · stress threshold lowered · cycle phase
  rules paused": English, and system-speak.
- Every why-panel opens by default with 10–15 bullets, most of them internals ("Sessie opgebouwd
  rond je progressieprofiel", "Variatiecheck", "De opbouw van deze sessie volgt uit je
  progressieprofiel").

### D8 — Two screens outside the design system (P2)
The connect screen (`/connect?t=…`) and the error boundary render in the browser's serif fallback
font and in English only. The connect screen shows "Could not load trainer info" in red and still
offers "Send request"; the confirmation reads "your connection request to **your trainer**" because
the name never loaded. A user is asked to share data with a trainer whose name is unknown.

### D9 — Small-phone fit (P2)
On the iPhone SE (320 px): the Today title clips ("CARDIOVERBRAN"), the fourth nav label clips
("INSTELLIN"), and on a timed set the countdown reads **0:00 in red** before it has been started
while the round Start control sits under the bottom action bar. On every phone the nav labels are
9 px and the Today eyebrows 9.5–10.5 px ("VANDAAG · DAG 1", "Trainingsdoel", the goal line, "DEZE
WEEK"); the floor set in builder v1.4 is 11 px. On first paint the Settings landing's sixth row
(Account) sits behind the nav on 15 of 18 landings, and "START SESSIE" sits behind the nav on 12 of
27 Today screens.

### D10 — Dutch-first gaps (P2)
The shell is Dutch; these are still largely English for a Dutch user: Settings → Jij (every section
title and helper line: "Daily Planning", "Available time per session", "Time overhead", "Known
injuries", "Your profile", "Display name"…), Deze week (session names, "Nov 2", "TIME-ADJUSTED"),
Voortgang ("Fresh start — let's build from here", "Share progress", "Sun 1 Nov", "Next: The Habit"),
the Trophy room chrome ("Earned", "Next up", "Far horizon", "Reveal all"), the Privacy centre, the
instruction screen's why-line ("Progressive strength training builds lean muscle…") and category
label ("Flexibility & Joints" beside "Volledige lichaamskracht"), the pregnancy / postnatal /
perimenopause banners, the guest banner, "Rest Day", "Skip", the login page, the connect screen,
the error boundary. Exercise names were English in this run only because the local e2e database has
no `name_nl`; production has them since migration 0124 — not a finding.

### D11 — Smaller things seen on the way (P3)
- Doel & coach: TRAININGSDAGEN and SESSIEDUUR chips show no current selection; NORMEN shows an
  amber "Vul een geboortejaar … in" before the user has touched it; the only save button
  ("Opslaan · Afvallen") sits inside the JE PAD card, so the chips below look unsaved.
- The goal headline stays "AFVALLEN EN BETER VOELEN" for a pregnant or postnatal user.
- Military follow-up: "Keuringsdatum (optioneel)" while the selected mode is "Datum". The running
  follow-up offers 5 distances; Settings offers 13.
- After enabling the DCP norm the app jumps to Today with a floating pill "Meting staat in je sessie
  van vandaag" over the content; the two measurement rows on the Today card read "1 × 2 min" with
  nothing that says they are the DCP measurement (the WorkoutView does say "Max · 2 min").
- Guest Account: "EMAIL ADDRESS — · Not verified · Resend · Enter code" for an account that has
  no email; the row should read "E-mail toevoegen".
- The wake-lock tip takes the top 100 px of every exercise screen on a phone without the API.
- "Continue without account" exists only under the CREATE ACCOUNT tab.
- After "Gewoon rusten" the done card still offers "BONUSSESSIE — MINUTEN?".

## 2. Flow by flow — what the personas experienced

Taps are the runner's own taps (what a person would tap, not scrolls).

| Flow | Personas | Result | Taps | What it felt like (my reading of the screens) |
|---|---|---|---|---|
| Sign-up + onboarding (waiver → goal → about you → fitness → equipment & time → sports) | 30 | 30/30 | 14–17 to the first Today | Six full-screen steps, each with "Skip this step": clear, well-sized cards, one question per screen. It is the longest run of taps in the app and ends in two more modals (check-in sheet, path choice) before Today is seen. |
| Daily check-in (mood → signals → optional detail) | 31 | 31/31 | 2 (Goed → Toepassen) · 3–4 with chips · 6 with pain detail | The best screen in the app: one tap for the common case, chips for the rest, a detail step only when pain is tapped. "Skip" is its one English word. Its signals are then lost (D4). |
| Path choice | 30 | 29/30 | 1–4 | Clean 2×2 grid; follow-ups are short and in Dutch. Fietsen opened the paywall for a trial user (D5); no path took effect until reload (D3). |
| Today → start session | 27 | 27/27 | 2 | Strong hierarchy: title, one coach sentence, duration · exercises · intensity, three exercises, one CTA. Then "Waarom dit plan?" opens by default with 10–15 bullets. |
| Session: instruction → tap-to-count / timer → rest → next | 27 | 27/27 to the first set; 13 crashed on cancel (D1); 4 completed the whole session | 8–29 | The instruction screen is excellent (name, why, sets/reps, equipment, muscle map, steps, one sticky CTA); tap-to-count and "Alle N herhalingen gedaan" are fast; the rest ring is calm; the alternatives sheet ("Probeer dit", "Oorspronkelijke houden") is right. Timed sets on the SE: D9. |
| Session feedback → "Sessie afgerond" | 4 | 4/4 | 1 | RPE 1–10 slider with a note field; one tap saves. The done card then shows 17 controls (U3). |
| "Lukt dit niet?" | Tom | 2/2 | 2 | One sheet, six honest options, the plan changes immediately. "Gewoon rusten" ends on "Sessie afgerond · Rest Day" (English) and still offers a bonus session. |
| Eigen training: Samenstellen / Registreren / Hergebruiken / Vastzetten | Lisa, Kees, Anouk, Ruben, Femke, Mohammed, Nina | 7/7 | 6–12 | The chooser is clear and the builder is the strongest editing surface in the app (one row per exercise, read-back line, time estimate, sticky footer, "Bewaar als sjabloon"). Hergebruiken shows names, duration and last-done; its empty state points to Samenstellen. |
| Deze week + log a past day | Lisa, Kees | 2/2 | 2–3 | The day strip is good; below it seven identical "niets vastgelegd · Training loggen" rows and seven upcoming days of English exercise names make the page long (U5). |
| Voortgang | Sanne, Daan, Bram, Fleur, Bas, Erik | 6/6 | 1 | Ten screens tall on day one, most of it zeros and "behind" (U4, D6). The "Waar sta ik" DCP card is the one block that says something true and specific ("2 / 16 (veilig 19)", retest date). |
| Settings landing → Jij / Doel & coach / Privacy / Account / Trofeeënkamer | 14 | 14/14 | 2–4 | The landing (six rows) is right. Jij is a 14-section, 6 900 px page on the SE, in English (U6). Doel & coach has the new shape and reads well (D11 for its loose ends). The Trophy room hides 31 of 37 awards behind "Reveal all": the one place that already does progressive disclosure. |
| Trainer connect (FIT code) | Noor, Femke | 2/2 | 1 | Works, in English, in the wrong font, without the trainer's name (D8). |
| Coach view via the Today card | Daan, Fleur, Tim | 1/3 | 1 | Only reachable after a reload (D3). The view itself: "FIETSEN · WEEK 1", a PRIMAIRE FOCUS radio list with three inactive coaches, Mijn trainingen, the coach card, "Weekplan →". |
| Return after 21 days (R558) | Sophie | 1/1 | 0 | "We laten je rustig terugkomen — volume beperkt tot 75% na je pauze." Exactly what Principle 2 asks for. |
| DCP norm: enable → measurement in today's session → "Waar sta ik" | Bram | 1/1 end to end | 4 + a session | Birth year → toggle → Today shows two "Max · 2 min" sets at the front → the Voortgang card shows "2 / 16 (veilig 19) · hermeting elke 6 weken". |
| Second check-in from the header (Pro replan) | Yara | 1/1 | 3 | "Geen tijd" → a 4-minute, 2-exercise session. Works through the override path, not the check-in path (D4). |
| Guest | Anouk | 1/1 | +1 | "Add your email to keep your data" banner (English); everything else identical; the Account page is the D5 unknown-state. |
| Privacy export / delete | Esther | 2/2 | 2 | The Privacy centre is honest and well structured, in English; delete routes to Account (two hops). |

## 3. What should be easier to reach, and what can move further away

The rule I applied: **Today shows one decision; what the user did not ask for sits one tap away;
what the app cannot yet say anything true about stays hidden until it can.**

### Move closer (too far or too small today)
1. **"Lukt dit niet?" and "Eigen training"**: the two escape hatches that keep a user consistent
   are 13 px text links under the CTA. Make them a secondary row of two ghost buttons (44 px) under
   START SESSIE. They are the second most used action after Start.
2. **A safe cancel**: after D1, keep "← Annuleren" but let "Stoppen" return to Today with the
   session kept as partial. The overlay now promises "Your progress won't be saved", which punishes
   the honest stop; the execution already records sets per exercise.
3. **"Continue without account"** on the SIGN IN tab as well; a visitor's first intent is to try.
4. **The DCP measurement rows on Today**: label them "DCP-meting · max in 2 min".
5. **The coach sentence**: keep it, but make it the reason that changed today (D7): "Slecht
   geslapen → lichter vandaag" beats "Sessie opgebouwd rond je progressieprofiel".
6. **The language toggle**: it is at the bottom of Jij; a user who lands in the wrong language
   will not find it. Put NL/EN on the Settings landing.
7. **The running-shoes prerequisite** under ANDERE COACHES → Hardlopen ("Hardloopschoenen
   toevoegen — tik om ze aan je materiaal toe te voegen") is good; the same inline nudge belongs in
   the path modal's running follow-up.

### Move further away (in the way today)
1. **"Waarom dit plan?" open by default** (U2): collapse it; the coach sentence carries the one or
   two rules that changed today; the full list stays behind the chevron.
2. **The done card's 17 controls** (U3): "Sessie afgerond · Goed werk" + one row "Extra activiteit
   loggen →" (sheet) + one "Bonussessie →" link; nothing after "Gewoon rusten".
3. **Voortgang before data** (U4): until three sessions exist show only the trajectory sentence,
   the streak, "Waar sta ik" (if a norm is active) and the next award. Insights, axes, Doelfit and
   the radar wait for the 14-session gate the radar already has.
4. **Deze week's seven log rows and seven upcoming days** (U5): one "Training loggen" for the day
   selected in the strip; upcoming collapsed to tomorrow and the day after.
5. **Jij's planner toggles** (U6): Sport-aware bias, Polarised training, Daily adaptive replan, Time
   overhead and Rustdagen move under Doel & coach → "Geavanceerd" (collapsed). Jij keeps name, sex,
   weight/height, body mode, injuries, language, appearance.
6. **The PRIMAIRE FOCUS radio list on the Coach view** (three "Niet actief" coaches for a user with
   one coach): show it only when two coaches are active, which is the conflict it exists for.
7. **The "Specialistische coaching" upsell card on Today**: it appeared for a returning user who had
   already chosen a path; show it once, from Doel & coach.
8. **The six-step onboarding**: fold the path choice into the goal step (the goal cards and the path
   cards ask the same question twice: "Afvallen", then "Algemeen / Hardlopen / …"), and let the first
   check-in be the first "Goed" tap on Today instead of a sheet before Today exists.

## 4. Phone fit

Measured in the DOM on every screenshot (viewport only; the 9 px nav labels counted once, overlays
excluded from the under-nav count because they sit above the nav):

| Check | Result |
|---|---|
| Horizontal page overflow | 0 of 521 screens |
| Text under 11 px (besides nav labels) | Eyebrows on Today and the sheets: "VANDAAG · DAG 1" 9.5 px, "Trainingsdoel" 10 px, the goal line 10 px, "DEZE WEEK" 10.5 px, "Waar train je?" 10.5 px, "Welkom bij JustFit." 10.5 px |
| Controls under 40 px | Login: "Privacy Policy" / "Terms & Conditions" 15 px tall, MAGIC LINK / PASSWORD tabs 34 px; sheet close "×" 32 × 32; onboarding kg/cm toggles 48 × 32; onboarding time chips 30 × 37 (narrow); sports chips 33 px tall; check-in chips 39 px; header CHECK-IN 34 px |
| Controls behind the bottom nav on first paint | Settings landing "Account" row (15 of 18); Today "START SESSIE" (12 of 27); Jij's duration chips (6 of 8); Deze week "Training loggen" (2 of 3) |
| iPhone SE only | Today title clipped; "INSTELLIN" clipped; timed set: "0:00" in red before start, Start control under the action bar; Jij = 6 900 px |

Touch targets on the primary paths (goal cards, check-in mood and chips, CTA, SetRow fields, chooser
rows) are 44 px or larger; the misses are secondary controls.

## 5. Ranked recommendations

1. **Fix D1 today**: import `Glass`, the `jsx-no-undef` rule, an e2e cancel step. One line, a guard
   and a test, and every user who cancels a session stops losing the app.
2. **D3 + D4 + D5 are one release**: they share a root (client state that does not follow the
   server: entitlement, coach prefs, check-in). Fetch the entitlement at mount; after the path modal
   reload the profile and replan; branch the check-in on `isPro` state and let the server fall back
   to the stored check-in. Three e2e steps: path → coach pill on Today; "Rustig aan" → recovery
   session; trial user → Fietsen opens.
3. **D2** (`worker-src 'self'`): one header line, verified by curl count and a console assertion.
4. **Today diet** (move-closer 1 and 5; move-away 1 and 2). Lowest effort, highest daily impact.
5. **Progressive disclosure on Voortgang and Deze week** (move-away 3 and 4): gate on data, not tier.
6. **Dutch sweep of the remaining screens** (D10); extend `dutchShell.scan.mjs` to Jij, PlanWeekView,
   HistoryView, AwardsView, the banners, ConnectScreen and ErrorBoundary.
7. **Numbers that agree** (D6): one source for pregnancy/postnatal week; round timed targets;
   "Herstel" reads the session just saved; insights hide while all scores are 0.
8. **Settings → Jij split, Doel & coach loose ends, Coach view radio list** (move-away 5 and 6, D11).
9. **Small-phone pass** (D9): title clamp at ≤ 360 px, nav label 10–11 px, timed-set layout on
   568 px, bottom padding equal to the nav height on every scrolling view, the two serif screens
   onto the design system.

## Appendix A — the 30 personas

| Persona | Who | Phone · taal | Flows | Failed | Taps | What they met |
|---|---|---|---|---|---|---|
| p01-sanne | Sanne, 34, kantoor, wil gewoon fit blijven, geen materiaal, 20 min | iPhone 13 · nl | 8 | 0 | 40 | Full session completed; RPE screen; done card with 17 controls; Voortgang wall of zeros |
| p02-mark | Mark, 42, BMI 33, wil afvallen, beginner, dumbbells thuis | iPhone 13 · nl | 6 | 1 | 38 | D1; coach sentence about run intervals over a push session (D7); 15-bullet why-panel |
| p03-lotte | Lotte, 29, zwanger (T2), wil veilig blijven bewegen | iPhone 13 · nl | 7 | 1 | 36 | D1; "Week 21" vs "Week 20"; "AFVALLEN" headline while pregnant; Wall Push-up with female muscle map |
| p04-eva | Eva, 31, 8 weken na keizersnede, wil rustig opbouwen | iPhone 13 · nl | 7 | 1 | 30 | D1; "Day 56" vs "Week 6"; asked to get clearance she already has; "Een rustig moment · 4 min · LAAG" is right |
| p05-daan | Daan, 23, keuring Defensie over 10 weken, doel K3 | iPhone 13 · nl | 8 | 2 | 42 | D3 (generic session after choosing Militair); D1; coach view unreachable |
| p06-bram | Bram, 36, militair in dienst, moet DCP-norm halen, geen keuring | iPhone 13 · nl | 7 | 0 | 53 | DCP end to end works; floating pill on Today; "Herstel: niets gelogd" and "ACHTERSTAND" after the session (D6) |
| p07-joris | Joris, 27, in opleiding (O2), open programma | iPhone 13 · nl | 6 | 1 | 29 | Coach set via API + reload: "COOPER TEST · BLOK 1 · NULMETING" with coach pill, correct; D1 |
| p08-fleur | Fleur, 38, wil 10 km lopen in 12 weken | iPhone 13 · nl | 7 | 1 | 45 | D3 (cardio session after choosing Hardlopen); full session completed; coach view unreachable |
| p09-tim | Tim, 45, wielrenner met FTP, Pro, Strava | iPhone 13 · nl | 9 | 2 | 49 | D5 (paywall on day 1 of trial); after reload D3 (generic Today, Coach view says FIETSEN · WEEK 1); D1 |
| p10-hanna | Hanna, 52, overgang, slaapt slecht, wil mobiliteit | iPhone 13 · nl | 7 | 1 | 36 | D4 (rough night ignored); English perimenopause banner in system-speak; D1 |
| p11-peter | Peter, 61, gepensioneerd, slechte knieën, kleine telefoon | iPhone SE · nl | 6 | 1 | 40 | Knee filter from profile works ("Gewichtsbelastende oefeningen gefilterd"); D9 (clipped title, 0:00 in red); D1; Jij 6 900 px |
| p12-noor | Noor, 19, student, krijgt FIT-code van haar sportschool | iPhone 13 · nl | 5 | 0 | 20 | Connect works; English, serif font, "Could not load trainer info" (D8) |
| p13-omar | Omar, 33, chronische schouderklachten | iPhone 13 · nl | 5 | 1 | 27 | Alternatives sheet is right (two options, "Oorspronkelijke houden"); runner timed out after it (not the app) |
| p14-lisa | Lisa, 40, reist wekelijks, bouwt eigen hotelsessies | iPhone 13 · nl | 7 | 0 | 34 | Builder + "Bewaar als sjabloon" + Hergebruiken "Hotel sessie · Push-up · Plank · ≈ 8 min": clean |
| p15-kees | Kees, 48, ploegendienst, logt achteraf wat hij deed | iPhone 13 · nl | 6 | 0 | 29 | Deze week: seven "Training loggen" rows, English dates and names (U5); Registreren works |
| p16-anouk | Anouk, 26, probeert de app zonder account | iPhone 13 · nl | 6 | 0 | 27 | Guest option hidden under CREATE ACCOUNT; English banner; Account page "Nog  dagen", Resend/Enter code without an email (D5, D11) |
| p17-david | David, 35, expat, English only, Android | Pixel 5 · en | 6 | 1 | 35 | English experience consistent; timed-set Start visible on the Pixel; D1 |
| p18-sophie | Sophie, 30, komt terug na 3 weken ziek | iPhone 13 · nl | 6 | 1 | 31 | R558 copy exactly right; "Specialistische coaching" upsell card on Today; D1 |
| p19-ruben | Ruben, 24, wil spiermassa, sportschool, wil gewichten loggen | iPhone 13 · nl | 6 | 1 | 50 | Builder works; no weight field on a set row for a gym user (kg is not a unit in SetRow); D1 |
| p20-marieke | Marieke, 44, gestrest, slaapt slecht, weinig energie | iPhone 13 · nl | 5 | 1 | 33 | D4: tuck jumps and broad jumps at GEMIDDELD after "Niet zo goed + Slechte nacht + Weinig energie"; D1 |
| p21-ilse | Ilse, 37, cyclus-tracking aan | iPhone 13 · nl | 6 | 0 | 22 | Cycle tracking gives no visible signal on Today; Jij in English |
| p22-tom | Tom, 28, heeft vaak geen tijd of is ziek — gebruikt "Lukt dit niet?" | iPhone 13 · nl | 6 | 0 | 23 | "Wat zit je vandaag in de weg?" is right; "Geen tijd" → 4-min session; "Gewoon rusten" → "Rest Day" + bonus prompt |
| p23-yara | Yara, 32, Pro, wil elke dag opnieuw plannen na check-in | iPhone 13 · nl | 7 | 0 | 23 | Header CHECK-IN reopens the sheet; "Geen tijd" → 2-exercise session; the why-panel grows, not shrinks |
| p24-bas | Bas, 39, wil voortgang en awards zien | iPhone 13 · nl | 7 | 0 | 60 | Full session (16 sets); Trophy room "3 of 37 earned", 31 hidden: the right pattern, in English |
| p25-femke | Femke, 47, traint bij een trainer die sessies toewijst | iPhone 13 · nl | 5 | 0 | 22 | Connect pending; Hergebruiken empty state points to Samenstellen |
| p26-luc | Luc, 22, militair én loper — twee coaches tegelijk? | iPhone 13 · nl | 5 | 2 | 27 | D3 (JE PAD shows AFVALLEN after choosing Militair); Hardlopen row explains the running-shoes prerequisite (good) |
| p27-esther | Esther, 50, privacy-bewust: export en verwijderen | iPhone 13 · nl | 5 | 0 | 27 | Privacy centre honest and complete, in English; delete two hops away |
| p28-mohammed | Mohammed, 41, vast — kiest "Rustig aan" | iPhone 13 · nl | 5 | 0 | 28 | D4: recovery mode stored, session unchanged; run-mode sheet "Als extra / In plaats van" clear |
| p29-nina | Nina, 35, recyclet haar eigen trainingen | iPhone 13 · nl | 6 | 0 | 38 | Build → save → reuse → pin all work |
| p30-erik | Erik, 58, iPhone SE, dikke duimen | iPhone SE · nl | 7 | 1 | 35 | D9 on every screen; D1 |

Persona data note: the goal card index in the runner picked "Afvallen" for most personas (the first
card), so the headline reads "AFVALLEN EN BETER VOELEN" more often than the personas intend; it does
not change any finding above.

## Appendix B — rerunning the UAT

```bash
npm run build --workspace=client-app
npx wrangler pages dev packages/client-app/dist --port 8788 --persist-to .wrangler/e2e-state \
  --binding JWT_SECRET=e2e-local-only-not-a-secret --binding RESEND_API_KEY=re_e2e_placeholder &
node scripts/uat/uat.mjs                 # all 30, ~35 min; or: node scripts/uat/uat.mjs p01-sanne p11-peter
node scripts/uat/aggregate.mjs           # table, failures, errors, audit → .uat-out/summary.json
python3 scripts/uat/sheet.py             # three contact sheets → .uat-out/sheet-*.png (needs Pillow)
```

The runner is deliberately not part of `npm run release`: it is a review instrument, not a gate.
After the D1–D5 fixes, the expected result is 0 app failures and a coach card on the coached
personas' Today (the runner's `coachCard` probe looks for "Bekijk je coach"; widen it if the card's
label changes).
