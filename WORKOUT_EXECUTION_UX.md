# Workout Execution UX — Coaching Interface
# ✅ FULLY IMPLEMENTED (all 10 steps complete, as of 2026-03-22)

## Philosophy

During a workout, the app is a coach standing next to you.
It tells you what to do, shows you how, counts with you,
and gives you space to breathe between efforts.

The screen is used with sweaty hands, glanced at between reps,
and sometimes propped up across the room. Every interaction
must work with one thumb, in 2 seconds, at a glance.

---

## 1. Workout execution screen — complete redesign ✅

### Phase state machine

`WorkoutView` is a full-screen overlay (`position: fixed, inset: 0, zIndex: 50`) driven by a single `phase` variable:

```
"instruction" → "working" → "resting" → (repeat per set) → "exerciseComplete" → (next exercise) → "sessionFeedback"
```

Special phases:
- `"restDay"` — shown when `plan.slot_type === 'rest'` or no exercises
- `"exerciseComplete"` — 2-second auto-advance between exercises

### WorkoutView props

```javascript
function WorkoutView({ plan, onComplete, onBack, cycle })
```

- `plan` — day_plan object with `steps[]`, `slot_type`, `session_name`, `id`
- `onComplete(durationSec, perceivedExertion, stepsActual)` — called when session finishes
- `onBack()` — cancels workout, returns to Today screen
- `cycle` — cycle_profile object; `cycle.mode` drives pregnancy/postnatal adaptations

### Screen layout (single exercise, full screen)

```
┌─────────────────────────────────────────────────────┐
│  ← Cancel          Push-up          Set 2 of 3      │  ← header
├─────────────────────────────────────────────────────┤
│  [amber wake lock banner, only if API unavailable]  │
├─────────────────────────────────────────────────────┤
│  [thin progress bar — full session progress]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [phase-specific content — see below]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Instruction card — swipeable steps ✅

### Implementation

Cards are built from `instructions_json` (parsed JSON from exercise record):

```javascript
const instr = cur.instructions_json ? JSON.parse(cur.instructions_json) : null;
const rawSteps = instr?.steps ?? [];   // array of step strings
const cues    = instr?.cues ?? [];     // always visible below cards
```

Card objects have shape `{ text: string, accent: null | "amber" | "rose" }`:
- Standard steps → `{ text: step, accent: null }`
- `pregnancy_note` (pregnant mode) → `{ text: note, accent: "amber" }` — prepended as **first** card
- `postnatal_note` (postnatal mode) → `{ text: note, accent: "rose" }` — prepended as **first** card
- Pelvic floor coaching (postnatal + `pelvic_floor` tag) → rose card **appended** at end:
  `"Remember: the release is just as important as the squeeze. Full relaxation between each rep."`
- Fallback when no steps: `{ text: "Focus on form. Quality over speed. You've got this.", accent: null }`

### Card styling by accent

| accent | background | border | text colour |
|---|---|---|---|
| `null` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.1)` | `#f8fafc` |
| `"amber"` | `rgba(245,158,11,0.08)` | `rgba(245,158,11,0.3)` | `#f59e0b` |
| `"rose"` | `rgba(244,63,94,0.08)` | `rgba(244,63,94,0.3)` | `#f43f5e` |

Step label shows "Important note" for accent cards, "Step N of M" for standard steps.

### Swipe gesture

- `onTouchStart/Move/End` + `onMouseDown/Move/Up/Leave` on wrapper div
- During drag: `dragOffset = delta × 0.55` (dampened), CSS `transition: none`
- On release: snap to next/prev if `|delta| > 60px`; CSS spring: `transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)`
- Prev/Next buttons below cards (supplemental)
- Step dots update accent colour to match current card

### Auto-advance

5-second auto-advance from instruction → working phase if user doesn't interact.
`instrStep` resets to 0 whenever `exIdx` changes (next exercise).

### Cues

`cues[]` displayed below cards at all times, muted italic, 13px, prefixed with 💡.

### "Ready — let's go →" CTA

Full-width emerald button at bottom of instruction phase, advances to working phase immediately.

---

## 3. Rep confirmation system ✅

### Rep-based exercises

Large tap zone — minimum 280px tall, full width minus padding.

