# Coaches and the DCP — what is set where, what the user is told, and the design to fix it

**Date:** 2026-11-01
**Scope:** the four coaching paths (General, Running, Cycling, Military) and the DCP (Defensie
Conditie Proef) in its two roles — a *target* the planner steers toward (R593 ordering, R594
bias) and a *baseline* the planner measures (R598 self-measurement, the DCP card) — and every
surface where either is set, computed or shown: the path-choice modal, Settings, the Coach view,
the Today card, Voortgang, WorkoutView and the planner trace.
**Method:** four personas driven on the local build of the deployed commit (88649a2), phone
width, Dutch UI: A general (no coach), B military keuring in target mode with a date 60 days
out and the DCP switched on by API, C running 10 km, D cycling (Pro trial). The DCP had to be
switched on *by API* because — the first finding — the product has no control for it. Every
claim is tied to a screenshot (contact sheet sent with this document), the source, or the
persona's stored plan read from the local database.

---

## 0. Verdict

The coaching model underneath is coherent: one primary intent, one coach at a time, standards
modelled as published norms, measurement written back by the session that performed it. What
reaches the user is not coherent. Three structural problems, then a long tail of smaller ones.

| # | Finding | Severity |
|---|---|---|
| 1 | **The DCP cannot be switched on.** No code path, client or server, ever writes `military_coach.dcp.enabled` or `birth_year`. Every DCP reader gates on `enabled`: the card, the "Stay DCP-ready" toggle, R593, R594, R598 and the measurement writer. The feature runs only for accounts whose preferences were edited by hand. | 🔴 dead feature |
| 2 | **"Zelfmeting gepland" is announced and not delivered.** With the DCP on and no baseline, the military persona's stored plan carries the trace "R598 — Zelfmeting ingepland", `assessment_planned: true`, and the DCP card's button reads "Zelfmeting gepland" (disabled). The session has **no** max-effort set: R598 only *marks* push-ups and sit-ups the selection already contains, and the military strength template contained neither. The user is told a measurement is planned, cannot do it, and cannot force it. | 🔴 contradiction |
| 3 | **The Coach view is unreachable for coach users without a trainer.** The Coach tab is in the nav only with a trainer; the only other route is the "Bekijk coaches" discovery card on Today, which hides itself once any coach is active. The military dashboard (ladder, keuring readiness, Cooper gap, insights), the running programme card and the cycling PMC therefore have no route for exactly the users they exist for. Settings → "Coaches" lands on a Settings sub-view instead, titled **ACCOUNT**. | 🔴 navigation |
| 4 | One goal, four vocabularies for measuring: "Herijken" (header — opens the daily check-in), "Nulmeting doen / Opnieuw meten" (DCP card on Voortgang — schedules R598), the same card on the Coach view (opens the old separate assessment screen instead), and "Meet mij / Opnieuw testen" (the fitness-assessment card, whose copy promises "a few short tests" but, when the DCP is a target, silently performs the DCP measurement). | 🟡 |
| 5 | Two dates for one soldier: the keuring `target_date` and the DCP `test_date`. The DCP card tells a target-mode keuring user with a date 60 days out "Geen datum ingepland — doorlopende norm". There is no UI for `test_date`. | 🟡 |
| 6 | Three mental models in the copy: the path-choice modal says "choose one path"; the Settings goal page says "Coaches are add-ons you can activate separately"; the coach sub-view says "JustFit can hold one at a time"; the Today pill shows "MILITAIR · K1" **and** "ADD-ON" for a user whose primary intent *is* military. | 🟡 |
| 7 | The level is a guess shown as a fact: "Keuring · K1" on Today and "MILITARY · K1" in Settings come from the self-declared `cluster_current` (default 0 or 1), while the copy says the Cooper test "determines your level" — a test the schedule runs once at the first session. | 🟡 |
| 8 | Three "where am I" pictures on Voortgang for one goal: the DCP bars, the 6-axis radar with a "MILITAIR DOEL" overlay and "Militaire fit 0 %", and the keuring readiness checklist on the Coach view. None refers to the others. | 🟡 |
| 9 | The coach surfaces are still English: the path-choice modal, the whole Settings coach sub-view ("ACTIVE COACH", "Keuring track · target mode · 60 days to assessment", "Change path →", "TRAINING FOCUS", "Physical Assessment · Target K3", "Log test →", "Save changes · K3"), and Voortgang's cards ("Room to grow toward your goal", "Fitness Profile — your current scores vs. military target vector", "WHERE YOU ARE", "Not measured yet"). The v1.6 sweep stopped at the Today card, WorkoutView and the Coach header. | 🟡 |
| 10 | The "Stay DCP-ready" bias toggle and the DCP block live inside the military coach's settings, but the design (`military.js`) says the DCP is "a standing standard, never a second target-date programme" that applies to serving personnel whether or not they prepare for a keuring. `dcpCardVisible` already allows DCP-without-coach (`bias_enabled`); the UI does not. | 🟢 |

