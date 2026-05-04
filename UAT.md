# JustFit — UAT Test Script

**Version:** 1.0 · May 2026
**Environment:** https://justfit.cc
**Tester:** _______________
**Date:** _______________
**Build:** _______________

---

## Before You Start

### Test accounts to create

Create fresh accounts for each major scenario. Do not reuse accounts across test areas — state from earlier tests will pollute results.

| Account alias | Email to use | Purpose |
|---|---|---|
| `T-FRESH` | your+fresh@email.com | New user, full onboarding |
| `T-GENERAL` | your+general@email.com | General health, completed sessions |
| `T-RUN` | your+run@email.com | Running coach |
| `T-CYCLE` | your+cycle@email.com | Cycling coach |
| `T-MIL` | your+mil@email.com | Military coach |
| `T-PREG` | your+preg@email.com | Pregnancy / postnatal |
| `T-GUEST` | — | Guest mode (no email) |

### Network requirement

Write operations (check-in, workout save, settings) **require an active network connection**. The offline layer caches the plan and exercises for reading but does not queue failed writes. Test these flows on a reliable connection. Flaky-network resilience is documented as a known production gap (see section 13).

### Devices to cover

- iPhone (Safari, iOS 16+)
- Android (Chrome)
- Desktop (Chrome or Firefox)

---

## Section 1 — Authentication

### AUTH-01 — Signup with email + password

**Account:** `T-FRESH`
**Precondition:** No existing account with this email.

| # | Step | Expected |
|---|---|---|
| 1 | Open https://justfit.cc/login.html | Auth page loads |
| 2 | Enter email + password (8+ chars), tick Terms + Privacy, click Sign up | Redirects to app, onboarding starts |
| 3 | Check inbox | Welcome email received |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-02 — Login with email + password

**Account:** `T-GENERAL` (already registered)

| # | Step | Expected |
|---|---|---|
| 1 | Open login.html, enter credentials, click Log in | Dashboard loads |
| 2 | Refresh page | Still logged in (token persists) |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-03 — Magic link login

| # | Step | Expected |
|---|---|---|
| 1 | On login.html, click "Email me a link" | Confirmation message shown |
| 2 | Open email, click magic link | Logged in to dashboard |
| 3 | Try the same link again | Shows expired/used error |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-04 — Forgot password → reset

| # | Step | Expected |
|---|---|---|
| 1 | Click "Forgot password?" on login.html | Email field shown |
| 2 | Enter email, submit | "Check your email" confirmation |
| 3 | Click reset link in email | reset-password.html loads |
| 4 | Enter new password, submit | Success message; login with new password works |
| 5 | Try the reset link again | Shows expired/used error |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-05 — Passkey / Face ID registration and login

**Device:** iPhone or Mac with Touch ID / Face ID
**Precondition:** `T-GENERAL` account, logged in.

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Account → "Add Face ID / Touch ID" | Device biometric prompt appears |
| 2 | Complete biometric | Success message shown |
| 3 | Log out |  |
| 4 | On login.html, click "Sign in with passkey" (if shown) or attempt biometric login | Authenticates without password |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-06 — Guest mode

| # | Step | Expected |
|---|---|---|
| 1 | login.html → "Continue without account →" | App opens, no email required |
| 2 | Complete onboarding | Dashboard loads |
| 3 | Verify amber banner: "Add your email to keep your data" | Banner visible on Today |
| 4 | Tap "Add" in banner → Settings | Settings → Account opens |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-07 — Sign out and back in

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Account → Sign out | Redirects to login.html |
| 2 | Log back in with same credentials | Dashboard loads, data intact |

Pass [ ] Fail [ ] Notes: _______________

---

### AUTH-08 — Rate limiting

| # | Step | Expected |
|---|---|---|
| 1 | On login.html, attempt login with wrong password 6 times rapidly | 429 or rate-limit error shown on the 6th attempt |
| 2 | Wait 60 seconds, try correct password | Login succeeds |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 2 — Onboarding

### ONBOARD-01 — Full first-time onboarding

**Account:** `T-FRESH` (just signed up)

