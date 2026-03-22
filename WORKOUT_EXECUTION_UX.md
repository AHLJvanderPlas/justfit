# Workout Execution UX — Spec for Claude Code
# Step-by-step coaching, rep confirmation, rest timers, difficulty override

## Philosophy

During a workout, the app is a coach standing next to you.
It tells you what to do, shows you how, counts with you,
and gives you space to breathe between efforts.

The screen is used with sweaty hands, glanced at between reps,
and sometimes propped up across the room. Every interaction
must work with one thumb, in 2 seconds, at a glance.

---

## 1. Workout execution screen — complete redesign

### Screen layout (single exercise, full screen)

```
┌─────────────────────────────────────────────────────┐
│  ← Cancel          Push-up          Set 2 of 3      │  ← header
├─────────────────────────────────────────────────────┤
│                                                     │
│  ╔═══════════════════════════════════════════════╗  │
│  ║  INSTRUCTION CARD (swipeable)                ║  │
│  ║                                               ║  │
│  ║  Step 2 of 4                                 ║  │
│  ║                                               ║  │
│  ║  "Lower chest to the floor                   ║  │
│  ║   with control. Elbows                        ║  │
│  ║   30–45° from your torso."                   ║  │
│  ║                                               ║  │
│  ║  ● ● ○ ○  ← step dots                       ║  │
│  ╚═══════════════════════════════════════════════╝  │
│                                                     │
│         Target: 10 reps   ░░░░░░░░░░░░░░           │
│                  Done: ● ● ● ○ ○ ○ ○ ○ ○ ○         │  ← rep dots
│                                                     │
│  [  −  ]  [  10 reps  ]  [  +  ]                   │  ← difficulty
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │           TAP TO COUNT REP                   │  │  ← big tap zone
│  │                                               │  │
│  │              4 / 10                           │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Skip exercise]              [Finish set early]    │
└─────────────────────────────────────────────────────┘
```

### After each rep is tapped:
- Rep dot fills: ○ → ●
- Subtle haptic (if available): `navigator.vibrate(30)`
- Rep count increments
- Small emerald flash on the tap zone

### After last rep of a set:
- Transition to REST screen (see below)

### After last rep of last set:
- Transition to SET COMPLETE → next exercise

---

## 2. Instruction card — swipeable steps

### Behaviour
- Shows steps from `instructions_json.steps[]`
- 1 step per card, swipeable left/right
- Auto-shows step 1 when exercise begins
- User can swipe through at their own pace
- Step dots show position (● ● ○ ○)
- Cues from `instructions_json.cues[]` shown below the steps
  in smaller muted text — always visible regardless of which step

### Instruction card design

```
╔═══════════════════════════════════════════════╗
║  Step 1 of 4                   ○ ● ○ ○       ║
║                                               ║
║  "Start in a high plank,                     ║
║   hands shoulder-width apart."               ║
║                                               ║
║  ───────────────────────────────────         ║
║                                               ║
║  💡 Ribs down, glutes tight                  ║  ← cue
║     Neck neutral — don't look up             ║
╚═══════════════════════════════════════════════╝
```