---

## 1. The model as built

### 1.1 Coaches

| | General | Running | Cycling (Pro) | Military |
|---|---|---|---|---|
| Chosen in | path-choice modal (first load, English), or Settings coach sub-view → "Change path →" reopens the modal | same | same | same + track / mode / target cluster / date / pack weights |
| Stored as | `primary_intent` + `training_goal` | `run_coach { enrolled, target_km, week, session_in_week }` | `cycling_coach { active, sub_goal, week, unit, ftp_watts… }` | `military_coach { active, track, mode, cluster_current, cluster_target, target_date, block_*, pack_weights_available_kg, last_cooper_distance_m, dcp }` |
| Shown on Today | goal eyebrow only | "HARDLOOPCOACH · 10km-programma · Week 1", session "Hardloopdag · Week 1 · Intervallen", programme card with week bar and ↓ TCX | "FIETSCOACH · Conditie opbouwen · Week 1", programme card "Week 1 · FTP 220W · basisweek" | "MILITAIRE COACH · Keuring · K1", session "Militair · Kracht · Blok 1 · Basisopbouw", programme card "Fysieke keuring · K1 · Vandaag: Kracht · Blok 1 van 6" |
| Shown on Voortgang | radar hidden under 14 sessions; "Doelfit" | "Programmafit" ring | PMC moved to Coach view | radar always on, "MILITAIR DOEL" overlay, "Militaire fit 0 %", DCP card (only if enabled) |
| Coach view (unreachable without a trainer, finding 3) | discovery card only | programme timeline + insight | PMC chart, FTP banner, zones | readiness card (target mode), DCP card, ladder, Cooper benchmark, insights |
| Settings sub-view (titled ACCOUNT) | "GENERAL HEALTH · Adaptive daily training" | "RUNNING · 10KM · Week 1", re-enrol | "CYCLING · BUILD FITNESS · Week 1 · FTP 220W", sub-goal chips, Test FTP, cross-training toggle | "MILITARY · K1 · Keuring track · target mode · 60 days", mode, track, target cluster, date, pack weights, trail-shoes nudge, Cooper "Log test →", "Save changes · K3"; the DCP bias toggle only once `dcp.enabled` |

`COACH_PRIORITY` (pregnant → postnatal → military → running → cycling → general) resolves which
coach writes today's session; the server enforces running/cycling exclusion.

### 1.2 The DCP