| # | Step | Expected |
|---|---|---|
| 1 | App opens after signup | Onboarding modal appears (EU waiver step) |
| 2 | Accept waiver, proceed through all 6 steps (name / goal / fitness / equipment+time / sports) | Each step saves correctly |
| 3 | PathChoiceModal appears: General / Running / Cycling / Military | Visible after onboarding |
| 4 | Select "Running" | Running target selector shown; save |
| 5 | Dashboard loads | Check-in shown |

Pass [ ] Fail [ ] Notes: _______________

---

### ONBOARD-02 — Re-do onboarding

**Account:** `T-GENERAL`

| # | Step | Expected |
|---|---|---|
| 1 | Settings → You → "Re-do onboarding" | Onboarding modal opens, prefilled with existing values |
| 2 | Change goal, save | New goal reflected in dashboard and coach |

Pass [ ] Fail [ ] Notes: _______________

---

### ONBOARD-03 — Change path from Settings

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Your coach → "Change path →" | PathChoiceModal opens |
| 2 | Select a different path | Coach updated; new programme card on Coach tab |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 3 — Daily Check-In

### CHECKIN-01 — Standard check-in (all 3 steps)

| # | Step | Expected |
|---|---|---|
| 1 | Today screen → tap smiley or check-in prompt | Step 1: smiley row |
| 2 | Tap a smiley | Step 2: context chips |
| 3 | Tap "Low energy" chip | Chip selected (highlighted) |
| 4 | Tap Apply | Plan generates; R512 volume-reduced note visible in WhyPlanPanel |
| 5 | Step 3: confirm no conditional detail shown for Low energy | Correct (no follow-up for this chip) |

Pass [ ] Fail [ ] Notes: _______________

---

### CHECKIN-02 — Pain check-in → rest day

| # | Step | Expected |
|---|---|---|
| 1 | Open check-in, tap any smiley | Step 2 |
| 2 | Tap "Pain" chip | Step 3: pain scope (general / specific) |
| 3 | Select "General" | Apply |
| 4 | Plan generates | slot_type = rest; R514 in WhyPlanPanel |

Pass [ ] Fail [ ] Notes: _______________

---

### CHECKIN-03 — Skip check-in

| # | Step | Expected |
|---|---|---|
| 1 | On Today, tap "Skip" or "Generate without check-in" | Plan generates from preferences only |
| 2 | WhyPlanPanel | No adjustment rules; base plan shown |

Pass [ ] Fail [ ] Notes: _______________

---

### CHECKIN-04 — Recovery mode toggle

| # | Step | Expected |
|---|---|---|
| 1 | Check-in step 2, tap "Taking it easy" chip | Apply |
| 2 | Plan generates | R559 in rule trace; low intensity, mobility/recovery only |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 4 — Plan Generation and Adaptation

### PLAN-01 — "Why this plan?" panel

| # | Step | Expected |
|---|---|---|
| 1 | After any check-in that produces adaptations | Adaptation chip visible on session card |
| 2 | Tap "Why this plan?" | Panel expands, shows Safety / Training / Suggested categories |
| 3 | Panel closed state remembered on next view | Does not re-expand |

Pass [ ] Fail [ ] Notes: _______________

---

### PLAN-02 — Time-budget adaptation (R510 micro session)

| # | Step | Expected |
|---|---|---|
| 1 | Check-in → Step 2 → tap "No time" chip | Apply |
| 2 | Plan generates | slot_type = micro; R510 in trace; session ≤15 min |

Pass [ ] Fail [ ] Notes: _______________

---

### PLAN-03 — No equipment / travelling (R516)

| # | Step | Expected |
|---|---|---|
| 1 | Check-in → Step 2 → tap "Travelling" chip | Apply |
| 2 | Plan generates | R516 in trace; all exercises bodyweight only |

Pass [ ] Fail [ ] Notes: _______________

---

### PLAN-04 — Return to training after 14+ day gap (R558)

**Precondition:** Account with last session more than 14 days ago.

| # | Step | Expected |
|---|---|---|
| 1 | Check-in or skip | Plan generates |
| 2 | Rule trace | R558 present; coach sentence mentions easing back in |

Pass [ ] Fail [ ] Notes: _______________

---

### PLAN-05 — Blocking safety gate (R539 postnatal clearance)

