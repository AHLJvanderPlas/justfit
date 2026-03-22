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
| Frontend | React + Vite, single `src/App.jsx`, no router library |
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
│   ├── main.jsx         ← renders App, imports index.css
│   └── index.css        ← empty (all styles are inline in App.jsx)
├── functions/
│   └── api/
│       ├── auth.js      ← POST signup/login/forgot/reset/magic/passkey, GET magic verify + token verify
│       ├── checkin.js   ← POST save check-in, GET fetch check-ins
│       ├── exercises.js ← GET exercises from D1 with tag filtering
│       ├── execution.js ← POST save workout, GET fetch history
│       ├── plan.js      ← POST generate plan (runs planner engine v1.6.0), GET fetch plan
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
│   └── 0011_pregnancy_templates.sql ← 8 pregnancy/postnatal session templates (total: 16)
├── WORKOUT_EXECUTION_UX.md  ← full coaching interface spec (all 10 steps implemented)
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
                   traveling, pain_level, free_text, motivation, time_budget),
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
- `awards` — Hall of Fame, 6 awards shown
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

`WorkoutView` is a full-screen fixed overlay rendered when `inWorkout === true`.

```javascript
function WorkoutView({ plan, onComplete, onBack, cycle })
```

### Phase state machine

```
"instruction" → "working" → "resting" → (loop per set)
                                       ↓ (after last set)
                              "exerciseComplete" → (auto-advance 2s)
                                                 ↓ (after last exercise)
                              "sessionFeedback"  → onComplete(...)
```

Special:
- `"restDay"` — when `plan.slot_type === 'rest'` or no exercises
- Exercise overrides: `const cur = exerciseOverrides[exIdx] ?? exercises[exIdx]`

### Key state variables in WorkoutView

See `WORKOUT_EXECUTION_UX.md` section 11 for full list. Key ones:

```javascript
const [phase, setPhase] = useState("instruction" | "working" | "resting" | "exerciseComplete" | "sessionFeedback" | "restDay");
const [exerciseOverrides, setExerciseOverrides] = useState({}); // {[exIdx]: replacementExercise}
const stepsActualRef = useRef([...]);  // rich actual_json per exercise, not state
const restStartedAtRef = useRef(0);   // Date.now() when rest began, for rest_taken_seconds
const timerTotalRef = useRef(0);      // total timer duration when Start pressed
```

### Pregnancy/postnatal flag

```javascript
const bodyMode = cycle?.mode ?? "standard";
const isPregnancyMode = bodyMode === "pregnant" || bodyMode === "postnatal";
```

`isPregnancyMode` drives:
- Rest +15s (`getRestDuration` adds 15 to base)
- Breathing reminder after each set (amber card, 3s auto-dismiss)
- `pregnancy_note`/`postnatal_note` as first instruction card (amber/rose accent)
- Pelvic floor coaching card for postnatal + `pelvic_floor` tag exercises
- "This doesn't feel right" instead of "Show alternatives" on action bar

### Wake Lock

Acquired on active phases (`instruction`, `working`, `resting`, `exerciseComplete`),
re-acquired on `visibilitychange`, released on inactive phases and unmount.
Falls back to amber banner when `navigator.wakeLock` unavailable.

### Instruction card accent system

Cards are objects `{ text: string, accent: null | "amber" | "rose" }`.
- `pregnancy_note` → amber, prepended as first card (pregnant users)
- `postnatal_note` → rose, prepended as first card (postnatal users)
- Pelvic floor coaching → rose, appended as last card (postnatal users)
- Standard steps → no accent

---

## Planner Engine (functions/api/plan.js)

Engine version: **v1.6.0** (pregnancy/postnatal support added).

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
| R514 | pain_level ≥2 | slot_type = 'rest' |
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
| D1 schema + migrations | ✅ Live (0001–0011) |
| Exercise library (~150 exercises) | ✅ Seeded in D1 (migrations 0001–0010) |
| Session templates (16 templates) | ✅ Seeded in D1 (migrations 0005, 0011) |
| Awards (12 awards) | ✅ Seeded in D1 |
| Pages Functions API | ✅ Live at /api/* |
| Planner engine v1.6.0 (R510–R544) | ✅ Live — template-based, profile-aware, pregnancy/postnatal rules |
| /api/profile endpoint | ✅ Live — GET/POST user_preferences + cycle/pregnancy/postnatal context |
| Frontend wired to API | ✅ Live |
| Auth (login/signup) | ✅ Live — JWT, SHA-256, login.html, auth guard in App.jsx, JWT_SECRET from env |
| Welcome email on signup | ✅ Live — Resend, fire-and-forget, RESEND_API_KEY in Pages env |
| Forgot password / reset flow | ✅ Live — DB-backed single-use token, 1hr expiry, reset-password.html |
| Magic link login | ✅ Live — DB-backed single-use token, 15min expiry, magic.html verify page |
| Passkey / Face ID login | ✅ Live — WebAuthn ES256, discoverable creds, replay protection via counter |
| Sign Out button in Settings | ✅ Live |
| execution_steps D1 batch insert | ✅ Fixed — no more 500s |
| EU liability waiver modal | ✅ Live — shown on first use, accepted stored in localStorage |
| Onboarding flow | ✅ Live — 3-step (goal, experience, equipment/duration), saves to /api/profile |
| Weekly plan view (7-day) | ✅ Live — Plan tab in nav, shows session strip + completed sessions |
| Landing page (marketing) | ✅ Live — public/index.html, dark design, features, rules, privacy |
| PWA manifest | ✅ Live — manifest.json, theme-color, apple-mobile-web-app tags |
| Pregnancy mode | ✅ Live — setup in Settings, planner rules R530–R537, progress banner, check-in signals |
| Postnatal mode | ✅ Live — phase detection, planner rules R540–R544, phase banner, check-in signals |
| Workout execution coaching UX | ✅ Live — phase state machine, instruction cards, rep tap zone, rest timer, difficulty override, alternatives, perceived exertion, Wake Lock, rich actual_json, pregnancy/postnatal adaptations |
| Offline / IndexedDB sync | ⬜ Not started |
| Pro tier gating | ⬜ Not started |
| Stripe integration | ⬜ Not started |

---

## Known Bugs to Fix

None currently. 🟢

---

## Coding Conventions

- **Functions**: plain JS (`.js`), no TypeScript, no bundler, no imports from npm
- **Frontend**: React functional components, all styles inline using `C.` design tokens
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
- EU liability waiver required on first signup
- Target exercise library: ~150 exercises
- Planner is a pure function — never writes to DB directly

The coaching execution UX spec is in `WORKOUT_EXECUTION_UX.md`.

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