- **Data:** `military_coach.dcp = { enabled, birth_year, bias_enabled, test_date?, last: { pushups, situps, at_ms } }`. No writer for `enabled`, `birth_year` or `test_date` exists; `last` is written by `recordDcpMeasurement` in `execution.js` from max-effort sets, and only when `enabled` is already true.
- **Norms:** `DCP_NORMS[sex][age band]` → push-ups, sit-ups, 12-minute run; tiers *minimum* → *safe* (+20 %, the same figure the bias defends) → *capacity*; retest after 42 days (`DCP_RETEST_DAYS`).
- **Visible when** `enabled && (military active || bias_enabled)` — one predicate (`dcpCardVisible`) shared by the card, R593, R598 and the Voortgang button, so those four cannot disagree. (They agree on *whether*; finding 2 is about *what happens then*.)
- **As a target:** R593 puts push-ups / sit-ups first; R594 raises the push and core targets to +20 % above the norm and stops once "safe" is reached (hysteresis, `dcpBiasStrength`).
- **As a baseline:** R598 declares a measurement due when there is no `last`, it is stale, or the user forced it; `_dcpMeasurementDue` then stores the push-up and sit-up ids on the context, and the step builder marks *those exercises if selected* as `max_effort` sets with a 2-minute window; WorkoutView runs them in max-effort mode; the execution writes `dcp.last` (only ever raising). The military template path selects its own exercises and so can skip both.
- **Told to the user:** the trace line in "Waarom dit plan?" ("R598 — Zelfmeting ingepland: nog geen nulmeting — max push-ups en sit-ups (2 min per oefening)"), the DCP card's amber note ("Doe de nulmeting zodat de planner weet waar je staat") and its button ("Nulmeting doen" → "Zelfmeting gepland" once `assessment_planned`), and on the Coach view the same card whose button opens the separate assessment screen instead.

### 1.3 Four baselines, one word for none of them

| Baseline | What it is | Set by | Feeds | Shown as |
|---|---|---|---|---|
| DCP `last` | max push-ups / sit-ups in 2 min | R598 sets in a session | R593, R594, the DCP card | "0 / 16", "Nog niet gemeten" |
| Cooper distance | 12-minute run distance | the Cooper session's post-workout modal, or Settings "Log test →" | keuring level (`cluster_current` drift), the readiness card | "Cooper: 2.350 m · K3", "No test recorded yet" |
| Fitness assessment | push / legs / core / conditioning battery | the assessment screen ("Meet mij") | progression axis baselines, the radar | "WHERE YOU ARE — Not measured yet" |
| `cluster_current` | self-declared keuring level | path choice / Settings | the whole military schedule | "Keuring · K1", "MILITARY · K1" |

A user meets all four within two taps of each other and nothing says how they relate.

---

## 2. What each surface tells the user (persona B, military + DCP)

| Surface | Says | Problem |
|---|---|---|
| Header, every screen | "HERIJKEN" | Opens the daily **check-in**. The word the specs use for the DCP recalibration names something else. |
| Today | "MILITAIRE COACH · Keuring · K1", pills "MILITAIR · K1" + "ADD-ON", session "Militair · Kracht · Blok 1", card "Fysieke keuring · K1 · Vandaag: Kracht · Blok 1 van 6 · BASISOPBOUW" | K1 is the default, not a measurement. "ADD-ON" contradicts the primary pill. No mention of the DCP, although the trace says the session was reordered and biased for it and that a measurement is planned. |
| Today → "Waarom dit plan?" | "R594 — DCP-bias actief (push 100 %, core 100 %) — doel +20 % boven de norm"; "R593 — DCP-beweging vooraan: push-ups eerst (push 0/19, sit-up 0/29)"; "R598 — Zelfmeting ingepland: nog geen nulmeting" | The only place the DCP is explained, in rule codes. "push 0/19" here vs "0 / 16" on the card: the trace quotes the *safe* tier, the card the *minimum*. Two numbers for one norm, unlabelled. The session itself has no push-ups and no measurement sets. |
| WorkoutView | "Militair · Kracht · Blok 1 · 7 oefeningen · ~17 min" | No measurement step; nothing explains that a measurement was due. |
| Voortgang | DCP card: "Geen datum ingepland — doorlopende norm · 36 jr · man · Push-ups 0/16 · Sit-ups 0/24 · 12 min hardlopen 2.750 m · Doe de nulmeting… · [Nulmeting doen]" then "WHERE YOU ARE — Not measured yet — [Meet mij]", then the radar with "MILITAIR DOEL", "Militaire fit 0 %", axis bars "0 ↓ 70" | Two measure buttons, same action, different copy; a date exists and is denied; the English assessment card; three pictures of one gap; "2.750 m" is the *capacity* tier while the minimum is 2.200 m — unlabelled again. |
| Settings → Coaches | A Settings sub-view titled "ACCOUNT": "ACTIVE COACH — MILITARY · K1 — Keuring track · target mode · 60 days to assessment — Change path →", then the full military form | Wrong title; English; the DCP block is absent (it only appears once `dcp.enabled`, which nothing sets); the "Stay DCP-ready" toggle, when visible, sits under "Training focus" beside the sport bias. |
| Coach view | unreachable | The screen that holds the readiness checklist, the Cooper gap and the DCP-as-goal card. |