**Account:** `T-PREG` in postnatal mode, clearance not confirmed.

| # | Step | Expected |
|---|---|---|
| 1 | Any check-in | Plan generates |
| 2 | BlockingSafetyBanner visible (role=alert) | "Exercise on hold — postnatal clearance needed" |
| 3 | Workout start button absent or disabled | Cannot start session until cleared |

Pass [ ] Fail [ ] Notes: _______________

---

### PLAN-06 — Regenerate plan

| # | Step | Expected |
|---|---|---|
| 1 | Today screen with an existing plan | Plan visible |
| 2 | Delete today's execution (if completed) via history trash icon | todayCompleted resets |
| 3 | Generate new plan | Plan regenerates cleanly, no 500 error |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 5 — Workout Execution

### WORKOUT-01 — Full rep-based session

| # | Step | Expected |
|---|---|---|
| 1 | Today → Start workout | WorkoutView opens full-screen |
| 2 | Read instruction card; swipe to next | MuscleMap thumbnail visible; swipe works |
| 3 | Tap "Ready — let's go →" | Working phase: large tap zone, rep counter |
| 4 | Tap zone 10 times | Counter increments; vibration on supported device |
| 5 | "All reps done" shortcut | Skips individual taps, advances to rest |
| 6 | Rest ring timer | 200px SVG ring animates countdown |
| 7 | Complete all sets → next exercise | No dead "exerciseComplete" screen; goes directly to instruction |
| 8 | Complete all exercises → Session feedback | Too easy / Just right / Too hard shown |
| 9 | Select rating | Dashboard reloads, streak/score updated |

Pass [ ] Fail [ ] Notes: _______________

---

### WORKOUT-02 — Time-based exercise

| # | Step | Expected |
|---|---|---|
| 1 | Find or generate a session with a timed exercise (e.g., plank) | |
| 2 | Working phase: Start button | Timer countdown at 84px |
| 3 | Tap "Done early" | Records actual seconds completed |
| 4 | Natural end (timer reaches 0) | Auto-advances to rest |

Pass [ ] Fail [ ] Notes: _______________

---

### WORKOUT-03 — Difficulty adjustment

| # | Step | Expected |
|---|---|---|
| 1 | In working phase, tap "+2" reps | Target updates; "Adjusted to N reps" toast 2s |
| 2 | Tap "−2" reps | Target decreases, min 1 |
| 3 | Complete set | Adjusted value persists across sets |

Pass [ ] Fail [ ] Notes: _______________

---

### WORKOUT-04 — Exercise substitution

| # | Step | Expected |
|---|---|---|
| 1 | In instruction phase, tap "Show alternatives" | Bottom sheet slides up with alternatives list |
| 2 | Select an alternative | Exercise replaced; instruction phase restarts for substitute |
| 3 | Complete substitute exercise | stepsActual records exercise_substituted=true |

Pass [ ] Fail [ ] Notes: _______________

---

### WORKOUT-05 — Rest day session

**Precondition:** Pain check-in (R514) or rest-day plan.

| # | Step | Expected |
|---|---|---|
| 1 | Start workout on a rest plan | "restDay" phase shown: rest day message |
| 2 | Complete rest day | Execution saved, counted in history |

Pass [ ] Fail [ ] Notes: _______________

---

### WORKOUT-06 — Bonus session

| # | Step | Expected |
|---|---|---|
| 1 | After completing today's workout | "Do another?" or bonus prompt visible |
| 2 | Start bonus session | Bonus plan generates (≤15 min micro, moderate cap) |
| 3 | Complete | Saved as session_type=bonus; visible in history |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 6 — Progress Tab

### PROGRESS-01 — Trajectory chart and streak

| # | Step | Expected |
|---|---|---|
| 1 | Complete sessions across multiple weeks | |
| 2 | Open Progress tab | Trajectory bar chart shows up to 12 ISO weeks |
| 3 | Current week bar accent-coloured | Median reference line visible |
| 4 | STREAK · N DAYS display | Correct day count |
| 5 | trajectorySentence below streak | Contextual sentence (e.g., "Steady. Keep showing up.") |

Pass [ ] Fail [ ] Notes: _______________

---