Visual states:
```javascript
idle:     { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  label: 'TAP TO COUNT REP' }
pressed:  { bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.55)', label: 'COUNTED!' }
complete: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  label: 'SET COMPLETE' }
```

On tap:
- `navigator.vibrate(30)` haptic
- `tapFlash` state → CSS `@keyframes tapScale` (scale 1→0.96→1, 150ms) + ring pulse (`@keyframes tapRing`)
- Rep count increments
- At `repCount >= targetReps`: auto-calls `handleSetDone(next)` after 220ms debounce

Rep dots:
- Max 10 dots shown (`Math.min(10, targetReps)`)
- If targetReps > 10 and repCount > 10: shows "+N" overflow label
- 12px diameter, 8px gap, centered

64px font-weight 900 counter: `{repCount} / {targetReps}`

### Time-based exercises

84px countdown timer, progress bar (fills left to right).
Colours: emerald → amber at 10s → red at 5s (+ pulse animation).
- **[▶ Start]** button — 120px circle, starts timer, records `timerTotalRef.current = totalDur`
- **[■ Done early]** — calls `handleSetDone(totalDur - timerRemaining)` to record actual seconds
- Natural completion: effect fires at `timerRemaining === 0`, calls `handleSetDone(timerTotalRef.current)`

---

## 4. Rest countdown screen ✅

### Triggered after: last rep of a set (not the last set)

Full content area replacement:

```
Set 2 of 3 complete ✓

[breathing reminder — pregnancy/postnatal only, 3s, amber]

            REST

           0:45

   [−15s]  [Skip rest]  [+15s]

    Next set: 10 × Push-up
    ████████████████████░░░░░░░░
```

### Rest duration defaults (`getRestDuration` in WorkoutView)

```javascript
function getRestDuration(ex) {
  const tags = JSON.parse(ex?.tags_json || "[]");
  if (plan?.slot_type === "micro") return 20;
  if (tags.includes("pelvic_floor")) return 30;
  if (tags.includes("mobility")) return 20;
  if (tags.includes("cardio")) return 30;
  if (tags.includes("bodyweight")) return 45;
  const base = ex?.rest_sec ?? 60;   // rest_sec comes from plan step (from plan.js getDefaultRest)
  return isPregnancyMode ? base + 15 : base;  // +15s for pregnant/postnatal
}
```

`getDefaultRest(exercise, slotType)` in `functions/api/plan.js` applies the same logic server-side
and stores `rest_sec` on each plan step.

### Rest controls

- `[−15s]` — `Math.max(10, restRemaining - 15)` and same on `restTotal`
- `[+15s]` — `Math.min(180, restRemaining + 15)` and same on `restTotal`
- `[Skip rest]` — records actual rest in `stepsActualRef`, sets phase to "working"

### Rest UI details

- 84px font-weight 900 countdown, `fontVariantNumeric: "tabular-nums"`
- Colour: emerald → amber at 10s → red at 5s + `@keyframes pulse`
- Haptic `navigator.vibrate(60)` at exactly 10s and 5s remaining
- "Next set: N × ExerciseName" (same exercise) or "Next: ExerciseName" (next exercise)
- Progress bar fills as elapsed time grows
- At 0: records actual rest, increments set, returns to working phase

### Timing implementation

Rest uses `setTimeout` (not `setInterval`) to avoid stale closure issues:
```javascript
useEffect(() => {
  if (phase !== "resting" || restRemaining <= 0) return;
  const id = setTimeout(() => setRestRemaining(r => Math.max(0, r - 1)), 1000);
  return () => clearTimeout(id);
}, [phase, restRemaining]);
```
Separate effect watches `restRemaining === 0` to advance phase.

---

## 5. Difficulty override ✅

### Inline on working phase screen

```
[  −  ]  [  10 reps  ]  [  +  ]
         "Adjusted to 8 reps"  ← toast (fades after 2s)
```

- Rep-based: `−2` / `+2` reps; bounds: min 1, max 30
- Time-based: `−10s` / `+10s`; bounds: min 10s, max 300s
- Stored in `adjustedReps` / `adjustedDuration` state
- Override applies to all remaining sets (state persists until `exIdx` changes)
- Label stored in `adjustLabel` state, cleared by `adjustLabelTimerRef` after 2s