---

## 3. The design — one goal, one standard, one measurement, one place

### 3.1 Principles

1. **One vocabulary.** *Doel* (what you train for), *Coach* (the programme that gets you there),
   *Norm* (a published standard: keuring, DCP), *Meting* (how the app learns where you stand:
   nulmeting, hermeting, Cooper-test), *Check-in* (how you feel today). "Herijken" disappears.
2. **One place to change each thing.** Goal and coach in one screen; norms in one block of
   that screen; measurements scheduled from one button that always does the same thing.
3. **A standard is explained where it is shown**, in one Dutch sentence, with the norm, the
   tier and the retest rule — never as rule codes.
4. **Progressive disclosure by tier.** Each tier adds exactly one card to Today and one block
   to Voortgang; nothing from a higher tier is visible before it is switched on.
5. **What is announced is delivered.** If the app says a measurement is planned, the session
   contains it; if it cannot (rest day, injury guard), the app says why and when.

### 3.2 Tiers

| Tier | Switched on by | Today gains | Voortgang gains | Settings shows |
|---|---|---|---|---|
| 0 Basis | nothing | the session card | streak, week, trajectory | Doel & coach (goal only, coaches collapsed) |
| 1 Coach | choosing a path | one coach card (session type, week/block, next milestone) → Coach view | the coach's progress block | the active coach's settings expanded |
| 2 Norm | enabling a standard (keuring date and/or DCP) | one line on the coach card: "DCP · 0/16 push-ups · meting gepland" | one "Waar sta ik" card per norm | the Normen block |
| 3 Trainer | connecting a gym | trainer card | — | Trainers |

### 3.3 Doel & coach — one screen replaces three

Replaces the path-choice modal as the only way to change path, the "Jouw doel" sub-view, and
the hidden coach sub-view. Reached from Settings → **Doel & coach** and from the coach card on
Today.

```
  ‹  DOEL & COACH
  JE PAD
  ┌ ◼ Militair · Keuring                         Wijzig pad ┐
  │ Blok 1 van 6 · Kracht vandaag · 60 dagen tot de keuring │
  └──────────────────────────────────────────────────────────┘
  MILITAIRE COACH                                    ▾ open
    Spoor    [Keuring] [Opleiding]
    Modus    [Datum]  [Niveau]  [Open]      Keuringsdatum  31-12-2026
    Niveau   huidig K1 (nog niet gemeten) · doel K3
    Bepakking [5] [10] [15] [20] …          Cooper-test: nog geen — [Inplannen]
  NORMEN                                                     ← tier 2
    Keuring K3     over 60 dagen        ●  aan
    DCP-norm       doorlopend           ○  aan  →  geboortejaar 1990 · man
                   "2 min push-ups, 2 min sit-ups, 12 min loop. Norm voor jou:
                    16 · 24 · 2.200 m. Je traint tot 20 % erboven, daarna stopt
                    de bias. Hermeting elke 6 weken."
  ANDERE COACHES                                   ▸ dicht
    Hardlopen · Fietsen (Pro) · Algemene gezondheid
```

- The **DCP toggle is the writer** of `dcp.enabled`, `birth_year` and `bias_enabled`; it lives
  under *Normen* and is available with or without the military coach (the predicate already
  allows that). Switching it on schedules the nulmeting into the next session and says so.