### PROGRESS-02 — Radar chart (≥14 sessions)

**Precondition:** Account with ≥14 completed sessions.

| # | Step | Expected |
|---|---|---|
| 1 | Progress tab | Radar chart visible with 6 axes |
| 2 | Toggle "Goal off" → "Goal on" | Goal target overlay appears as dashed polygon |
| 3 | Chart mode tabs (Power / Endurance / Balanced / Mobility) | Tabs switch displayed scores |

Pass [ ] Fail [ ] Notes: _______________

---

### PROGRESS-03 — Recent sessions

| # | Step | Expected |
|---|---|---|
| 1 | Progress tab, scroll to RECENT SESSIONS | Last 5 completed sessions listed |
| 2 | Each session | Date, duration (min), exercises with sets×reps |
| 3 | Session with no exercise steps recorded | "No exercises recorded" italic text |

Pass [ ] Fail [ ] Notes: _______________

---

### PROGRESS-04 — Awards entry points

| # | Step | Expected |
|---|---|---|
| 1 | Progress tab → "Trophy room →" | Awards view opens |
| 2 | Settings → Trophy room | Same awards view opens |
| 3 | In awards: earned section shows unlocked awards | Correct based on session count + score |
| 4 | "Next up" shows 3 closest awards with delta | Delta counts are accurate |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 7 — Coach Tab (per coach type)

### COACH-01 — General health mode

**Account:** `T-GENERAL` (no specialist coach)

| # | Step | Expected |
|---|---|---|
| 1 | Coach tab | Header: "GENERAL HEALTH"; Training Goal card visible |
| 2 | Gear pill (top-right) → Settings | Settings opens |
| 3 | Primary intent radio | "General health" selected; others shown as unavailable |
| 4 | "Weekly plan →" link | Plan tab opens |

Pass [ ] Fail [ ] Notes: _______________

---

### COACH-02 — Running coach

**Account:** `T-RUN` (running coach enrolled)

| # | Step | Expected |
|---|---|---|
| 1 | Coach tab | Header: "RUNNING · Xkm"; programme card shows Week N of Y · progress bar |
| 2 | Session breakdown visible | Session 1/2/3 of week shown |
| 3 | Timeline bar chart | Weeks to goal plotted |
| 4 | Insight text | Running coach sentence below chart |

Pass [ ] Fail [ ] Notes: _______________

---

### COACH-03 — Cycling coach

**Account:** `T-CYCLE` (cycling coach enrolled)

| # | Step | Expected |
|---|---|---|
| 1 | Coach tab | Header: "CYCLING · WEEK N"; PMC CTL/ATL SVG chart |
| 2 | CTL / ATL / TSB pills | Values shown; TSB colour coded |
| 3 | TSB insight message | One of 4 range messages shown |
| 4 | FTP stale banner (if FTP not tested or >6 weeks old) | Amber banner with "Go to FTP test" + "Remind me" |
| 5 | FTP sparkline (if ≥2 FTP tests recorded) | Sparkline visible |

Pass [ ] Fail [ ] Notes: _______________

---

### COACH-04 — Military coach

**Account:** `T-MIL` (military coach enrolled)

| # | Step | Expected |
|---|---|---|
| 1 | Coach tab | Header: "MILITARY · K2" (or current level); level ladder pip chart |
| 2 | Level ladder | Current level pip highlighted; track + days-to-assessment |
| 3 | Coach insights card | Cooper test gap, march weight, weakest axis, tips |
| 4 | Open mode (no target date) | "Continuous progression" subtitle; no goal date shown |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 8 — Settings

### SETTINGS-01 — Profile (You sub-view)

| # | Step | Expected |
|---|---|---|
| 1 | Settings → You | Body, equipment, schedule, appearance sections |
| 2 | Change display name, save | Name updated in dashboard greeting |
| 3 | Change accent colour | UI accent immediately updates across all tabs |
| 4 | Change weight unit (kg ↔ lbs) | Weight field converts value and saves |
| 5 | Change session duration | Reflected in next plan generation |

Pass [ ] Fail [ ] Notes: _______________

---

### SETTINGS-02 — Conflict resolution (multiple coaches)