For pregnancy/postnatal: difficulty override is always visible (the row never hides).

---

## 6. Exercise substitution (alternatives) ✅

### Bottom sheet

Slide-up sheet with dark scrim, drag handle at top, smooth slide animation.
Alternatives fetched by slug from `alternatives_json.substitutions[]` via `api.getExercisesBySlugs()`.

```
Alternatives for Push-up

● Incline Push-up      Easier — hands elevated
  [Try this instead]

● Knee Push-up         Easier — on your knees
  [Try this instead]

[Keep original]
```

### `api.getExercisesBySlugs(slugs)`

Fetches `GET /api/exercises`, filters client-side. No slug-based server endpoint exists.

### On "Try this instead" (`handleChooseAlternative`)

1. Builds `replacement` step preserving `sets`, `target_reps`, `target_duration_sec`, `rest_sec`
2. Stores in `exerciseOverrides[exIdx]` — `cur = exerciseOverrides[exIdx] ?? exercises[exIdx]`
3. Resets `stepsActualRef.current[exIdx]` with `exercise_substituted: true`, `original_exercise_id`, `substitute_exercise_id`
4. Resets `currentSet`, `repCount`, `adjustedReps`, `adjustedDuration`, `instrStep` to 0
5. Returns to `"instruction"` phase to show the alternative's instruction cards

### Button label

- Standard mode: "Show alternatives"
- Pregnancy/postnatal mode: "This doesn't feel right" (softer language)

---

## 7. Difficulty feedback (perceived exertion) ✅

### Session feedback screen (`phase === "sessionFeedback"`)

Shown after the last set of the last exercise:

```
Session done!
How did that feel?

[😰 Too hard]  [😌 Just right]  [💪 Too easy]

Skip rating
```

Mapping:
- 😰 Too hard → `perceived_exertion = 8`
- 😌 Just right → `perceived_exertion = 5`
- 💪 Too easy → `perceived_exertion = 3`
- Skip rating → `perceived_exertion = null`

### Data chain

```
handleFinishSession(perceivedExertion)
  → durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000)
  → onComplete(durationSec, perceivedExertion, stepsActualRef.current)
    → api.saveExecution(userId, planId, date, mergedSteps, durationSec, perceivedExertion)
      → POST /api/execution { perceived_exertion: N | null, ... }
        → stored in executions.perceived_exertion (INT)
```

`perceived_exertion` feeds the consistency score resilience bonus (low PE sessions = resilience).

---

## 8. Wake Lock API ✅

### Implementation

```javascript
const wakeLockRef = useRef(null);
const [wakeLockDenied, setWakeLockDenied] = useState(false);

useEffect(() => {
  const activePhases = ["instruction", "working", "resting", "exerciseComplete"];
  if (!activePhases.includes(phase)) {
    // Release when done/feedback/restDay
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    return;
  }
  if (!("wakeLock" in navigator)) { setWakeLockDenied(true); return; }
  if (wakeLockRef.current) return; // already held

  const acquire = () => {
    if (wakeLockRef.current) return;
    navigator.wakeLock.request("screen").then(lock => {
      wakeLockRef.current = lock;
      lock.addEventListener("release", () => { wakeLockRef.current = null; });
    }).catch(() => setWakeLockDenied(true));
  };
  acquire();

  // Re-acquire when user tabs back (browser releases on visibility change)
  const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  };
}, [phase]);
```

### Fallback banner

When `wakeLockDenied === true` and phase is active:

```
Keep your screen on to avoid interruptions during your workout.
```

Amber banner (`rgba(245,158,11,0.12)` bg, `rgba(245,158,11,0.25)` border), 12px text.
Shown below the session header, above the progress bar.

---

## 9. Pregnancy & postnatal adaptations ✅

### Computed flag

```javascript
const bodyMode = cycle?.mode ?? "standard";
const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
```

### Pregnancy mode adaptations

| Feature | Implementation |
|---|---|
| Rest +15s | `getRestDuration` adds `isPregnancyMode ? base + 15 : base` |
| Breathing reminder | `showBreathingReminder` state, shown in resting phase for 3s then auto-dismissed, with amber styling |
| `pregnancy_note` as first card | Parsed from `instr?.pregnancy_note`, prepended with `accent: "amber"` |
| Softer alternatives language | "This doesn't feel right" instead of "Show alternatives" |

