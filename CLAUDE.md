# Standing Instructions — Always Follow

These rules apply to EVERY task in EVERY session, without exception.

## After every change
- Always run `git add . && git commit -m "..." && git push` after completing each task
- Then build and deploy directly: `npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main`
- Never leave uncommitted changes
- Commit messages must follow conventional format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`

## Deploy workflow (GitHub auto-deploy suspended)
- Git push = source backup only (GitHub auto-deploy to Cloudflare Pages is suspended)
- Deploy via wrangler directly: `npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main`
- Wrangler must be logged in to `ahljvanderplas@gmail.com` (account: JustFit.cc, ID: ce96b957f7de20cc5d388eba856fa8dc)
- Check with: `npx wrangler whoami` — if wrong account, run `npx wrangler logout` then `npx wrangler login`
- D1 migrations: `npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql`

## After every session
- Update `CLAUDE.md` to reflect any new features built, bugs fixed, or status changes
- Update `README.md` with any new setup steps, environment variables, or architectural changes
- Update the "Current Build Status" table in `CLAUDE.md` — mark completed items ✅, new items ⬜

## Before starting any task
- Read `CLAUDE.md` fully if it has been updated since last read
- Check `wrangler.toml` does NOT contain `account_id` — remove it if present
- Never hardcode secrets — always use `env.VARIABLE_NAME` from Cloudflare environment

## Code quality rules
- Pages Functions are plain `.js` files — no TypeScript, no npm imports, no bundler
- All styles in `src/App.jsx` are inline using the `C.` design token object
- Never add `account_id` to `wrangler.toml`
- Always use `env.DB.batch([...])` for multiple D1 inserts, never sequential awaits in a loop
- All D1 timestamps are milliseconds: `Date.now()` — column suffix `_at_ms`
- All D1 primary keys are UUIDs: `crypto.randomUUID()`

## Design rules
- Background: #020617, accent: #10b981 emerald, cards: rgba(255,255,255,0.04)
- Border radius: 28px for cards, 14px for inputs, 16px for buttons
- All styles inline — no Tailwind, no CSS modules, no external stylesheets
- Typography: font-weight 900 for headings, 700 for labels, 500 for body
- Never use Inter, Roboto, or Arial — use system font stack

## Testing before push
- Run `npm run build` locally and confirm it succeeds before pushing
- Check the browser console for errors after deploy
- Verify the specific feature works end-to-end before moving to next task

---

# JustFit.cc — Claude Code Project Context

## What this project is
JustFit.cc is a privacy-first, consistency-driven fitness PWA. Core philosophy: **Consistency > Intensity**.
The app adapts daily to the user's real life (sleep, stress, travel, injury) via a deterministic rule-based
planner engine. It is not a social app, not a medical app, and does not use free-form AI to control plans.

Live URL: https://justfit.cc (also justfit.pages.dev)
GitHub: https://github.com/AHLJvanderPlas/justfit

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite; UI components and inline styles in `src/App.jsx`; pure non-React modules (API client, hooks) extracted to `src/`; no router library, no component-per-view splitting |
| Hosting | Cloudflare Pages (auto-deploy on push to `main`) |
| API | Cloudflare Pages Functions in `/functions/api/` (plain JS, no bundler, no npm) |
| Database | Cloudflare D1 (SQLite) bound as `DB` |
| Auth | JWT via Web Crypto API (no external libs) |
| CI/CD | GitHub → Cloudflare Pages (push to main = live in ~30s) |

**Critical constraint**: Pages Functions cannot use npm packages. Use only Web Crypto API,
built-in fetch, and `env.DB` for D1. No bcrypt, no jose, no external JWT libraries.

---

## Cloudflare Resources

| Resource | Value |
|---|---|
| D1 database name | `justfit-db` |
| D1 database ID | `4c6fedf0-b9e2-4441-aa98-71c1420136c1` |
| D1 binding name | `DB` |
| Pages project name | `justfit` |
| Cloudflare account email | ahljvanderplas@gmail.com |

wrangler.toml is configured with the D1 binding. Always use `--remote` flag when querying D1:
```bash
npx wrangler d1 execute justfit-db --remote --command "SELECT ..."
```

---

## Project Structure

```
justfit/
├── src/
│   ├── App.jsx          ← entire frontend (single file, no sub-components)
│   └── main.jsx         ← renders App (no CSS import — all styles inline in App.jsx)
├── functions/
│   └── api/
│       ├── auth.js      ← POST signup/login/forgot/reset/magic/passkey, GET magic verify + token verify
│       ├── checkin.js   ← POST save check-in, GET fetch check-ins
│       ├── exercises.js ← GET exercises from D1 with tag filtering
│       ├── execution.js ← POST save workout, GET fetch history
│       ├── plan.js      ← POST generate plan (runs planner engine v1.8.0), GET fetch plan
│       ├── profile.js   ← GET/POST user_preferences + cycle/pregnancy/postnatal context
│       ├── score.js     ← GET consistency score for user
│       └── ping.js      ← GET health check
├── public/
│   ├── index.html           ← marketing landing page (static, no React)
│   ├── login.html           ← standalone auth page: password, magic link, passkey/Face ID, forgot password
│   ├── reset-password.html  ← password reset form (linked from email, reads ?token=)
│   ├── magic.html           ← magic link landing page (reads ?token=, handles needsSignup redirect)
│   ├── manifest.json        ← PWA manifest
│   ├── favicon.svg          ← app icon
│   ├── _routes.json         ← routes /api/* to Functions, /* to React SPA
│   └── _redirects           ← SPA fallback
├── migrations/
│   ├── 0001_init.sql        ← full schema
│   ├── 0002_seed.sql        ← awards seed data
│   ├── 0003_cleanup.sql     ← FK fixes
│   ├── 0004_exercises.sql   ← 35 new exercises (total: 50)
│   ├── 0005_templates.sql   ← 8 session templates
│   ├── 0006_passkeys.sql    ← passkey_credentials table
│   ├── 0007_auth_tokens.sql ← password_reset_tokens + magic_link_tokens tables; counter/backed_up/transports on passkey_credentials
│   ├── 0008_cycle.sql       ← cycle_profile table (standard cycle tracking: tracking_mode, cycle_length_days, last_period_start)
│   ├── 0009_pregnancy.sql   ← extends cycle_profile with pregnancy/postnatal columns; adds pregnancy_weekly_log table
│   ├── 0010_exercise_library.sql ← 100 new exercises (total: ~150); adds equipment_advised_json column; updates tags on existing exercises
│   ├── 0011_pregnancy_templates.sql ← 8 pregnancy/postnatal session templates (total: 16)
│   ├── 0012_conditioning_exercises.sql ← conditioning exercises
│   ├── 0013_height.sql        ← height_cm column on user_profile
│   ├── 0014_progression.sql   ← user_progression + user_progression_events tables
│   ├── 0015_run_intervals.sql ← 6 run/walk interval exercises (levels 1–6) for R555 safe running
│   ├── 0016_run_program.sql   ← 4 run warm-up exercises + 15 continuous run levels (7–21) for R556 Running Coach
│   ├── 0017_polarised_training.sql ← polarised training flag in preferences
│   ├── 0018_checkin_unique.sql ← UNIQUE(user_id, date) index on daily_checkins (dedupes, enables atomic upsert)
│   ├── 0019_taxonomy_fix.sql   ← equipment taxonomy fix: cycling-intervals-indoor + stationary-bike-steady now include both indoor_bike and exercise_bike
│   ├── 0020_exercise_library_v3.sql ← 100 new exercises (total: 290); sections: dumbbell(15), bands/kettlebell/pullup/bw(26), mobility(15), recovery(12), cardio(12), equipment-conditional(20)
│   └── 0021_injury_tags.sql ← adds loads_knee/loads_shoulder/loads_lower_back/loads_ankle tags to ~182 exercises for R562–R563 injury filtering
├── wrangler.toml
├── vite.config.js
└── package.json
```

---

## Database Schema (D1 — justfit-db)

All tables use `id TEXT PRIMARY KEY` (UUID), timestamps as `INTEGER` milliseconds (`*_at_ms`),
and are `STRICT`. Foreign keys reference `users(id)`.

### Key tables

**users** — core identity, minimal fields
```sql
id TEXT PK, status TEXT, primary_email TEXT, created_at_ms INT, updated_at_ms INT
```

**auth_users** — credentials, separate from identity
```sql
id TEXT PK, user_id TEXT FK→users(id), provider TEXT, email TEXT,
password_hash TEXT, password_algo TEXT, last_login_at_ms INT, created_at_ms INT, updated_at_ms INT
```
Password stored as `salt:hash` where hash = SHA-256(salt + password + JWT_SECRET)

**daily_checkins** — one per user per day
```sql
id TEXT PK, user_id TEXT, date TEXT (YYYY-MM-DD),
mood INT(1-10), energy INT(1-10), sleep_hours REAL, stress INT(1-10),
checkin_json TEXT (JSON with toggles: no_clothing, no_gear, no_time, gym_today,
                   traveling, pain_level, pain_scope, pain_areas,
                                      free_text, motivation, time_budget),
created_at_ms INT, updated_at_ms INT
```
Note: UI uses 1-5 scale, multiplied by 2 before storing (→ 2-10 range in DB)

**day_plans** — generated plans, one per user per day
```sql
id TEXT PK, user_id TEXT, date TEXT, plan_status TEXT,
plan_json TEXT (JSON: session_name, slot_type, intensity, steps[], rule_trace[]),
generated_by TEXT, engine_version TEXT, seed TEXT, created_at_ms INT, updated_at_ms INT
```

Each step in `steps[]` contains:
```javascript
{
  exercise_id, exercise_slug, name, category,
  tags_json,            // "[\"strength\",\"bodyweight\",...]" — used for rest calc and coaching
  target_reps,          // null for time-based
  target_duration_sec,  // null for rep-based
  sets,
  rest_sec,             // pre-computed by getDefaultRest() in plan.js
  instructions_json,    // "{steps:[], cues:[], pregnancy_note?, postnatal_note?}" or null
  alternatives_json,    // "{substitutions:[\"slug1\",\"slug2\"]}" or null
  gif_url,              // optional
}
```

**executions** — completed workouts
```sql
id TEXT PK, user_id TEXT, date TEXT, day_plan_id TEXT,
execution_type TEXT, status TEXT, total_duration_sec INT,
perceived_exertion INT,   ← 3 (too easy) / 5 (just right) / 8 (too hard) / NULL (skipped rating)
created_at_ms INT, updated_at_ms INT
```

**execution_steps** — per-exercise detail within a workout
```sql
id TEXT PK, execution_id TEXT FK→executions(id), step_index INT,
step_type TEXT, exercise_id TEXT FK→exercises(id),
prescribed_json TEXT,   ← {sets, reps, duration_sec, rest_sec}
actual_json TEXT,       ← see rich actual_json structure below
created_at_ms INT, updated_at_ms INT
```

**Rich `actual_json` structure** (stored per execution_step):
```javascript
{
  sets_completed: 3,
  reps_per_set: [10, 9, 8],         // actual reps per set (or seconds for time-based)
  rest_taken_seconds: [63, 41],     // wall-clock rest elapsed per rest period
  target_adjusted: true,            // whether user changed the target
  target_original: 10,              // prescribed value
  target_final: 8,                  // after user adjustments
  adjustment_direction: "down",     // "up" | "down"
  exercise_substituted: false,      // whether an alternative was chosen
  original_exercise_id: null,
  substitute_exercise_id: null,
  skipped: false,                   // whether exercise was skipped entirely
  completed_at_ms: 1767830400000,   // Date.now() when exercise was finished
}
```

**exercises** — ~150 exercises seeded (migrations 0001–0010)
```sql
id TEXT PK, slug TEXT, name TEXT,
category TEXT CHECK (category IN ('strength','cardio','mobility','recovery','skill','mixed')),
tags_json TEXT,               ← ["strength","bodyweight","no_floor","low_impact","quiet",
                                  "pregnancy_safe","postnatal_safe","pelvic_floor","kegel",
                                  "breathing","supine","prone","crunch","valsalva","high_impact","inversion",...]
equipment_required_json TEXT, ← ["none"] or ["dumbbell"] etc
equipment_advised_json TEXT,  ← optional advisory equipment (migration 0010)
instructions_json TEXT,       ← {steps:[], cues:[], pregnancy_note?: string, postnatal_note?: string}
metrics_json TEXT,            ← {supports:["reps","sets","time",...]}
alternatives_json TEXT,       ← {substitutions:["slug1","slug2"]}
is_active INT, created_at_ms INT, updated_at_ms INT
```
Notes:
- `pelvic_floor` is a TAG (used for planner filtering), not a category. Pelvic floor exercises use category `'mobility'`.
- `instructions_json.pregnancy_note` — shown in instruction card for pregnant users (amber accent)
- `instructions_json.postnatal_note` — shown in instruction card for postnatal users (rose accent)

**awards** — 12 seeded awards
```sql
id TEXT PK, slug TEXT, name TEXT, description TEXT,
category TEXT, icon TEXT,
criteria_json TEXT, ← {type:"session_count", threshold:1} etc
is_active INT, created_at_ms INT, updated_at_ms INT
```

**entitlements** — subscription/trial access
```sql
id TEXT PK, user_id TEXT, product_code TEXT, source TEXT,
status TEXT (active/trialing/grace/canceled/expired),
starts_at_ms INT, ends_at_ms INT, created_at_ms INT, updated_at_ms INT
```

**passkey_credentials** — WebAuthn/passkey registrations (migration 0006 + 0007)
```sql
id TEXT PK, user_id TEXT FK→users(id), credential_id TEXT UNIQUE,
public_key TEXT (SPKI base64url), algorithm INTEGER (-7 = ES256),
device_type TEXT, counter INTEGER NOT NULL DEFAULT 0,
backed_up INTEGER NOT NULL DEFAULT 0, transports TEXT,
created_at_ms INT, last_used_at_ms INT, updated_at_ms INT
```

**password_reset_tokens** — DB-backed single-use reset tokens (migration 0007)
```sql
token TEXT PK, user_id TEXT FK→users(id), email TEXT,
expires_at_ms INT (1 hour), used_at_ms INT (NULL = unused), created_at_ms INT
```

**magic_link_tokens** — DB-backed single-use magic link tokens (migration 0007)
```sql
token TEXT PK, user_id TEXT (NULL if email not yet registered), email TEXT,
expires_at_ms INT (15 min), used_at_ms INT (NULL = unused), created_at_ms INT
```

**cycle_profile** — body mode and cycle tracking per user (migrations 0008 + 0009)
```sql
user_id TEXT FK→users(id),
-- Standard cycle (migration 0008)
tracking_mode TEXT ('off','smart'), cycle_length_days INT, last_period_start TEXT,
-- Body mode + pregnancy (migration 0009)
mode TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('standard','pregnant','postnatal')),
pregnancy_due_date TEXT, pregnancy_confirmed_at_ms INT, medical_clearance_confirmed INT DEFAULT 0,
-- Postnatal (migration 0009)
postnatal_birth_date TEXT,
postnatal_birth_type TEXT CHECK (postnatal_birth_type IN ('vaginal','caesarean','prefer_not_to_say')),
postnatal_cleared_for_exercise INT DEFAULT 0, postnatal_clearance_date TEXT,
created_at_ms INT, updated_at_ms INT
```

**pregnancy_weekly_log** — weekly summary log during pregnancy (migration 0009)
```sql
id TEXT PK, user_id TEXT FK→users(id),
week_number INT, week_start_date TEXT,
avg_energy REAL, avg_nausea REAL, avg_breathless REAL,
sessions_done INT DEFAULT 0, notes TEXT, created_at_ms INT
```

**period_log** — period start events for smart cycle tracking (migration 0008)
```sql
id TEXT PK, user_id TEXT FK→users(id),
started_on TEXT, noted_at_ms INT, source TEXT ('manual','auto')
```

**user_preferences, user_profile, user_availability, user_contact** — profile data
**referrals, referral_codes, vouchers** — growth mechanics
**user_awards** — unlocked awards per user
**support_tokens** — time-limited support access

---

## Auth System

JWT implementation uses Web Crypto API only (no npm). Located in `functions/api/auth.js`.

```javascript
// Token stored in localStorage as 'jf_token'
// User ID stored in localStorage as 'jf_user_id'
// On app load: if no token → redirect to /login.html
// JWT payload: { userId, email, exp }
// JWT_EXPIRY = 7 days
// JWT secret: env var JWT_SECRET (required in production)
```

Password hashing:
```javascript
hash = SHA-256(salt + password + JWT_SECRET)
stored as: "salt:hash"
```

Email sending: Resend API, FROM `JustFit.cc <noreply@justfit.cc>`, env var `RESEND_API_KEY`.

Auth endpoints (`POST /api/auth` with `{action, ...}`):
| action | Description |
|---|---|
| `signup` | Create account, send welcome email |
| `login` | Password login |
| `forgot_password` | Generate DB token, send reset email (1hr expiry) |
| `reset_password` | Consume DB token (single-use), update password hash |
| `magic_link` | Generate DB token, send magic link email (15min expiry) |
| `passkey_begin_register` | Issue WebAuthn challenge JWT (2min), return options |
| `passkey_complete_register` | Verify attestation, store credential with counter=0 |
| `passkey_begin_auth` | Issue WebAuthn challenge JWT, return discoverable-credential options |
| `passkey_complete_auth` | Verify assertion: challenge, RP ID hash, UP flag, counter, ECDSA sig |

`GET /api/auth?magic=<token>` — verify magic link token (marks used, returns `{ok,token,userId}` or `{needsSignup,email}`)
`GET /api/auth` with `Authorization: Bearer <token>` — verify JWT session token

WebAuthn specifics:
- Algorithm: ES256 (alg -7), ECDSA P-256
- Public key stored as SPKI base64url via `getPublicKey()`
- RP ID: `env.WEBAUTHN_RP_ID ?? 'justfit.cc'` (configurable for local dev)
- Replay protection: sign counter checked (`newCounter > storedCounter`), counter=0 allowed for backed-up credentials
- Discoverable credentials: `allowCredentials: []` for login (user selects passkey)

---

## Frontend (src/App.jsx)

Single-file React app, all styles inline (no Tailwind, no CSS modules).

### Design tokens
```javascript
const C = {
  bg: "#020617",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  emerald: "#10b981",
  emeraldDim: "rgba(16,185,129,0.15)",
  emeraldBorder: "rgba(16,185,129,0.3)",
  text: "#f8fafc",
  muted: "#64748b",
  subtle: "#334155",
};
```

Pregnancy/postnatal accent colours (not in C, used inline):
- Amber: `#f59e0b` / `rgba(245,158,11,0.08)` / `rgba(245,158,11,0.3)`
- Rose: `#f43f5e` / `rgba(244,63,94,0.08)` / `rgba(244,63,94,0.3)`

### Views (internal state, no router)
- `today` — Dashboard with consistency score + today's session card
- `history` — List of past executions from API
- `awards` — Hall of Fame, 26 awards shown
- `settings` — Subscription toggle, app preferences, logout

### Key app-level state
```javascript
userId        // from localStorage 'jf_user_id'
token         // from localStorage 'jf_token'
plan          // current day_plan object from API
score         // consistency score integer 0-100
history       // array of execution objects
isGenerating  // bool — plan generation in progress
showCheckIn   // bool — check-in modal visible
inWorkout     // bool — workout execution view (WorkoutView overlay) active
cycle         // cycle_profile object {mode, ...} from /api/profile
```

### API calls (all in `api` object at top of App.jsx)
```javascript
api.generatePlan(userId, date, checkin)
  // POST /api/plan → returns day_plan object

api.getScore(userId)
  // GET /api/score → returns integer 0-100

api.saveExecution(userId, planId, date, steps, durationSec, perceivedExertion)
  // POST /api/execution
  // steps: stepsActualRef.current from WorkoutView (each has exercise_id, prescribed{}, actual{})
  // perceivedExertion: 3|5|8|null
  // → returns { ok: true }

api.getHistory(userId)
  // GET /api/execution → returns array of execution objects

api.getExercisesBySlugs(slugs)
  // GET /api/exercises, filters client-side by slug array
  // Used by WorkoutView to load alternative exercises
  // → returns array of exercise objects
```

### handleComplete / handleBonusComplete (app-level callbacks)

```javascript
const handleComplete = async (durationSec, perceivedExertion, stepsActual) => {
  const mergedSteps = stepsActual ?? plan?.steps ?? [];
  await api.saveExecution(userId, plan?.id, today, mergedSteps, durationSec, perceivedExertion);
  // refreshes score + history, marks today completed
};
```

WorkoutView calls `onComplete(durationSec, perceivedExertion, stepsActualRef.current)`.

---

## WorkoutView — Coaching Interface

**Philosophy**: During a workout, the app is a coach standing next to you. Every interaction must work with one thumb, in 2 seconds, at a glance. Screen stays on via Wake Lock.

`WorkoutView` is a full-screen fixed overlay (`position: fixed, inset: 0, zIndex: 50`) rendered when `inWorkout === true`.

```javascript
function WorkoutView({ plan, onComplete, onBack, cycle })
```

Props:
- `plan` — day_plan object with `steps[]`, `slot_type`, `session_name`, `id`
- `onComplete(durationSec, perceivedExertion, stepsActual)` — called when session finishes
- `onBack()` — cancels workout, returns to Today screen
- `cycle` — cycle_profile object; `cycle.mode` drives pregnancy/postnatal adaptations

### Phase state machine

```
"instruction" → "working" → "resting" → (repeat per set) → "exerciseComplete" → (next exercise) → "sessionFeedback"
```

Special phases:
- `"restDay"` — when `plan.slot_type === 'rest'` or no exercises
- `"exerciseComplete"` — 2-second auto-advance between exercises
- Exercise overrides: `const cur = exerciseOverrides[exIdx] ?? exercises[exIdx]`

### Screen layout

```
┌─────────────────────────────────────────────────────┐
│  ← Cancel          Push-up          Set 2 of 3      │  ← header
├─────────────────────────────────────────────────────┤
│  [amber wake lock banner, only if API unavailable]  │
├─────────────────────────────────────────────────────┤
│  [thin progress bar — full session progress]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [phase-specific content]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### State

All state is local to `WorkoutView`. No global state store.

#### useState

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
const [showBreathingReminder, setShowBreathingReminder] = useState(false);
const [wakeLockDenied, setWakeLockDenied] = useState(false);
```

#### useRef (no re-renders)

```javascript
const startTimeRef = useRef(Date.now());       // session start for duration calc
const touchStartXRef = useRef(0);             // swipe gesture tracking
const restStartedAtRef = useRef(0);           // ms when rest phase began
const timerTotalRef = useRef(0);             // total duration when Start button pressed
const wakeLockRef = useRef(null);            // WakeLockSentinel
const adjustLabelTimerRef = useRef(null);    // clearTimeout handle for toast
const breathingTimerRef = useRef(null);      // clearTimeout handle
const stepsActualRef = useRef([...]);        // rich actual_json per exercise (see below)
```

#### Derived values

```javascript
const cur = exerciseOverrides[exIdx] ?? exercises[exIdx];
const bodyMode = cycle?.mode ?? "standard";
const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
const totalSets = cur?.sets ?? 3;
const isTimeBased = !cur?.target_reps && !!cur?.target_duration_sec;
const targetReps = adjustedReps ?? cur?.target_reps ?? 10;
```

### Instruction cards (phase: "instruction")

Cards built from `instructions_json` parsed from exercise record:

```javascript
const instr = cur.instructions_json ? JSON.parse(cur.instructions_json) : null;
const rawSteps = instr?.steps ?? [];
const cues    = instr?.cues ?? [];   // always visible below cards
```

Card objects: `{ text: string, accent: null | "amber" | "rose" }`

| accent | background | border | text colour |
|---|---|---|---|
| `null` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.1)` | `#f8fafc` |
| `"amber"` | `rgba(245,158,11,0.08)` | `rgba(245,158,11,0.3)` | `#f59e0b` |
| `"rose"` | `rgba(244,63,94,0.08)` | `rgba(244,63,94,0.3)` | `#f43f5e` |

Card order / accent rules:
- Pregnant: `pregnancy_note` → amber card prepended as **first** card
- Postnatal: `postnatal_note` → rose card prepended as **first** card
- Postnatal + `pelvic_floor` tag: rose card appended at **end**: "Remember: the release is just as important as the squeeze. Full relaxation between each rep."
- Standard steps: no accent
- Fallback when no steps: "Focus on form. Quality over speed. You've got this."

Step label shows "Important note" for accent cards, "Step N of M" for standard steps.

Swipe gesture: `onTouchStart/Move/End` + `onMouseDown/Move/Up/Leave`. Drag dampened ×0.55. Snap if `|delta| > 60px`. Spring on release: `cubic-bezier(0.34, 1.4, 0.64, 1)`. `instrStep` resets to 0 on exercise change. Auto-advances to working phase after 5s of no interaction. "Ready — let's go →" CTA advances immediately.

### Rep/timer zone (phase: "working")

**Rep-based**: Large tap zone (min 280px height, full width minus padding). `navigator.vibrate(30)` on tap. `tapFlash` triggers `@keyframes tapScale` (scale 1→0.96→1, 150ms) + `tapRing` pulse. Auto-calls `handleSetDone` at 220ms after `repCount >= targetReps`. 64px weight-900 counter. Max 10 rep dots; "+N" overflow label if targetReps > 10.

**Time-based**: 84px countdown. Start button records `timerTotalRef.current = totalDur`. "Done early" calls `handleSetDone(totalDur - timerRemaining)` to record actual seconds. Natural completion fires at `timerRemaining === 0` via effect: `handleSetDone(timerTotalRef.current)`. Colour: emerald → amber at 10s → red at 5s.

**Difficulty controls** (both modes, always visible in pregnancy mode):
- Rep-based: `−2` / `+2` reps, bounds 1–30
- Time-based: `−10s` / `+10s`, bounds 10s–300s
- Toast "Adjusted to N reps" shown 2s via `adjustLabelTimerRef`
- State persists across sets until `exIdx` changes

### Rest countdown (phase: "resting")

```javascript
function getRestDuration(ex) {
  const tags = JSON.parse(ex?.tags_json || "[]");
  if (plan?.slot_type === "micro") return 20;
  if (tags.includes("pelvic_floor")) return 30;
  if (tags.includes("mobility")) return 20;
  if (tags.includes("cardio")) return 30;
  const base = ex?.rest_sec ?? 60;   // rest_sec from plan step (plan.js getDefaultRest)
  return isPregnancyMode ? base + 15 : base;
}
```

Timer via `setTimeout` (not `setInterval`) to avoid stale closures:

```javascript
useEffect(() => {
  if (phase !== "resting" || restRemaining <= 0) return;
  const id = setTimeout(() => setRestRemaining(r => Math.max(0, r - 1)), 1000);
  return () => clearTimeout(id);
}, [phase, restRemaining]);
```

Controls: `[−15s]` (min 10), `[Skip rest]`, `[+15s]` (max 180). Haptic `navigator.vibrate(60)` at exactly 10s and 5s remaining. "Next set: N × ExerciseName" or "Next: ExerciseName" for the following exercise. Progress bar fills as elapsed grows. At 0: records actual rest, increments set, returns to working phase.

### Exercise substitution

Bottom sheet slide-up with dark scrim and drag handle. Alternatives fetched by `api.getExercisesBySlugs(slugs)` from `alternatives_json.substitutions[]`. On "Try this instead" (`handleChooseAlternative`):
1. Stores replacement in `exerciseOverrides[exIdx]`
2. Resets `stepsActualRef.current[exIdx]` with `exercise_substituted: true`, `original_exercise_id`, `substitute_exercise_id`
3. Resets `currentSet`, `repCount`, `adjustedReps`, `adjustedDuration`, `instrStep` to 0
4. Returns to `"instruction"` phase

Button label: "Show alternatives" (standard) or "This doesn't feel right" (pregnancy/postnatal).

### Session feedback (phase: "sessionFeedback")

```
[😰 Too hard]  [😌 Just right]  [💪 Too easy]   Skip rating
```

Maps to `perceived_exertion`: 8 / 5 / 3 / null. Calls `onComplete(durationSec, perceivedExertion, stepsActualRef.current)`.

`perceived_exertion` feeds the consistency score resilience bonus (low PE = resilience).

### Wake Lock

```javascript
useEffect(() => {
  const activePhases = ["instruction", "working", "resting", "exerciseComplete"];
  if (!activePhases.includes(phase)) {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    return;
  }
  if (!("wakeLock" in navigator)) { setWakeLockDenied(true); return; }
  if (wakeLockRef.current) return;
  const acquire = () => {
    if (wakeLockRef.current) return;
    navigator.wakeLock.request("screen").then(lock => {
      wakeLockRef.current = lock;
      lock.addEventListener("release", () => { wakeLockRef.current = null; });
    }).catch(() => setWakeLockDenied(true));
  };
  acquire();
  const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  };
}, [phase]);
```

Fallback: amber banner shown below header when `wakeLockDenied === true` and phase is active.

### Pregnancy/postnatal adaptations

```javascript
const bodyMode = cycle?.mode ?? "standard";
const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
```

| Feature | Implementation |
|---|---|
| Rest +15s | `getRestDuration` adds 15 to base for `isPregnancyMode` |
| Breathing reminder | Amber card in resting phase, 3s auto-dismiss via `breathingTimerRef` |
| Breathing message | "Take a breath — inhale through nose, sigh out through mouth." |
| First instruction card | `pregnancy_note` (amber) for pregnant; `postnatal_note` (rose) for postnatal |
| Pelvic floor card | Rose card appended for postnatal + `pelvic_floor` tag |
| Softer language | "This doesn't feel right" instead of "Show alternatives" |

### Rich actual_json tracking (`stepsActualRef`)

Initialised from `plan.steps` at mount:

```javascript
const stepsActualRef = useRef(
  exercises.map(ex => ({
    exercise_id: ex.exercise_id,
    prescribed: { sets: ex.sets, reps: ex.target_reps, duration_sec: ex.target_duration_sec, rest_sec: ex.rest_sec },
    actual: {
      sets_completed: 0,
      reps_per_set: [],           // actual reps or seconds per set
      rest_taken_seconds: [],     // wall-clock rest elapsed per rest period
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

Write points:

| Event | Written to |
|---|---|
| Rep tapped / set done | `reps_per_set.push(reps)`, `sets_completed += 1` |
| Set done with adjustment | `target_adjusted`, `target_original`, `target_final`, `adjustment_direction` |
| Last set done | `completed_at_ms = Date.now()` |
| Rest starts | `restStartedAtRef.current = Date.now()` |
| Rest ends naturally or skipped | `rest_taken_seconds.push(Math.round((Date.now() - restStartedAtRef.current) / 1000))` |
| Alternative chosen | Full `actual` object replaced: `exercise_substituted: true`, `original_exercise_id`, `substitute_exercise_id` |
| Timer ends naturally | `handleSetDone(timerTotalRef.current)` |
| Done early (timer) | `handleSetDone(totalDur - timerRemaining)` — records actual seconds |

### CSS keyframes

```css
@keyframes tapScale { 0% { transform: scale(1) } 40% { transform: scale(0.96) } 100% { transform: scale(1) } }
@keyframes tapRing  { 0% { opacity: 0.7; transform: scale(1) } 100% { opacity: 0; transform: scale(1.18) } }
@keyframes pulse    { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
```

### Font sizes and touch targets

- Exercise name: 32px weight 900
- Instruction text: 18px weight 700, line-height 1.6
- Cue text: 13px italic, muted, prefixed with 💡
- Rep counter: 64px weight 900
- Countdown timer: 84px weight 900, `fontVariantNumeric: "tabular-nums"`
- All action buttons: min 48px height
- Tap zone: min 280px height
- Bottom action bar: fixed bottom, padding-bottom 24px (safe area)

---

## Planner Engine (functions/api/plan.js)

Engine version: **v1.8.0** (sport-aware bias layer added in R560).

Signature: `runPlanner(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile, cycleContext, pregnancyContext)`
Returns: `{ date, slot_type, intensity, session_name, steps[], rule_trace[], pregnancy_week, trimester, postnatal_phase }`

`onRequestPost` fetches `cycle_profile` from D1 and builds `pregnancyContext` before calling `runPlanner`.

### `getDefaultRest(exercise, slotType)` helper

```javascript
function getDefaultRest(exercise, slotType) {
  const tags = JSON.parse(exercise?.tags_json || '[]');
  if (slotType === 'micro') return 20;
  if (tags.includes('pelvic_floor')) return 30;
  if (tags.includes('mobility')) return 20;
  if (tags.includes('cardio')) return 30;
  if (tags.includes('bodyweight')) return 45;
  return 60;
}
```

Returns `rest_sec` stored on each plan step. The client-side `getRestDuration()` in WorkoutView
adds +15s for pregnancy/postnatal on top of this.

### Each plan step object returned

```javascript
{
  exercise_id, exercise_slug, name, category,
  tags_json,            // raw JSON string from DB
  target_reps,          // null for time-based exercises
  target_duration_sec,  // null for rep-based exercises
  sets,
  rest_sec,             // from getDefaultRest()
  instructions_json,    // raw JSON string or null
  alternatives_json,    // raw JSON string or null
  gif_url,              // or null
}
```

### Standard cycle rules (only fire when mode = 'standard')
| Rule | Trigger | Effect |
|---|---|---|
| R510 | time_budget ≤10 or no_time | slot_type = 'micro' |
| R511 | sleep_hours ≤5 | intensity = 'low' |
| R512 | energy ≤3 (out of 10) | reps/duration × 0.6 |
| R513 | stress ≥7 (out of 10) | category = 'mobility' |
| R514 | pain_level ≥2 AND (scope=general OR unset) | slot_type = 'rest'; scope='specific' with named areas → R562–R565 instead |
| R562–R565 | injury_areas from checkin.pain_areas + prefs.chronic_injury_areas | R563: filter pool by loads_knee/loads_shoulder/loads_lower_back/loads_ankle; R564: supplement if pool<3; R565: add coaching note |
| R515 | no_clothing | filter: low_impact + no floor tag |
| R516 | no_gear or traveling | filter: equipment_required = ["none"] |
| R520–R525 | cycle phase signals | intensity/volume adjustments per phase |

### Pregnancy rules (mode = 'pregnant')
| Rule | Trigger | Effect |
|---|---|---|
| R530 | T3 | intensity cap = low; T1/T2 cap = moderate |
| R531 | week ≥ 16 | filter out `supine` exercises |
| R532 | always | filter out `high_impact` exercises |
| R533 | always | filter out `valsalva`, `inversion`, `crunch`; filter `prone` from T2 |
| R534 | T2+ | inject pelvic_floor exercise if none in session |
| R535 | nausea signal | override to micro + breathing/recovery pool |
| R536 | breathless signal (T3) | volumeMultiplier = 0.8 |
| R537 | past due date | add session_notes about postnatal transition |

### Postnatal rules (mode = 'postnatal')
| Rule | Trigger | Effect |
|---|---|---|
| R540 | phase-gated | immediate: pelvic_floor+breathing+recovery only; early: +mobility; rebuilding: bodyweight no crunch/high_impact; strengthening: +dumbbell; returning: no valsalva |
| R541 | immediate/early/rebuilding | inject pelvic_floor exercise if none in session |
| R542 | caesarean + rebuilding | filter out `prone` exercises |
| R543 | rebuilding | add diastasis recti check note to session_notes |
| R544 | running_today signal | add running clearance note to session_notes |

### Pregnancy/postnatal vocabulary overrides
- Pregnancy: "Today's movement", "Strong & supported", "Five minutes for you"
- Postnatal: "A gentle moment", "Rebuilding your foundation", "Today's recovery"

### Exercise filtering uses tags_json
Key tags: `no_floor`, `low_impact`, `quiet`, `high_impact`, `floor`, `loud`,
`bodyweight`, `dumbbell`, `strength`, `cardio`, `mobility`, `recovery`,
`pregnancy_safe`, `postnatal_safe`, `pelvic_floor`, `kegel`, `breathing`,
`supine`, `prone`, `crunch`, `valsalva`, `inversion`

---

## Ghost Counter (client-side only, no API)

Circadian formula, updates every 60s, range 8-92:
```javascript
const T = hours + minutes/60;
const morning = 40 * Math.sin((Math.PI * (T - 2)) / 12);
const evening = 35 * Math.sin((Math.PI * (T - 14)) / 12);
let raw = morning + evening + 25;
if (isWeekend) raw *= 0.8;
count = clamp(floor(raw + jitter(±3)), 8, 92);
```
Displayed as: "{X} sporters actief" with a pulsing green dot.

---

## Consistency Score Formula (functions/api/score.js)

Calculated server-side from executions table:
- Active days (last 7): `count(distinct date) × 10` → max 70
- Resilience bonus: `count(low perceived_exertion sessions) × 5` → max 20
- Continuity bonus: `streak ≥14 days → +5, ≥28 days → +10` → max 10
- Total capped at 100

---

## Current Build Status

| Feature | Status |
|---|---|
| D1 schema + migrations | ✅ Live (0001–0021) |
| Exercise library (290 exercises) | ✅ Seeded in D1 (migrations 0001–0010, 0020); taxonomy fixed in 0019 |
| Session templates (16 templates) | ✅ Seeded in D1 (migrations 0005, 0011) |
| Awards (12 awards in D1, 26 shown in Hall of Fame) | ✅ Seeded in D1; Hall of Fame evaluates all 26 client-side |
| Pages Functions API | ✅ Live at /api/* |
| Planner engine v1.8.0 (R510–R565) | ✅ Live — template-based, profile-aware, pregnancy/postnatal rules; equipment defaults to bodyweight when null; chair always-available; exercise ordering (core→indoor cardio→outdoor); sport-aware bias layer (R560); injury-aware filtering R562–R565 (knee/shoulder/lower_back/ankle) |
| /api/profile endpoint | ✅ Live — GET/POST user_preferences + cycle/pregnancy/postnatal context |
| Frontend wired to API | ✅ Live |
| Auth (login/signup) | ✅ Live — JWT, SHA-256, login.html, auth guard in App.jsx, JWT_SECRET from env |
| Welcome email on signup | ✅ Live — Resend, fire-and-forget, RESEND_API_KEY in Pages env |
| Forgot password / reset flow | ✅ Live — DB-backed single-use token, 1hr expiry, reset-password.html |
| Magic link login | ✅ Live — DB-backed single-use token, 15min expiry, magic.html verify page |
| Passkey / Face ID login | ✅ Live — WebAuthn ES256, discoverable creds, replay protection via counter |
| Sign Out button in Settings | ✅ Live |
| execution_steps D1 batch insert | ✅ Fixed — no more 500s |
| EU liability waiver modal | ✅ Removed from startup — waiver text lives in the onboarding flow; no longer a separate gate |
| Onboarding flow | ✅ Live — 2-scenario model: full onboarding on first use OR ≥90 days inactive (server-side last_activity_at_ms); daily check-in otherwise; "Re-do onboarding" button in Settings below BMI card |
| Weekly plan view (7-day) | ✅ Live — Plan tab in nav, shows session strip + completed sessions |
| Landing page (marketing) | ✅ Live — public/index.html, dark design, features, rules, privacy |
| PWA manifest | ✅ Live — manifest.json, theme-color, apple-mobile-web-app tags |
| Pregnancy mode | ✅ Live — setup in Settings, planner rules R530–R537, progress banner, check-in signals |
| Postnatal mode | ✅ Live — phase detection, planner rules R540–R544, phase banner, check-in signals |
| Workout execution coaching UX | ✅ Live — phase state machine, instruction cards, rep tap zone, rest timer, difficulty override, alternatives, perceived exertion, Wake Lock, rich actual_json, pregnancy/postnatal adaptations |
| Profile settings in Settings | ✅ Live — display name, sex, weight (kg/lbs), cycle tracking, pregnancy/postnatal status, redo onboarding |
| Delete workout from history | ✅ Live — trash icon on each row, confirmation modal (type DELETE), onRequestDelete in execution.js; deleting today's only session resets todayCompleted + bonusDone state and localStorage |
| Bonus session intensity cap | ✅ Live — bonus_session flag in plan.js, micro ≤15min, moderate cap >15min, saved as session_type=bonus; bonus plans are returned in-memory (not saved to day_plans) to avoid unique(user_id,date) constraint |
| Pregnancy mode setup | ✅ Live — setup steps (medical clearance + due date) now render inline in Profile section when user clicks "Enable pregnancy mode →"; advisory mentions 9-month pregnancy + 3-month postnatal period; removed always-visible "Expecting?" card |
| "All reps done" shortcut button | ✅ Live — button below tap zone in rep-counting phase; calls handleSetDone(targetReps) to skip individual tapping and proceed directly to rest timer |
| Responsive dashboard layout | ✅ Live — on screens < 600px: session card full-width first, compact horizontal score strip below; useNarrow hook with resize listener; desktop layout unchanged |
| Plan regeneration UPSERT fix | ✅ Fixed — ON CONFLICT(user_id, date) DO UPDATE replaces ON CONFLICT(id); regenerating plan after deleting today's workout no longer 500s |
| Session state reconciliation on load | ✅ Fixed — bidirectional: cleared if no executions for today; SET if another device completed the session (cross-device sync via history fetch on load) |
| Pregnancy/postnatal deactivate | ✅ Live — "Deactivate" button on the pregnancy/postnatal status row in Settings; immediately calls API to reset mode to standard + cycle tracking to off |
| Sex-change warning modal | ✅ Live — switching sex from Female to Male/Non-binary while pregnancy or smart cycle tracking is active shows a confirmation modal listing what will be deactivated; confirms before wiping settings |
| Weight unit toggle button | ✅ Fixed — kg/lbs selector is now a single tap-to-toggle button (was two buttons that overflowed the container on mobile); applied in Settings, ProfileEditor, and Onboarding |
| Plan without check-in | ✅ Live — Skip button generates plan from settings (null checkin); on load, loads stored plan from D1 or auto-generates if none exists; manual mode never shows check-in prompt |
| Equipment selector (machines) | ✅ Live — treadmill, stationary bike, indoor bike, rowing machine added to EQUIPMENT_OPTIONS; null equipment defaults to bodyweight-only in R516 |
| Goal SVG icons | ✅ Live — 6 outlined polygon icons (health=cross, strength=arrow, fat_loss=flame, muscle=dumbbell, endurance=chevrons, mobility=figure); positioned at 2/3 from left / 1/3 from top; used in goal picker + Dashboard + Settings |
| Injury-aware filtering | ✅ Live — R562–R565: check-in pain scope (general→rest, specific+areas→filter); chronic_injury_areas in preferences_json; loads_knee/shoulder/lower_back/ankle tags on ~182 exercises (migration 0021) |
| Progression tab | ✅ Live — full feature: scoring engine (diminishing-return gains + exponential decay per mode), 6-axis body profile (Push/Pull/Legs/Core/Cardio/Mobility), custom SVG hexagonal radar chart, goal fit ring, key insights (strongest/weakest/biggest gap), axis breakdown bars, planner explanation, chart mode tabs (Power/Endurance/Balanced/Mobility), goal target compare overlay, rebuild-from-history debug button; DB: migration 0014 (user_progression + user_progression_events); API: /api/progression (GET + POST + POST?action=recompute); progression updated on every workout completion in execution.js; planner R550-R560 rules for weak-axis bias + mobility maintenance |
| Sport preferences in Settings | ✅ Live — "Endurance Sports" section: Running/Cycling/Rowing/Swimming/Walking/Mixed Cardio toggles + primary sport selector; stored in preferences_json.sport_prefs via /api/progression POST |
| Planner R550–R560 | ✅ Live — progression-aware rules: R550 profile load, R551 weak-axis compensation (reorders pool), R552 mode-aware note, R553 mobility decay maintenance, R554 explainability in rule_trace, R560 sport-aware bias layer (SPORT_DEMAND × weighted vector → ±12pt target nudge; guardrail halves legs/cardio bias within 24h of a run/ride; bypassed when sport coach prescribes the session) |
| Safe running build-up (Option A) | ✅ Live — R555 rule replaces generic long-run exercises with level-appropriate run/walk intervals when running_shoes in equipment; 6 levels driven by conditioning.endurance score (migration 0015); walk recovery encoded as custom_rest_sec so rest timer = walk; fixed_sets prescribes interval count; automatic decay from skipped sessions reduces level safely |
| Running Coach Program (Option B) | ✅ Live — R556 rule; structured 5/10/15/20/30km targets (unlocked sequentially); 3 sessions/week Mon/Wed/Fri; warm-up exercises prepended on run days; session named "Running Day · Week N"; run_coach state in preferences_json; advanceRunCoach in execution.js advances week/session counters; 15 continuous run levels 7–21 (20min–180min) + 4 warm-up exercises in migration 0016; enrollment UI in Settings |
| API security hardening | ✅ Done — JWT HMAC-SHA256 verification inlined in all endpoints (profile.js, progression.js, plan.js, checkin.js, execution.js, score.js, cycle.js); IDOR fallbacks removed (all user-bound endpoints return 401 without valid JWT); execution DELETE verifies ownership before deleting steps; daily_checkins UNIQUE(user_id, date) index + atomic ON CONFLICT upsert (migration 0018); dead gesture handler state/code removed from WorkoutView |
| Offline / IndexedDB sync | ⬜ Not started |
| Pro tier gating | ⬜ Not started |
| Stripe integration | ⬜ Not started |

---

| Accent colour picker | ✅ Live — 11 colours (Emerald/Violet/Sky/Rose/Amber/Indigo/Lime/Cyan/Orange/Fuchsia/Coral); CSS custom properties (--accent, --accent-rgb, --accent-dim, --accent-border) on :root; stored in D1 + localStorage jf_accent; applied before first render; Appearance section at top of Settings |

## Known Bugs to Fix

None currently. 🟢

---

## Product TODO List

Improvements identified but not yet built. Ordered roughly by impact.

### Workout UX
- **Level-appropriate cues** — Cues prefixed with `💡💡` in the DB indicate level-specific advice (Beginner / Intermediate / Advanced). In WorkoutView, filter cues by `experience_level` from prefs: show only the matching level's `💡💡` cues plus all single-`💡` cues. Requires a prefix convention in the data.
- **"Why" + training target section** — Add a `why` field and a `muscle_target` / `cardio_target` field to `instructions_json` per exercise. Show in the instruction phase below the step cards. For now can be derived from `category` + `tags_json` without DB changes (e.g. strength + "core" tag → "Targets: Core & Stability").
- **Minimum 3 instruction steps** — Exercises with fewer than 3 instruction steps feel sparse. Either enrich the DB data, or auto-generate a fallback ("Focus on form", "Quality > speed", "You've got this") if `rawSteps.length < 3`.
- **BMI-aware pace guidance** — For cardio exercises, when user is in the obese BMI range, show lower pace ranges or a dedicated slow-build-up note. Could be a posture-like `bmi_note` field in `instructions_json`, or a rule in WorkoutView that replaces the standard cues.
- **Images in instruction cards** — Future: show exercise GIF/image alongside the step text. `gif_url` already exists on plan steps; just needs a collapsible image area in the instruction card.

### After Session
- **Log activity flow after session** — On the session complete card, the "Log activity" button logs a manual activity. Consider also showing extra-time input there so the user can immediately get a bonus plan suggestion without having to tap "Bonus session" separately.

### Running Coach — Future Enhancements
- **Regression on skips**: If >7 days since last run while enrolled, regress 1 week. Prevents users from re-starting week 8 after a 3-week break. Not yet implemented — the decay in conditioning.endurance score already partially handles this via R555.
- **Milestone awards**: Complete a target distance → unlock a hall-of-fame award. Needs a migration to add 5 running awards.
- **Program progress in Progress tab**: Show run program current week/level on the Progression screen alongside body scores.

### Women's Health — v2 Roadmap
- **R526 — Perimenopause phase** *(explicitly out of scope for v1)*: The current cycle rules (R520–R525) assume standard menstruation. Perimenopause involves irregular cycles and hormone fluctuations without pregnancy. A future R526 could detect `cycle_profile.mode = 'perimenopause'` and adapt: longer recovery windows, lower stress threshold (T.STRESS_PERIMENOPAUSE), reduced intensity defaults, and exercise bias toward mobility and low-impact strength rather than HIIT. Would require a new `mode` value in the `cycle_profile` table and a Settings toggle alongside the existing pregnancy/postnatal setup.

### Data Quality
- **Enrich exercise instruction steps** — Several exercises (especially short bodyweight ones) have only 1–2 steps. Target minimum 3 concise steps + 2 cues for every exercise.
- **Add `why` and `muscle_target` to all exercises** — New fields in `instructions_json`. Could be seeded via a migration script.

---

## Coding Conventions

- **Functions**: plain JS (`.js`), no TypeScript, no bundler, no imports from npm
- **Frontend**: React functional components, all styles inline using `C.` design tokens; UI stays in `App.jsx`, pure JS modules (no JSX, no UI state) may live in `src/`
- **DB timestamps**: always milliseconds (`Date.now()`), column suffix `_at_ms`
- **DB IDs**: always `crypto.randomUUID()`
- **Error responses**: always `Response.json({ error: e.message }, { status: 500 })`
- **Commits**: conventional format `feat:`, `fix:`, `chore:`, `refactor:`
- **Deploy**: `git push` only — never use `wrangler pages deploy` manually
- **Timers in React**: use `setTimeout` (not `setInterval`) inside `useEffect` with the changing value in the deps array — this avoids stale closures. Pattern: `const id = setTimeout(cb, 1000); return () => clearTimeout(id);`
- **Refs vs state for tracking**: mutable data that doesn't need to trigger re-renders (e.g. `stepsActualRef`, `restStartedAtRef`) goes in `useRef`. UI state goes in `useState`.
- **Functional setState for counters**: use `setCurrentSet(s => s + 1)` not `setCurrentSet(currentSet + 1)` inside effects/callbacks to avoid stale closure issues.

---

## Spec Reference

The full product spec is v1.5.0 (Golden Master Design). Key decisions:
- Base users: weekly plan, daily check-in affects today only
- Pro users: daily adaptive replanning, gentle refresh, AI advisory text input
- No social features, no leaderboards, no medical advice
- Ghost Partner is simulated (formula), not real-time (until Durable Objects added)
- Privacy-first: email stored separately from fitness data, support via time-limited tokens
- EU liability notice included in onboarding modal (not a separate gate)
- Exercise library: 290 exercises in D1
- Planner is a pure function — never writes to DB directly

---

## Useful Commands

```bash
# Query D1 remotely
npx wrangler d1 execute justfit-db --remote --command "SELECT ..."

# Apply a migration
npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql

# Check tables
npx wrangler d1 execute justfit-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Deploy (just push)
git add . && git commit -m "feat: ..." && git push

# Check recent executions
npx wrangler d1 execute justfit-db --remote --command "SELECT id, user_id, date, perceived_exertion, total_duration_sec FROM executions ORDER BY created_at_ms DESC LIMIT 10;"

# Check execution_steps actual_json for a given execution
npx wrangler d1 execute justfit-db --remote --command "SELECT step_index, exercise_id, actual_json FROM execution_steps WHERE execution_id='<id>';"

# Check users
npx wrangler d1 execute justfit-db --remote --command "SELECT id, primary_email, status, created_at_ms FROM users ORDER BY created_at_ms DESC LIMIT 10;"

# Check exercises with instructions
npx wrangler d1 execute justfit-db --remote --command "SELECT slug, name, instructions_json FROM exercises WHERE instructions_json IS NOT NULL LIMIT 5;"
```