**Precondition:** Two or more coaches enrolled.

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Your coach | Conflict modal auto-fires (primary intent unset) |
| 2 | Select primary intent | Saved; Coach tab conflict card shows updated text |
| 3 | Coach tab → Primary Intent radio | Correct option selected |

Pass [ ] Fail [ ] Notes: _______________

---

### SETTINGS-03 — Running coach enrollment and unenrollment

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Your coach → Running Coach card | Target distance picker visible |
| 2 | Select 10km, Save / Enrol | Confirmation; running programme card on Coach tab |
| 3 | Return to Settings → Your coach | Distance picker still visible with Save button |
| 4 | Unenrol (if available) | Running coach deactivated |

Pass [ ] Fail [ ] Notes: _______________

---

### SETTINGS-04 — FTP test (Cycling coach)

**Account:** `T-CYCLE`

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Your coach → Cycling | FTP test modal accessible |
| 2 | Select test type (20 min), enter result | FTP saved; ftp_tested_at updated |
| 3 | Coach tab | FTP stale banner gone (suppressed for 6 weeks) |
| 4 | FTP sparkline | Shows new data point if ≥2 tests |

Pass [ ] Fail [ ] Notes: _______________

---

### SETTINGS-05 — Data export

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Privacy → "Download my data (JSON)" | JSON file downloads to device |
| 2 | Open file | Contains profile, progression, history as readable JSON |

Pass [ ] Fail [ ] Notes: _______________

---

### SETTINGS-06 — Delete account

**Precondition:** Separate test account, not T-GENERAL.

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Account → scroll to Delete | Delete button visible |
| 2 | Click Delete | Confirmation step: warns about permanent deletion |
| 3 | Type "DELETE" | Confirm button enabled |
| 4 | Confirm | Account deleted; redirected to login.html |
| 5 | Try to log in with same credentials | Login fails (account gone) |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 9 — Women's Health

### WOMENS-01 — Cycle tracking

**Account:** Female, standard mode.

| # | Step | Expected |
|---|---|---|
| 1 | Settings → You → Body mode → Enable cycle tracking | Last period date entry shown |
| 2 | Enter period date | Saved |
| 3 | Generate plan near period day | R520 in rule trace (period day intensity ease) |

Pass [ ] Fail [ ] Notes: _______________

---

### WOMENS-02 — Pregnancy mode

| # | Step | Expected |
|---|---|---|
| 1 | Settings → You → Body mode → "Enable pregnancy mode →" | Inline setup: medical clearance + due date |
| 2 | Confirm clearance, enter due date | Pregnancy mode active |
| 3 | Generate plan | R530/R531/R532/R533 in trace (trimester-appropriate) |
| 4 | Workout instruction cards | pregnancy_note shown as amber first card |
| 5 | Deactivate → confirm | Mode resets to standard |

Pass [ ] Fail [ ] Notes: _______________

---

### WOMENS-03 — Perimenopause mode

| # | Step | Expected |
|---|---|---|
| 1 | Settings → You → Body mode → Perimenopause toggle | Mode enabled |
| 2 | Generate plan | R526 in trace; intensity capped at moderate |
| 3 | High stress check-in (≥5) | R513 (mobility) fires at lower threshold than standard |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 10 — Strava Integration

### STRAVA-01 — Connect Strava

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Your coach → Strava card → "Connect Strava" | Redirect to Strava OAuth |
| 2 | Authorise on Strava.com | Redirected back to app with ?code= |
| 3 | App processes callback | "Strava connected · {athlete name} ✓" toast |
| 4 | Settings → Strava | Shows connected athlete name, Sync button |

Pass [ ] Fail [ ] Notes: _______________

---

### STRAVA-02 — Sync activities

**Precondition:** Strava connected, activities exist on Strava account.

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Strava → Sync | Import summary shown |
| 2 | History | Strava activities appear with STRAVA badge |
| 3 | PMC chart (cycling) | TSS from Strava rides reflected in CTL/ATL |
| 4 | Sync again (duplicate check) | No duplicate entries |

Pass [ ] Fail [ ] Notes: _______________

---

### STRAVA-03 — Disconnect Strava