- *Niveau* shows "nog niet gemeten" until a Cooper or keuring measurement exists; the pill on
  Today follows the same rule ("Keuring · niveau?" until measured) — finding 7.
- The other coaches are collapsed under one row; opening one shows its settings and an
  "Activeren" action, with the "one at a time" rule stated once, in that row.

### 3.4 Today — one coach card, tappable

```
  ┌ ◼ MILITAIRE COACH · KEURING                               › ┐
  │ Blok 1 van 6 · vandaag kracht · keuring over 60 dagen        │
  │ DCP · 0/16 push-ups · 0/24 sit-ups · meting in deze sessie  │
  └──────────────────────────────────────────────────────────────┘
```

Tap → Coach view (the route finding 3 lacks). The "ADD-ON" pill goes; the primary pill stays.
When a measurement is due but cannot be delivered (rest day, guard), the third line says
"meting wacht op een veilige dag" rather than nothing.

### 3.5 Voortgang — "Waar sta ik", one card per norm

```
  WAAR STA IK
  ┌ KEURING K3 · over 60 dagen                                   ┐
  │ 12 min loop   2.350 m / 2.400 m   ▮▮▮▮▮▮▮▮▮▯   Cooper 12 okt  │
  │ Push-ups      — / 27              nog niet gemeten            │
  │ Pull-ups      — / 5               nog niet gemeten            │
  │ Mars 15 kg    — / 33:00           nog niet gemeten            │
  └───────────────────────────────────────────────────────────────┘
  ┌ DCP · doorlopende norm · man 36                              ┐
  │ Push-ups 2 min   0 / 16 (veilig 19)   ▯▯▯▯▯▯▯▯▯▯  nog niet gemeten │
  │ Sit-ups 2 min    0 / 24 (veilig 29)   ▯▯▯▯▯▯▯▯▯▯  nog niet gemeten │
  │ 12 min loop      gedekt door je keuringsdoel                  │
  │ [ Meting inplannen ]        Laatste meting: — · hermeting elke 6 wk │
  └───────────────────────────────────────────────────────────────┘
  TRAININGSBALANS  (the radar, general profile; military target as a toggle inside it)
```

- **Minimum and safe are both labelled** on the row ("0 / 16 (veilig 19)") so the trace's 19
  and the card's 16 are visibly the same norm — finding in §2.
- The keuring and DCP cards share the keuring date; the DCP card never claims "geen datum"
  while a keuring date exists.
- The fitness-assessment battery ("Where you are") becomes a third row group only for users
  without a norm, or is folded into the DCP measurement where push-ups and sit-ups overlap:
  one measurement, two readers (progression baseline + DCP `last`). One writer on the server.
- One button, one label, one action everywhere: **"Meting inplannen"** → R598 into today's
  session (never the old assessment screen). After scheduling: **"Meting staat in je sessie
  van vandaag"** with a link to the session. On the Coach view the same card, same button.

### 3.6 Delivery guarantee (planner)

R598 must *inject* the two measurement sets when due, not merely mark them: after selection,
if `ctx.dcpMeasure` is set and the session lacks the push-up or sit-up exercise, append it as a
max-effort set from `_safePool` (the pool is already computed); set `assessment_planned` only
when both sets are present. A matrix property covers it: for every persona with the DCP on and
no baseline, `assessment_planned ⇒ exactly two max_effort steps`, including the military
template path and a user-authored session with the offer accepted.

### 3.7 Words

| Today | Proposed |
|---|---|
| Herijken (header) | Check-in |
| Nulmeting doen / Opnieuw meten / Meet mij / Opnieuw testen | Meting inplannen (first time the card says "nulmeting", later "hermeting") |
| Zelfmeting gepland | Meting staat in je sessie van vandaag |
| Recalibrate assessment (spec), force_assessment (API) | keep the API name; the UI never says it |
| ADD-ON pill | removed; coaches that are *not* primary are listed in Doel & coach only |
| "Coaches are add-ons…" / "choose one path" / "hold one at a time" | one sentence, in Doel & coach: "Je traint met één coach tegelijk. Normen gelden los daarvan." |
| Physical Assessment / Educational Fitness | Keuring / Opleiding |
| Cooper: 2.350m · K3 | Cooper 2.350 m (K3-niveau) · 12 okt |