### Postnatal mode adaptations

Same as pregnancy, plus:

| Feature | Implementation |
|---|---|
| `postnatal_note` as first card | `instr?.postnatal_note`, prepended with `accent: "rose"` |
| Pelvic floor coaching card | If `tags.includes("pelvic_floor")`, rose card appended: "Remember: the release is just as important as the squeeze. Full relaxation between each rep." |

### Breathing reminder detail

```javascript
// In handleSetDone, when entering rest phase:
if (isPregnancyMode) {
  setShowBreathingReminder(true);
  clearTimeout(breathingTimerRef.current);
  breathingTimerRef.current = setTimeout(() => setShowBreathingReminder(false), 3000);
}
```

Message: `"Take a breath — inhale through nose, sigh out through mouth."`
Has a dismiss `×` button (dismisses and clears the timer).

---

## 10. Data stored per execution step ✅

### `stepsActualRef` — tracking ref (not state, avoids re-renders)

Initialised from `plan.steps` at mount:

```javascript
const stepsActualRef = useRef(
  exercises.map(ex => ({
    exercise_id: ex.exercise_id,
    prescribed: { sets: ex.sets, reps: ex.target_reps, duration_sec: ex.target_duration_sec, rest_sec: ex.rest_sec },
    actual: {
      sets_completed: 0,
      reps_per_set: [],           // actual reps per set (or seconds for time-based)
      rest_taken_seconds: [],     // actual rest elapsed between sets (wall-clock ms / 1000)
      target_adjusted: false,
      target_original: null,      // prescribed reps or duration_sec
      target_final: null,         // after user adjustments
      adjustment_direction: null, // "up" | "down"
      exercise_substituted: false,
      original_exercise_id: null,
      substitute_exercise_id: null,
      skipped: false,
      completed_at_ms: null,
    },
  }))
);
```

### Write points

| Event | Written to |
|---|---|
| Rep tapped / set done | `reps_per_set.push(reps)`, `sets_completed += 1` |
| Set done with adjustment | `target_adjusted`, `target_original`, `target_final`, `adjustment_direction` set if changed |
| Last set done | `completed_at_ms = Date.now()` |
| Rest starts | `restStartedAtRef.current = Date.now()` |
| Rest ends naturally | `rest_taken_seconds.push(Math.round((Date.now() - restStartedAtRef.current) / 1000))` |
| Skip rest | Same rest calculation before advancing |
| Skip exercise | `skipped = true`, `completed_at_ms = Date.now()` |
| Alternative chosen | Full `actual` object replaced with `exercise_substituted: true`, `original_exercise_id`, `substitute_exercise_id` |
| Timer starts | `timerTotalRef.current = totalDur` |
| Timer ends naturally | `handleSetDone(timerTotalRef.current)` — records full duration in `reps_per_set` |
| Done early (timer) | `handleSetDone(totalDur - timerRemaining)` — records actual seconds |

### What `execution_steps.actual_json` contains

```javascript
{
  execution_id: uuid,
  step_index: 0,
  step_type: "exercise",
  exercise_id: uuid,

  prescribed_json: {
    sets: 3,
    reps: 10,           // or duration_sec
    rest_sec: 60,
  },

  actual_json: {
    sets_completed: 3,
    reps_per_set: [10, 9, 8],         // actual reps or seconds per set
    rest_taken_seconds: [63, 41],      // wall-clock rest per rest period
    target_adjusted: true,
    target_original: 10,
    target_final: 8,
    adjustment_direction: "down",
    exercise_substituted: false,
    original_exercise_id: null,
    substitute_exercise_id: null,
    skipped: false,
    completed_at_ms: 1767830400000,
  }
}
```

---

## 11. State in WorkoutView

All state is local to `WorkoutView`. No global state store used.

### useState