| # | Step | Expected |
|---|---|---|
| 1 | Settings → Strava → Disconnect | Confirmation shown |
| 2 | Confirm | Connection removed; Strava card shows "Connect" again |
| 3 | Strava activities | Remain in history (not deleted) |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 11 — PWA and Device

### PWA-01 — Install on iOS Safari

| # | Step | Expected |
|---|---|---|
| 1 | Open https://justfit.cc in Safari on iPhone | |
| 2 | Share → Add to Home Screen | Icon appears on home screen |
| 3 | Launch from home screen | Opens as standalone app (no browser chrome) |
| 4 | Complete a workout | Wake Lock keeps screen on (or amber warning if denied) |

Pass [ ] Fail [ ] Notes: _______________

---

### PWA-02 — Install on Android Chrome

| # | Step | Expected |
|---|---|---|
| 1 | Open https://justfit.cc in Chrome on Android | Install prompt or menu option available |
| 2 | Install to home screen | |
| 3 | Launch from home screen | Standalone, no URL bar |

Pass [ ] Fail [ ] Notes: _______________

---

### PWA-03 — Cached plan offline

| # | Step | Expected |
|---|---|---|
| 1 | Load app with network (plan generates) | |
| 2 | Turn off network (airplane mode) | |
| 3 | Reload app | Cached plan loads from IndexedDB |
| 4 | Attempt check-in or save workout | Error shown gracefully; no silent data loss |

Pass [ ] Fail [ ] Notes: _______________

---

### PWA-04 — Cross-device session sync

| # | Step | Expected |
|---|---|---|
| 1 | Complete a workout on Device A | |
| 2 | Open app on Device B with same account | Dashboard shows today as completed (cross-device state) |

Pass [ ] Fail [ ] Notes: _______________

---

## Section 12 — Regression Checks

Run these quickly after any deploy to catch regressions in core flows.

| ID | Check | Expected |
|---|---|---|
| R-01 | /api/ping | `{"ok":true,"db":true}` |
| R-02 | Login with known account | Dashboard loads <3s |
| R-03 | Skip check-in → plan generates | No 500; plan JSON valid |
| R-04 | Start and rate a workout | Execution saved; score updates |
| R-05 | Progress tab opens | No blank screen; trajectory chart renders |
| R-06 | Coach tab opens | No blank screen; coach label correct |
| R-07 | Settings → Your coach → opens | No blank screen |
| R-08 | Settings → Trophy room | Awards view opens |
| R-09 | Military coach — generate plan | session_name includes "Block N" |
| R-10 | Cycling coach — generate plan | step with intervals_json present; TCX button shows |

---

## Section 13 — Known Gaps (Do Not Fail On These)

These are documented limitations, not test failures.

| Gap | Status | Risk |
|---|---|---|
| Offline writes (check-in, workout save) not queued | By design — fails gracefully with error message | Low for beta |
| Auth token in localStorage (not HttpOnly cookie) | Known security trade-off for Pages Functions hosting | Low for beta; plan for post-beta |
| Strava BYO credentials stored as plaintext prefs in D1 | User-owned credentials; noted risk | Low for beta |
| No Playwright/E2E test suite | Manual UAT substitutes for now | Medium |
| No load test | Only 5 real users; D1 at 2 MB | Low until launch |

---

## Summary Sign-Off

| Section | Pass | Fail | Skipped | Tester |
|---|---|---|---|---|
| 1 — Auth (8 tests) | | | | |
| 2 — Onboarding (3 tests) | | | | |
| 3 — Check-in (4 tests) | | | | |
| 4 — Plan adaptation (6 tests) | | | | |
| 5 — Workout (6 tests) | | | | |
| 6 — Progress tab (4 tests) | | | | |
| 7 — Coach tab (4 tests) | | | | |
| 8 — Settings (6 tests) | | | | |
| 9 — Women's health (3 tests) | | | | |
| 10 — Strava (3 tests) | | | | |
| 11 — PWA + device (4 tests) | | | | |
| 12 — Regression (10 checks) | | | | |
| **Total** | | | | |

**UAT outcome:** Pass [ ] Conditional pass [ ] Fail [ ]

**Sign-off:** _______________ **Date:** _______________

**Open defects before Production go-live:**

1.
2.
3.