### 3.8 Language

Finish the Dutch sweep for the coach surfaces: the path-choice modal, the Settings coach
sub-view, Voortgang's assessment/radar cards and the Coach view body. Same rules as v1.6
(training-science terms stay English; guard: a smoke scan for the English literals photographed
here).

---

## 4. Ranked fix list

| # | Fix | Fixes | Severity | Effort |
|---|---|---|---|---|
| 1 | **Normen block** in Doel & coach writes `dcp.enabled`, `birth_year`, `bias_enabled` (with the one-sentence explanation); switching on schedules the nulmeting | 1, 10 | 🔴 | S |
| 2 | **R598 injects** the two sets when due; `assessment_planned` true only when present; matrix property | 2 | 🔴 | S |
| 3 | **Coach view reachable**: tap the coach card on Today; Settings → Doel & coach → "Bekijk voortgang"; fix the sub-view title | 3 | 🔴 | S |
| 4 | **One measurement button and label** ("Meting inplannen") on both DCP card mounts; the fitness-assessment card hands over to it when a norm is on; header "Herijken" → "Check-in" | 4 | 🟡 | S |
| 5 | **Doel & coach screen** replacing modal + goal sub-view + coach sub-view, coaches collapsed, one-at-a-time sentence once; "ADD-ON" pill removed | 6, 7 (level copy) | 🟡 | M |
| 6 | **Waar sta ik** on Voortgang: keuring card + DCP card with labelled tiers, shared date, radar demoted to general profile | 5, 8 | 🟡 | M |
| 7 | **Dutch sweep** of the coach surfaces with a smoke guard | 9 | 🟡 | M |
| 8 | Level shown as "niet gemeten" until a Cooper/keuring measurement exists | 7 | 🟢 | S |

Fixes 1–4 are a day each and remove the three critical findings; they can ship as one release
of the kind the builder plan used (one deploy, review, gate, docs). 5–7 reshape the surfaces and
are two days each.

---

## Appendix — evidence

- Personas and screens: `shots-coach/` in the session scratchpad; contact sheet
  `coach-dcp-contact-sheet.png` (sent). Persona B's stored plan (`day_plans.plan_json`) read
  from the local database: `session_name "Military · Strength · Block 1"`, 7 steps, 0
  `max_effort`, trace lines R594/R593/R598 present, `assessment_planned: true`.
- Code: `functions/api/_shared/military.js` (DCP norms, tiers, `dcpCardVisible`, `dcpIsStale`,
  `dcpBiasStrength`), `functions/api/plan.js` (`_dcpMeasurementDue` ~2467, R593 ~2705, R594
  ~2596, R598 ~2767, step marking ~3118), `functions/api/execution.js`
  (`recordDcpMeasurement` ~896), `packages/client-app/src/DcpCard.jsx`, `HistoryView.jsx`
  (~636 `dcpIsTarget`, ~911 card, ~1039 "Meet mij" switch), `CoachView.jsx` (~700–830
  military block, DcpCard mount `onMeasure={() => setView("assessment")}`),
  `SettingsView.jsx` (~817 landing rows, ~860 sub-view title map, ~963 coach sub-view, ~2155
  DCP bias toggle), `App.jsx` (~256 `handleForceAssessment`, ~1228 header button →
  `setShowCheckIn`), `Nav.jsx` (Coach tab only with a trainer), `Dashboard.jsx` (~1073
  discovery card hidden when a coach is active), `PathChoiceModal.jsx`.
- A grep across `packages/client-app/src` and `functions/api` for a writer of `dcp.enabled`
  or `dcp.birth_year` returns none; readers: 10 files.