Styling:
- Background: `rgba(255,255,255,0.06)` glassmorphism
- Border: `1px solid rgba(255,255,255,0.1)`
- Step text: white, 17px, font-weight 700, line-height 1.5
- Cues: muted (#64748b), 13px, italic
- Step indicator dots: emerald when active
- Swipe gesture: CSS transform with snap, spring animation
- "Step X of Y" label: small, muted, uppercase

### If no instructions in DB:
- Show exercise name + generic coaching cue:
  "Focus on form. Quality over speed. You've got this."
- Never show an empty card

### Pregnancy note / postnatal note:
- If `instructions_json.pregnancy_note` exists AND user is pregnant:
  Show as an additional card at the end with 🤱 icon
- If `instructions_json.postnatal_note` exists AND user is postnatal:
  Show as an additional card with 🌸 icon

---

## 3. Rep confirmation system

### For rep-based exercises (target_reps is set)

Large tap zone — minimum 280px tall, full width minus 32px padding.
Cannot be accidentally tapped by scrolling.

```javascript
// Tap zone visual states
const TAP_STATES = {
  idle:     { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',  text: 'TAP TO COUNT REP' },
  pressed:  { bg: 'rgba(16,185,129,0.25)', border: 'rgba(16,185,129,0.5)',  text: 'COUNTED!' },
  complete: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)',  text: 'SET COMPLETE' }
};
```

Rep dots display:
```
Done: ● ● ● ● ○ ○ ○ ○ ○ ○
      (filled)  (empty)
```
- Max 10 dots shown regardless of rep count
  (for 15 reps: dots still show 10, number counts up 11, 12...)
- On mobile: dots are 12px diameter, 8px gap, centered

### For time-based exercises (target_duration is set)

Replace tap zone with:

```
┌─────────────────────────────────────────────┐
│                                             │
│              00:30                          │  ← countdown
│                                             │
│         [▶ Start Timer]                    │
│   or if running:                           │
│         [■ Stop]                           │
│                                             │
│  Progress bar filling as time passes       │
└─────────────────────────────────────────────┘
```

Timer behaviour:
- Tap to start
- Haptic every 10 seconds
- Final 5 seconds: colour shifts to amber, counts loud
- At 0: auto-proceed to rest (no tap needed)
- User can stop early and mark as done

---

## 4. Rest countdown screen

### Triggered after: last rep of a set (not the last set)

Full screen takeover, replacing the exercise view:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Set 2 of 3 complete ✓                 │
│                                                     │
│                    REST                             │
│                                                     │
│              ┌─────────────────┐                   │
│              │                 │                   │
│              │      0:45       │                   │  ← countdown
│              │                 │                   │
│              └─────────────────┘                   │
│                                                     │
│         [−15s]  [Skip rest]  [+15s]                │  ← adjust
│                                                     │
│         Next set: 10 × Push-up                     │
│                                                     │
│  ████████████████████░░░░░░░░  ← rest progress     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Rest duration defaults (from spec + exercise science):

```javascript
const DEFAULT_REST = {
  strength_heavy:   90,  // 3+ sets, compound movement
  strength_light:   60,  // isolation or bodyweight
  pelvic_floor:     30,  // between Kegel sets
  cardio_interval:  30,  // between cardio intervals
  mobility:         20,  // between stretch holds
  micro_session:    20,  // always shorter rest in micro
};

function getDefaultRest(exercise, slotType, sets) {
  const tags = JSON.parse(exercise.tags_json || '[]');
  if (slotType === 'micro') return 20;
  if (tags.includes('pelvic_floor')) return 30;
  if (tags.includes('mobility')) return 20;
  if (tags.includes('cardio')) return 30;
  if (tags.includes('bodyweight') && sets <= 2) return 45;
  return 60; // default strength
}
```

### Rest controls:
- `[−15s]` — reduces rest by 15 seconds (minimum 10s)
- `[+15s]` — increases rest by 15 seconds (maximum 180s)
- `[Skip rest]` — immediately proceeds to next set
- Adjustments remembered per-session (not persisted globally)

### Rest UI details:
- Countdown in large format: 84px font-weight 900 emerald
- Turns amber at 10 seconds remaining
- Turns red at 5 seconds with gentle pulse animation
- Haptic at 10s and 5s remaining
- At 0: automatically transitions to next set
- "Next set: X × Exercise" — user knows what's coming
- Between LAST set and next EXERCISE: rest is also shown
  with "Next: [Exercise Name]" instead of "Next set"

---

## 5. Difficulty override

### Inline on exercise screen

```
[  −  ]  [  10 reps  ]  [  +  ]
```

- `[ − ]` — reduces by 2 reps OR increases rest by 15s
- `[ + ]` — increases by 2 reps OR reduces rest by 15s
- The current target updates immediately
- Shows a brief label: "Adjusted to 8 reps" (fades after 2s)

### For time-based exercises:
- `[ − ]` reduces duration by 10 seconds
- `[ + ]` increases duration by 10 seconds

### Rules for override:
- Minimum reps: 1 (never zero)
- Maximum reps: 30 (cap at 30 for safety)
- Minimum duration: 10 seconds
- Maximum duration: 300 seconds (5 minutes)
- Override applies to CURRENT and ALL REMAINING sets
  (user sets once, it applies consistently)

### Override storage:
Store in the execution_steps actual_json:
```json
{
  "target_original": 10,
  "target_adjusted": 8,
  "adjustment_reason": "user_override",
  "direction": "down",
  "reps_completed": 8
}
```
This feeds back to the planner next time — if user consistently
adjusts down, R512 becomes more aggressive. If consistently up,
the plan difficulty increases.

### Difficulty feedback after session:
After the final exercise, before "Complete Session":

```
How did that feel?

[😰 Too hard]  [😌 Just right]  [💪 Too easy]
```

Map to perceived_exertion score:
- Too hard → perceived_exertion = 8
- Just right → perceived_exertion = 5
- Too easy → perceived_exertion = 3

Store in executions.perceived_exertion
This feeds into the planner's difficulty calibration.

---

## 6. Exercise screen states — full flow

```
STATE 1: INSTRUCTION
Shows swipeable instruction cards.
Button: [Ready — let's go →]
(or auto-advances after 5 seconds if user doesn't interact)

STATE 2: WORKING
Shows rep tap zone / timer.
Header shows: Set X of Y
Rep dots fill as user taps.
Difficulty controls available.

STATE 3: SET REST
Shows rest countdown.
Shows what's coming next.
Controls: −15s, Skip, +15s

[Repeat STATE 2 → STATE 3 for each set]

STATE 4: EXERCISE COMPLETE
Brief celebration:
"Push-up done ✓  3 sets · 10 reps each"
Auto-advances after 2 seconds (or tap to skip)

[Repeat for each exercise]

STATE 5: SESSION COMPLETE
Difficulty feedback question
Then → "Complete Session" button
```

---

## 7. Session header — always visible

```
┌─────────────────────────────────────────────────────┐
│  ← Cancel    Push-up (2/5)    ████░░░░░  Set 2/3   │
└─────────────────────────────────────────────────────┘
```

- Exercise name + position in session (e.g. "2 of 5 exercises")
- Overall session progress bar (thin, 4px, full width)
- Current set indicator
- Cancel: goes back to Today screen (with confirmation if mid-session)

---

## 8. "Can't do this exercise?" flow

Below the tap zone, always visible (small, unobtrusive):

```
[Skip exercise]          [Show alternatives]
```

### Skip exercise:
- Logs step as `skipped: true` in execution_steps
- Moves to next exercise immediately
- No rest countdown (they're not tired if they skipped)

### Show alternatives:
Opens a bottom sheet:

```
Alternatives for Push-up

● Incline Push-up      Easier — hands elevated
  [Try this instead]

● Knee Push-up         Easier — on your knees
  [Try this instead]

● Diamond Push-up      Harder — hands close together
  [Try this instead]

[Keep original]
```

Data from `alternatives_json.substitutions[]` in the exercise record.
Fetch the alternative exercises from DB by slug.
Show: name + brief description + difficulty indicator.

On "Try this instead":
- Replace current exercise with the alternative for this session only
- Log: `exercise_substituted: true`, `original_exercise_id`, `substitute_exercise_id`
- Show the alternative's instruction cards
- Continue with same sets/reps target

---

## 9. Pregnancy & postnatal adaptations to execution screen

### Pregnancy mode:
- Rest timer default +15s longer than standard
- After each set: show optional breathing reminder
  "Take a breath — inhale through nose, sigh out through mouth"
  (dismissable, shown for 3s only)
- Difficulty override is always visible and prominent
  (pregnant users should feel empowered to adjust at any time)
- If exercise has `pregnancy_note`: show as the FIRST instruction card
  with a soft amber/gold accent instead of white
- "Can't do this?" is renamed "This doesn't feel right"
  (softer language for pregnancy)

### Postnatal mode:
- Same as pregnancy adaptations above
- For pelvic floor exercises: show a special coaching card:
  "Remember: the release is just as important as the squeeze.
   Full relaxation between each rep."
- If `postnatal_note` exists: show as first instruction card with rose accent

---

## 10. Wake Lock implementation

```javascript
// Keep screen awake during workout
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {
    // Not supported or permission denied — show reminder
    showScreenReminder();
  }
}

function showScreenReminder() {
  // Small non-intrusive banner at top:
  // "Keep your screen on during the workout → Settings"
  // Dismissable, shown once per session
}

// Request wake lock when workout starts
// Release when workout complete or user leaves screen
async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

// Re-acquire on visibility change (tab back to foreground)
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    await requestWakeLock();
  }
});
```

---

## 11. Data stored per execution step

```javascript
// execution_steps record for each exercise attempt
{
  id: uuid,
  execution_id: uuid,
  step_index: 0,
  step_type: 'exercise',
  exercise_id: uuid,
  
  prescribed_json: {
    sets: 3,
    reps: 10,          // or duration_seconds
    rest_seconds: 60,
    intensity: 'moderate'
  },
  
  actual_json: {
    sets_completed: 3,
    reps_per_set: [10, 9, 8],      // actual reps per set
    rest_taken_seconds: [65, 45],  // actual rest between sets
    target_adjusted: true,
    target_original: 10,
    target_final: 8,               // after user adjustments
    adjustment_direction: 'down',
    exercise_substituted: false,
    original_exercise_id: null,
    substitute_exercise_id: null,
    skipped: false,
    duration_seconds: null,        // for time-based
    completed_at_ms: 1767830400000
  }
}
```

---

## 12. State management in App.jsx

Add to workout state:

```javascript
const [workoutState, setWorkoutState] = useState({
  // Current position
  exerciseIndex: 0,    // which exercise in session
  currentSet: 1,       // which set of current exercise
  repCount: 0,         // reps done this set
  phase: 'instruction', // 'instruction' | 'working' | 'resting' | 'complete'
  
  // User adjustments
  adjustedReps: null,  // null = use plan value
  adjustedDuration: null,
  
  // Tracking
  setsData: [],        // [{reps_completed, rest_taken}] per set
  startTime: null,
  
  // Rest timer
  restRemaining: 60,
  restTotal: 60,
  restInterval: null,
});
```

---

## 13. Implementation order

1. Redesign WorkoutView component with phase state machine
   (instruction → working → resting → exercise complete → next)
2. Build instruction card with swipe gesture
3. Build rep tap zone with dot display and haptics
4. Build rest countdown timer with +/− controls
5. Build difficulty override controls (−/+ reps or duration)
6. Build "Show alternatives" bottom sheet
7. Build difficulty feedback question (too hard / just right / too easy)
8. Implement Wake Lock API with fallback reminder
9. Update execution_steps API to store actual_json with full detail
10. Add pregnancy/postnatal adaptations to execution screen
11. Test full flow: instruction → rep confirmation → rest → next set → next exercise → complete

Commit and push after each step.

---

## 14. Micro-interactions and feel

The workout screen should feel alive. These small details matter:

- **Rep tap**: emerald flash + subtle scale (1.0 → 0.96 → 1.0 in 150ms)
- **Set complete**: brief green ring expands from center, fades out (300ms)
- **Rest start**: smooth slide-up of rest screen (300ms ease-out)
- **Rest end**: smooth slide-down back to exercise (200ms ease-in)
- **Instruction swipe**: spring physics (stiffness 300, damping 30)
- **Difficulty change**: number updates with a subtle bounce
- **Exercise complete**: checkmark draws itself (SVG path animation, 400ms)
- **Session complete**: confetti burst (CSS only, 20 particles, 1s)

All animations respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 15. Font size and touch targets

These are used during exercise — everything must be readable at arm's
length and tappable with sweaty fingers:

- Exercise name: 32px font-weight 900
- Set counter: 16px font-weight 700
- Instruction text: 18px font-weight 600 line-height 1.6
- Cue text: 14px font-weight 500 color muted
- Rep count display: 64px font-weight 900 (the big number)
- Countdown timer: 84px font-weight 900
- All tap targets: minimum 56px height
- Tap zone: minimum 280px height
- Bottom action buttons: minimum 56px height, full width or 48% each