```javascript
const [exIdx, setExIdx] = useState(0);
const [currentSet, setCurrentSet] = useState(1);
const [repCount, setRepCount] = useState(0);
const [phase, setPhase] = useState(
  !plan || plan.slot_type === "rest" ? "restDay"
  : totalExercises > 0 ? "instruction"
  : "sessionFeedback"
);
const [restRemaining, setRestRemaining] = useState(60);
const [restTotal, setRestTotal] = useState(60);
const [timerRunning, setTimerRunning] = useState(false);
const [timerRemaining, setTimerRemaining] = useState(0);
const [adjustedReps, setAdjustedReps] = useState(null);     // null = use plan value
const [adjustedDuration, setAdjustedDuration] = useState(null);
const [showCancel, setShowCancel] = useState(false);
const [tapFlash, setTapFlash] = useState(false);
const [adjustLabel, setAdjustLabel] = useState("");
const [showAlternatives, setShowAlternatives] = useState(false);
const [altExercises, setAltExercises] = useState([]);
const [altLoading, setAltLoading] = useState(false);
const [exerciseOverrides, setExerciseOverrides] = useState({}); // { [exIdx]: replacementExercise }
const [instrStep, setInstrStep] = useState(0);
const [dragOffset, setDragOffset] = useState(0);
const [isDragging, setIsDragging] = useState(false);
const [showBreathingReminder, setShowBreathingReminder] = useState(false);
const [wakeLockDenied, setWakeLockDenied] = useState(false);
```

### useRef (no re-renders)

```javascript
const startTimeRef = useRef(Date.now());       // session start for duration calc
const touchStartXRef = useRef(0);             // swipe gesture tracking
const restStartedAtRef = useRef(0);           // ms when rest phase began
const timerTotalRef = useRef(0);             // total duration when timer starts
const wakeLockRef = useRef(null);            // WakeLockSentinel
const adjustLabelTimerRef = useRef(null);    // clearTimeout handle
const breathingTimerRef = useRef(null);      // clearTimeout handle
const stepsActualRef = useRef([...]);        // rich actual_json per exercise
```

### Derived

```javascript
const cur = exerciseOverrides[exIdx] ?? exercises[exIdx];
const bodyMode = cycle?.mode ?? "standard";
const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
const totalSets = cur?.sets ?? 3;
const isTimeBased = !cur?.target_reps && !!cur?.target_duration_sec;
const targetReps = adjustedReps ?? cur?.target_reps ?? 10;
```

---

## 12. CSS keyframes added to global `<style>`

```css
@keyframes tapScale {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.96); }
  100% { transform: scale(1); }
}
@keyframes tapRing {
  0%   { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.18); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
```

---

## 13. Implementation order — ✅ ALL COMPLETE

1. ✅ Redesign WorkoutView component with phase state machine
2. ✅ Build instruction card with swipe gesture
3. ✅ Build rep tap zone with dot display and haptics
4. ✅ Build rest countdown timer with +/− controls
5. ✅ Build difficulty override controls (−/+ reps or duration)
6. ✅ Build "Show alternatives" bottom sheet
7. ✅ Build difficulty feedback question (too hard / just right / too easy) — wired to perceived_exertion
8. ✅ Implement Wake Lock API with fallback reminder
9. ✅ Update execution_steps actual_json with full rich tracking per set
10. ✅ Add pregnancy/postnatal adaptations to execution screen

---

## 14. Micro-interactions and feel

- **Rep tap**: emerald flash + `tapScale` animation (1.0 → 0.96 → 1.0, 150ms) + `tapRing` pulse
- **Rest start**: smooth phase transition
- **Rest countdown colour**: emerald → amber at 10s → red at 5s (CSS `transition: color 0.4s`)
- **Instruction swipe**: spring physics `cubic-bezier(0.34, 1.4, 0.64, 1)`, dampened drag (×0.55)
- **Difficulty change**: toast label "Adjusted to N reps" fades after 2s
- **Exercise complete**: checkmark icon, 2s auto-advance
- **Breathing reminder**: amber card slides in at rest start, auto-dismisses after 3s

---

## 15. Font sizes and touch targets

All must be readable at arm's length, tappable with sweaty fingers:

- Exercise name: 32px font-weight 900
- Set counter label: 13px font-weight 900 uppercase muted
- Instruction text: 18px font-weight 700 line-height 1.6
- Cue text: 13px italic color muted
- Rep count display: 64px font-weight 900
- Countdown timer: 84px font-weight 900
- All action buttons: minimum 48px height
- Tap zone: minimum 280px height
- Bottom action bar: fixed bottom, padding-bottom 24px (safe area)
