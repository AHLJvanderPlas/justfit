# Standing Instructions — Always Follow

These rules apply to EVERY task in EVERY session, without exception.

## After every change
- Run `npm run smoke` first — lint + build + live API checks; must pass before pushing
- Then commit and push (source backup): `git add . && git commit -m "..." && git push`
- Then deploy: `npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main`
- **After deploy**: update the "Current Build Status" table in `CLAUDE.md` and `README.md` to reflect the change — never leave docs stale after a deployment
- Never leave uncommitted changes
- Commit messages must follow conventional format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`

## Deploy workflow (GitHub auto-deploy suspended)
- Git push = source backup only (GitHub auto-deploy to Cloudflare Pages is suspended)
- Canonical flow: `npm run smoke` → `git push` → `npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main`
- Wrangler must be logged in to `ahljvanderplas@gmail.com` (account: JustFit.cc, ID: ce96b957f7de20cc5d388eba856fa8dc)
- Check with: `npx wrangler whoami` — if wrong account, run `npx wrangler logout` then `npx wrangler login`
- D1 migrations: `npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql`

## After every session
- Update `CLAUDE.md` to reflect any new features built, bugs fixed, or status changes
- Update `README.md` with any new setup steps, environment variables, or architectural changes
- Update the "Current Build Status" table in `CLAUDE.md` — mark completed items ✅, new items ⬜

## Multi-step assignments
When an assignment has multiple steps:
- Work through them **one item at a time**: code → smoke → deploy → confirm → next step. Never batch steps into a single deploy.
- Track progress with a todo list (TodoWrite tool); mark each item complete immediately after deploy confirms.
- **After each step**: print the current todo list showing all items with their status (✅ done / 🔄 in progress / ⬜ pending). Do this before starting the next step so the user always sees where things stand.
- If the user gives a new task during a build, add it to the list (or adjust the existing item) rather than interrupting the current step
- For each task, pick the most cost-effective model:
  - **Haiku** — simple edits, HTML/CSS tweaks, one-line fixes, renaming, copy changes
  - **Sonnet** — standard feature work, bug fixes, API endpoints, React components
  - **Opus** — complex architectural decisions, multi-file refactors, planner engine logic, security review

## Response style & token budget
Keep all responses short. The user reads results, not reasoning.

- **During a build**: one line per action (e.g. "Smoke passed. Deploying…"). No reasoning narration.
- **After deploy**: one confirmation line + the live URL. No recap of what changed — the commit message covers that.
- **No preambles**: never describe what you are *about to do*. Just do it.
- **No summaries**: do not restate completed steps at the end of a response.
- **Tool output**: do not quote file contents back after reading or editing.
- **Errors only**: only explain reasoning when something fails or a decision needs user input.
- **Code comments**: only where logic is non-obvious. No docstrings, no type annotation prose.

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
- Typography: Barlow Condensed (display), Inter Tight (body), JetBrains Mono (data). Loaded via Google Fonts. Use the `display()`, `eyebrow`, `mono()` helpers in `App.jsx` instead of writing inline font-family strings.
- font-weight 900 for display headings, 700 for labels, 500 for body

## Testing before push
- Run `npm run build` locally and confirm it succeeds before pushing
- Check the browser console for errors after deploy
- Verify the specific feature works end-to-end before moving to next task

---

# JustFit.cc — Claude Code Project Context

## What this project is
**JustFit is a trustworthy daily training coach that adapts to real life so users can stay consistent.**

JustFit.cc is a privacy-first, consistency-driven fitness PWA built on a deterministic rule-based planner.
It is not a social app, not a medical app, and does not use free-form AI to control plans.

Live URL: https://justfit.cc (also justfit.pages.dev)
GitHub: https://github.com/AHLJvanderPlas/justfit

---

## Product Vision
Make adaptive, trustworthy personal coaching available every day, without requiring perfect motivation, perfect health, or perfect circumstances.

## Product Mission
Help people stay consistently active by turning real-life constraints into safe, clear, daily training decisions.

---

## Product Principles

These seven principles are the decision framework. When a feature, rule, or design choice is unclear, the right answer is the one most consistent with these principles.

1. **Consistency beats intensity** — A completed session is better than a perfect session that gets skipped.
2. **Real life outranks plan purity** — Sleep, stress, pain, travel, schedule, pregnancy, postnatal state, and recovery signals may immediately change the session.
3. **Safety beats ambition** — The system must prefer safe downgrades over risky progression.
4. **The planner must be explainable** — Meaningful plan changes should be traceable to understandable rules.
5. **One active training intent at a time** — The engine may consider many signals, but it must always know the single primary thing it is optimising for today.
6. **Privacy is part of the product** — Data minimisation, explicit consent, clear storage boundaries, and user control are core product behaviour, not just legal text.
7. **During training, speed wins** — Workout interactions should be one-thumb, glanceable, and usable in about 2 seconds.

---

## Product Boundaries

**JustFit is:**
- a privacy-first adaptive daily training coach
- a deterministic rule-based planner
- a practical execution coach during workouts
- a consistency tool, not just a workout generator

**JustFit is not:**
- a social fitness network
- a medical device or medical advisor
- a black-box AI coach
- a "max performance at any cost" app
- a feature-heavy platform where every mode competes equally

---

## Product Roadmap Priorities

Primary items — directly support the core principles.

1. ~~**Return-to-training mode**~~ ✅ Done — R558: ≥14-day gap → volume ×0.75 re-ramp. *(Principle 2 + 3)*
2. **Primary-intent conflict hierarchy** — Define which goal/programme wins when general goals, sport bias, military/running/cycling coaches, injury rules, and body-aware states collide. *(Principle 5)*
3. ~~**Recovery mode**~~ ✅ Done — R559: "Taking it easy today" check-in toggle → low intensity + mobility/recovery pool. *(Principle 2 + 3)*
4. ~~**Self-service data export**~~ ✅ Done — "Download my data (JSON)" in Settings (F1). *(Principle 6)*
5. **Weekly outcome summary** — Show whether the user is actually moving toward their goal, not just completing daily sessions. *(Principle 1 + 4)*

## Secondary Roadmap Ideas

- Program readiness / baseline assessment
- User-facing adaptation memory (visible log of why the plan changed)
- Better offline / weak-network workout resilience

---

## Product Drift Risk

The main risk for JustFit is not missing features — it is adding too many modes and specialties without preserving:

- **One primary intent** per session (Principle 5)
- **One clear safety hierarchy** (Principle 3)
- **One explainability model** (Principle 4)
- **One trust model** — privacy-first, honest about what the system does and does not know (Principle 6)

Each new coach, programme, or mode must be evaluated against these four constraints before being added. Complexity that cannot be explained to the user is complexity that should not exist.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite; app shell/state orchestration in `src/App.jsx`; Settings and Awards split into lazy-loaded view modules (`src/SettingsView.jsx`, `src/AwardsView.jsx`); non-React modules in `src/` (`apiClient.js`, `messagePolicy.js`, `errorReporter.js`); no router library |
| Hosting | Cloudflare Pages (manual deploy via Wrangler; GitHub push is source backup only) |
| API | Cloudflare Pages Functions in `/functions/api/` (plain JS, no bundler, no npm) |
| Database | Cloudflare D1 (SQLite) bound as `DB` |
| Auth | JWT via Web Crypto API (no external libs) |
| CI/CD | Manual release flow (`npm run smoke` → push → `wrangler pages deploy`) |

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
│   ├── App.jsx          ← app shell, view orchestration, primary workout/dashboard logic
│   ├── SettingsView.jsx ← Settings tab (lazy-loaded)
│   ├── AwardsView.jsx   ← Hall of Fame component (lazy-loaded via React.lazy to reduce initial bundle)
│   ├── main.jsx         ← renders App (no CSS import — all styles inline in App.jsx)
│   ├── apiClient.js     ← all API calls (fetch wrappers, error code attachment)
│   ├── errorReporter.js ← fire-and-forget client error reporting (plan_generation, auth_failure); dedupes per session
│   └── messagePolicy.js ← message severity policy: RULE_POLICY, RULE_LABELS, parseRuleTrace(), hasBlockingSafety(), deriveChipLabel()
├── functions/
│   └── api/
│       ├── accept-terms.js ← POST records explicit versioned legal acceptance
│       ├── auth.js      ← POST signup/login/forgot/reset/magic/passkey, GET magic verify + token verify; rate limiting via auth_rate_limits table
│       ├── checkin.js   ← POST save check-in, GET fetch check-ins
│       ├── cycle.js     ← POST cycle period logging helper
│       ├── dashboard.js ← GET admin dashboard data (registered users + events), protected by DASHBOARD_PASSWORD/ADMIN_KEY
│       ├── feedback.js  ← POST client error/feedback intake
│       ├── exercises.js ← GET exercises from D1 with tag filtering
│       ├── execution.js ← POST save workout, GET fetch history
│       ├── legal-email.js ← POST sends full legal docs by email (5 document IDs)
│       ├── plan.js      ← POST generate plan (runs planner engine v1.8.0), GET fetch plan
│       ├── profile.js   ← GET/POST user_preferences + cycle/pregnancy/postnatal context
│       ├── progression.js ← GET/POST progression model + sport preferences
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
│   ├── 0002_seed.sql        ← awards seed data
│   ├── 0003_cleanup.sql     ← FK fixes
│   ├── 0004_exercises.sql   ← 35 new exercises (total: 50)
│   ├── 0005_templates.sql   ← 8 session templates
│   ├── 0006_passkeys.sql    ← passkey_credentials table
│   ├── 0007_auth_tokens.sql ← password_reset_tokens + magic_link_tokens tables; counter/backed_up/transports on passkey_credentials
│   ├── 0008_body_aware.sql  ← cycle_profile table (standard cycle tracking: tracking_mode, cycle_length_days, last_period_start)
│   ├── 0009_pregnancy.sql   ← extends cycle_profile with pregnancy/postnatal columns; adds pregnancy_weekly_log table
│   ├── 0010_exercise_library.sql ← 100 new exercises (total: ~150); adds equipment_advised_json column; updates tags on existing exercises
│   ├── 0011_pregnancy_templates.sql ← 8 pregnancy/postnatal session templates (total: 16)
│   ├── 0012_conditioning_exercises.sql ← conditioning exercises
│   ├── 0031_session_phase_exercises.sql ← easy-jog-warmup (7 min) + cooldown-walk (5 min) session-phase exercises; updates Cooper test instructions
│   ├── 0013_height.sql        ← height_cm column on user_profile
│   ├── 0014_progression.sql   ← user_progression + user_progression_events tables
│   ├── 0015_run_intervals.sql ← 6 run/walk interval exercises (levels 1–6) for R555 safe running
│   ├── 0016_run_program.sql   ← 4 run warm-up exercises + 15 continuous run levels (7–21) for R556 Running Coach
│   ├── 0017_polarised_training.sql ← polarised training flag in preferences
│   ├── 0018_checkin_unique.sql ← UNIQUE(user_id, date) index on daily_checkins (dedupes, enables atomic upsert)
│   ├── 0019_email_verification.sql ← email verification + change-email token support
│   ├── 0027_taxonomy_fix.sql   ← equipment taxonomy fix: cycling-intervals-indoor + stationary-bike-steady now include both indoor_bike and exercise_bike
│   ├── 0020_exercise_library_v3.sql ← 100 new exercises (total: 290); sections: dumbbell(15), bands/kettlebell/pullup/bw(26), mobility(15), recovery(12), cardio(12), equipment-conditional(20)
│   ├── 0021_injury_tags.sql ← adds loads_knee/loads_shoulder/loads_lower_back/loads_ankle tags to ~182 exercises for R562–R563 injury filtering
│   ├── 0022_rate_limits.sql ← auth_rate_limits table (sliding-window counters for login/reset/verify rate limiting)
│   ├── 0023_acceptance.sql  ← explicit terms/privacy acceptance version tracking
│   └── 0024_app_events.sql  ← app_events table for dashboard event/error timeline
├── wrangler.toml
├── vite.config.js
└── package.json
```

Migration naming policy: migration files must use unique, monotonic prefixes. Next valid number is `0032+`; never reuse a number.

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
                   traveling, recovery_mode, pain_level, pain_scope, pain_areas,
                   free_text, motivation, time_budget, pregnancy_signals, postnatal_signals),
-- Note: UI exposes a 3-state SVG smiley ("feeling": 1/2/3) that maps to stress+motivation at
-- submit time. The `feeling` field is not stored; stress and motivation in DB are derived values.
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

**exercises** — ~150 exercises seeded (migrations 0002–0010)
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

**cycle_profile** — body mode and cycle tracking per user (migrations 0008_body_aware + 0009)
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

React app, all styles inline (no Tailwind, no CSS modules). `App.jsx` is the shell and orchestration layer; Settings and Awards are split into lazy-loaded view boundaries (`SettingsView.jsx`, `AwardsView.jsx`); pure non-React modules live in `src/` alongside.

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

### Military rules (mode = 'military', prefs.military_coach enabled)
| Rule | Trigger | Effect |
|---|---|---|
| R570 | military_coach enrolled | Load `mil_mode`, `mil_level`, `mil_track`, `mil_target_date`, `cluster_current` from preferences_json |
| R571 | always | Rolling block scheduler: session type from `BLOCK_SEQUENCES[milGroup][block_session_index]`; rest earned after SESSIONS_PER_BLOCK; no calendar/weekday dependency |
| R572 | always | Select exercise pool filtered by `military` tag; volume from 6-block periodization cycle via `BLOCK_VOLUMES[cyclePosn-1]` |
| R573 | mode = 'target' | Taper logic: ≤14 days out → vol cap 0.75; ≤7 days → vol cap 0.60 |
| R574 | all modes | Check-in override: recovery_mode/general pain → rest; energy≤3 → downgrade; sleep≤5 → vol×0.85 |
| R575 | always | Strength/circuit pool filtered to military-tagged exercises |
| R576 | RPE feedback (perceived_exertion) | Silent `cluster_current` drift: PE=3 → level up, PE=8 → level down (progressive overload) |
| R577 | run day | Prescribe run distance/time from current Keuring/Opleiding level table |
| R578 | strength day | Prescribe military strength circuit from current level |
| R579 | rest day | slot_type = 'rest', session_name = "Recovery" |
| R580 | post-session (run day) | Prompt Cooper test modal to capture distance for level progression |
| R581 | always | Bypass standard R510–R565 rules (military takes full control of session) |
| R582 | always | Set goal target profile on hexagon radar to military fitness vector |

**Tracks**: Keuring KB–K6 (fitness assessment, 7 levels: Basis + K1–K6, source: clusters 0–6), Opleiding O1–O6 (training program, 6 levels, source: clusters 1–6)
**Storage**: `preferences_json.military_coach` object — `{active, mode, track, cluster_current, cluster_target, target_date, pack_weights_available_kg, has_trail_shoes, enrolled_at_ms, last_cooper_distance_m}`
Note: `cluster_target` for open mode = track max (K6/O7). Legacy `pack_weight_max_kg` migrated to `pack_weights_available_kg: number[]` on next profile save.

### Pregnancy/postnatal vocabulary overrides
- Pregnancy: "Today's movement", "Strong & supported", "Five minutes for you"
- Postnatal: "A gentle moment", "Rebuilding your foundation", "Today's recovery"

### Exercise filtering uses tags_json
Key tags: `no_floor`, `low_impact`, `quiet`, `high_impact`, `floor`, `loud`,
`bodyweight`, `dumbbell`, `strength`, `cardio`, `mobility`, `recovery`,
`pregnancy_safe`, `postnatal_safe`, `pelvic_floor`, `kegel`, `breathing`,
`supine`, `prone`, `crunch`, `valsalva`, `inversion`, `military`

---

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
| D1 schema + migrations | ✅ Live (0002–0030) |
| Exercise library (306 exercises) | ✅ Seeded in D1 (migrations 0002–0010, 0020, 0029, 0030); taxonomy fixed in 0027; 0029 adds 16 military/gap-fill exercises; 0030 adds 'military' tag to 15 exercises for planner pool filtering |
| Session templates (16 templates) | ✅ Seeded in D1 (migrations 0005, 0011) |
| Awards (12 awards in D1, 26 shown in Hall of Fame) | ✅ Seeded in D1; Hall of Fame evaluates all 26 client-side |
| Pages Functions API | ✅ Live at /api/* |
| Planner engine v1.9.0 (R510–R582 + R558–R559) | ✅ Live — template-based, profile-aware, pregnancy/postnatal/military rules; equipment defaults to bodyweight when null; chair always-available; exercise ordering (core→indoor cardio→outdoor); sport-aware bias layer (R560); injury-aware filtering R562–R565 (knee/shoulder/lower_back/ankle); Military Coach R570–R582 (Keuring/Opleiding tracks, three modes, two-phase target, RPE drift, Cooper test); R558 return-to-training re-ramp (≥14-day gap → volume ×0.75); R559 recovery mode (toggle in check-in → low intensity + mobility/recovery pool) |
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
| Military Coach (4th trainer, Basic tier) | ✅ Live — Keuring (K1–K6) + Opleiding (O1–O7) tracks; three modes: target (assessment date), fit (goal level, no date), open (rolling); **rolling block scheduler** (no calendar dependency): 4 training sessions per block [Zone2→Strength→Intervals→Strength/March] then rest is earned; rest serves only after SESSIONS_PER_BLOCK completed, never on a fixed weekday; block_session_index + block_number stored in preferences_json; 6-block periodization cycle (vol 0.75→0.85→1.0→1.1→0.6→0.9); check-in signals partially bypass R581: recovery_mode/pain→rest, low energy→downgrade, poor sleep→vol×0.85; Cooper test at cycle start (block 1 of each 6-block cycle); open mode starts at K1 (not K3); R545/R546 BMI chip guarded by !isMilCoachActive; advanceMilitaryCoach fetches plan slot_type to detect rest day — training→blockIdx++, rest→new block starts; session names: "Block N" (not "Week N"); enrollment: block_session_index=0, block_number=1 preserved on re-enroll; RPE-based cluster_current drift; Cooper test post-session modal; military tag on 15 exercises; pack weight as `pack_weights_available_kg: number[]` |
| Security + correctness hardening (audit pass) | ✅ Live — login rate limit now increments on failure only (successful logins no longer consume quota); privacy acceptance fail-closed at signup (explicit version required, no silent default); planner fully deterministic (planDateMs replaces Date.now() in sport-bias guardrail and mobility-decay rule); run warm-up reps fixed to 10 (not goal-based); run + cycling coach mutual exclusion enforced server-side in profile.js; upcoming-plan cache key includes milActive + isPro |
| Military Progress Dashboard | ✅ Live — military sportMode detection (highest priority over running/cycling/general) in HistoryView; level ladder pip visualization (K1–K6 / O1–O7) with assessment countdown; fitness profile radar with military target vector; goal fit ring re-labelled "Military Fit"; open mode: shows "Next: Kn" (no named target), "Continuous progression" subtitle, no GOAL pin on ladder; Cooper test + march weight side-by-side metric cards with gap-to-next-level (amber "Xm to go" / emerald "achieved") and march readiness ("ready" / "Xkg short"); coach insight tip is mode-aware (open shows next milestone + Cooper target) |
| Data export — GDPR self-service (F1) | ✅ Live — "Download my data (JSON)" button in Settings; exports profile + progression + history as a portable JSON bundle; client-side Blob download; no server round-trip |
| Mission/Vision v1.1 (F2) | ✅ Live — mission.html and getMissionEmail() updated to reflect current Product Vision, Mission, and all 7 Product Principles; "What JustFit Is — and Is Not" section added; version bumped to v1.1 April 2026 |
| R558 Return-to-training re-ramp (F3) | ✅ Live — parallel D1 query for last execution date; ≥14-day gap → volumeMultiplier × 0.75; bypassed for military coach and pregnancy/postnatal; trace: "R558 — Back after N-day break → volume ×0.75" |
| R559 Recovery mode toggle (F4) | ✅ Live — "Taking it easy today" toggle in check-in modal; sets intensity=low, filters exercise pool to mobility/recovery only; bypassed for military and pregnancy/postnatal; stored in checkin_json.recovery_mode |
| AdaptationChip on PlanWeekView (F5) | ✅ Live — Today's Plan card in weekly view shows chip label (via deriveChipLabel) when a rule adaptation is active |
| Active coach badge on Dashboard (F6) | ✅ Live — persistent inline badge below greeting shows active coach label (Military · K3 / Running · 10km / Cycling · Week 4); renders only when a coach is active |
| Check-in simplification — SVG smiley row (F8) | ✅ Live — Motivation + Stress sliders replaced with 3-button SVG smiley row ("Not great" / "Okay" / "Good"); feeling maps to stress + motivation at submit time (sad→stress=10/motivation=2, neutral→stress=4/motivation=6, good→stress=2/motivation=10); DB schema and all planner rules (R511–R513) unchanged; pre-fill from last check-in derives feeling from stored stress/motivation |
| Offline / IndexedDB sync | ⬜ Not started |
| Pro tier gating | ⬜ Not started |
| Stripe integration | ⬜ Not started |

---

| Accent colour picker | ✅ Live — 11 colours (Emerald/Violet/Sky/Rose/Amber/Indigo/Lime/Cyan/Orange/Fuchsia/Coral); CSS custom properties (--accent, --accent-rgb, --accent-dim, --accent-border) on :root; stored in D1 + localStorage jf_accent; applied before first render; Appearance section at top of Settings |
| Messaging architecture | ✅ Live — `src/messagePolicy.js` centralises severity buckets (blocking_safety / adaptive_safety / progression_caution / account_security / validation_error / system_error); maps planner rule codes (R510–R565) to human-readable labels; `parseRuleTrace()`, `hasBlockingSafety()`, `deriveChipLabel()` helpers; BMI/adaptation warnings replaced with `AdaptationChip` (compact status pill) + `WhyPlanPanel` (collapsible "Why this plan?" panel with Safety / Training / Suggested action groups, auto-expands first view via `jf_whypanel_<plan_id>` in localStorage); `BlockingSafetyBanner` (role="alert") for clearance gates (R539); run coach ramp-up kept in Settings enrollment only (progression_caution style); standalone rule trace card removed (absorbed into WhyPlanPanel) |
| Production hardening | ✅ Live — 7-task hardening pass: (1) 0 react-hooks/exhaustive-deps warnings (useMemo, stable refs, isProRef); (2) DB-backed rate limiting (migration 0022) for login/reset/verify — 429 on abuse; (3) All API 500s return `{error:"Internal error"}` — no e.message leakage; (4) `src/errorReporter.js` — fire-and-forget deduped client error reports via /api/feedback; (5) AwardsView lazy-loaded via React.lazy (535KB → 528KB main chunk + 8.76KB async chunk); (6) `npm run smoke` — lint+build+4 live API checks before deploy; (7) `/api/ping` includes D1 check, `OPERATIONS.md` runbook with alert thresholds and rollback procedure |
| In-app documentation system | ✅ Live — 5 docs (Mission/Vision, How It Works, Privacy Policy, Terms & Conditions, Disclaimer); shared DocViewer with back + "See full page →" header controls + metadata bar (version, effectiveDate); DOCS module-level constant as single source of truth; Settings Information list driven by DOCS.map; standalone HTML pages for all 5 docs (public/mission.html, public/how-it-works.html, public/privacy.html, public/terms.html, public/disclaimer.html); Share + Email buttons available on all 5 pages; /api/legal-email supports all 5 docs via Resend; SettingsView lazy-split (428KB main chunk) |
| Terms & Privacy acceptance audit | ✅ Live — migration 0023 adds accepted_terms_version/at_ms + accepted_privacy_version/at_ms to users table; signup requires acceptance checkbox (login.html) and validates version server-side (400 if missing); stored in users INSERT; existing users shown fullscreen gate modal on next app load (needsTermsAcceptance from profile GET); /api/accept-terms JWT-gated endpoint records acceptance; re-prompts automatically when CURRENT_TERMS_VERSION / CURRENT_PRIVACY_VERSION bumps in auth.js + profile.js |
| Hidden admin dashboard | ✅ Live — `/dashboard` (not linked in UI) shows registered user count + chronological event/error list (newest first). Data source: `/api/dashboard` (JWT-independent, secret-gated via `DASHBOARD_PASSWORD`, fallback `ADMIN_KEY`). Event storage: `app_events` table (migration 0024). `feedback.js` now persists structured events for dashboard visibility. |

## Drift from original mission/vision

| Drift item | Why it drifted | Risk level | Recommendation |
|---|---|---|---|
| Documentation truth drift (conflicting deploy runbooks) | Deploy process changed over time and docs were updated in different places | High | Keep one canonical release flow in both README + CLAUDE; treat deviations as docs bugs and update both files in the same PR |
| Structural drift (single-file doctrine vs boundary split) | Performance and maintainability work introduced lazy view boundaries (Settings/Awards) | Medium | Keep boundary-based split explicit in docs; avoid re-fragmenting into prop-drilling UI splits without clear ownership |
| Operational drift (migration numbering/version hygiene) | Resolved: duplicate `0019_*` renamed to `0027_taxonomy_fix.sql`; next number is `0031+` | Low | Enforce unique monotonic migration numbering; add pre-merge checklist item to verify no duplicate prefixes |
| UX/legal governance drift (consent + legal docs completeness) | Terms/privacy acceptance and legal pages expanded after initial launch scope | Low | Maintain explicit versioned consent model, keep legal copy synchronized across in-app summaries/email/full pages |

| Product-principles gap closure (April 2026) | ✅ Live — (1) R568: polarised training renamed from R558 (collision); R558/R559 added to messagePolicy.js RULE_POLICY, RULE_LABELS, deriveChipLabel; (2) DOCS metadata updated to April 2026, how-it-works.html v1.1 reflects recovery mode / return-to-training / all 3 coaches, privacy.html export section updated to self-service; (3) GhostCounter removed; Rebuild scores hidden behind ▸ Advanced disclosure; (4) cycling coach Today card shows Zone 2 / Intervals session type; general goal card shows one-line focus per goal; Progress tab adds cycling coach insight block (week, sessions, next focus) |
| Military scheduler redesign (April 2026) | ✅ Live — rolling block-counter replaces Mon-Fri calendar; 3 bug fixes: open mode K1 start, Walk-run chip guard, rest-day scheduling; check-in integration for military (body state overrides schedule) |
| Session-phase warm-up/cooldown (April 2026) | ✅ Live — migration 0031 adds `easy-jog-warmup` (7 min Zone 1 jog) and `cooldown-walk` (5 min); tagged `session_phase` to exclude from general pool; Cooper test session: mobility warmups → easy jog → 12 min test → cooldown walk (~26 min total, accurate estimate); Running Coach (R556): cooldown walk appended after every run; Military Zone 2 (R571) + Intervals (R572): cooldown walk appended; all three exercises are `isFixedDuration` (exempt from volume/energy/experience scaling) |

## Known Bugs to Fix

None currently. 🟢

---

## Product TODO List

Improvements identified but not yet built. Ordered roughly by impact.

### High Priority (next up)
- **Images/GIFs in instruction cards** — `gif_url` already exists on every plan step; just needs a collapsible image area in the WorkoutView instruction card. Makes coaching feel premium and reduces form errors. High impact for beta users.
- **Offline resilience** — PWA users on spotty gym wifi see a blank screen. Minimum: cache today's plan + exercise data in IndexedDB so the workout loads without network. Service worker or manual cache strategy in `src/`.

### Workout UX
- **Level-appropriate cues** — Cues prefixed with `💡💡` in the DB indicate level-specific advice (Beginner / Intermediate / Advanced). In WorkoutView, filter cues by `experience_level` from prefs: show only the matching level's `💡💡` cues plus all single-`💡` cues. Requires a prefix convention in the data.
- **"Why" + training target section** — Add a `why` field and a `muscle_target` / `cardio_target` field to `instructions_json` per exercise. Show in the instruction phase below the step cards. For now can be derived from `category` + `tags_json` without DB changes (e.g. strength + "core" tag → "Targets: Core & Stability").
- **BMI-aware pace guidance** — For cardio exercises, when user is in the obese BMI range, show lower pace ranges or a dedicated slow-build-up note. Could be a posture-like `bmi_note` field in `instructions_json`, or a rule in WorkoutView that replaces the standard cues.

### After Session
- **Log activity flow after session** — On the session complete card, the "Log activity" button logs a manual activity. Consider also showing extra-time input there so the user can immediately get a bonus plan suggestion without having to tap "Bonus session" separately.

### Running Coach — Future Enhancements
- **Regression on skips**: ✅ Implemented — if >7 days since last run while enrolled, both plan.js (plan preview) and execution.js (on save) step back one week. User sees the correct regressed week before starting.
- **Milestone awards**: Complete a target distance → unlock a hall-of-fame award. Needs a migration to add 5 running awards.
- **Program progress in Progress tab**: Show run program current week/level on the Progression screen alongside body scores.

### Women's Health — v2 Roadmap
- **R526 — Perimenopause phase** *(explicitly out of scope for v1)*: The current cycle rules (R520–R525) assume standard menstruation. Perimenopause involves irregular cycles and hormone fluctuations without pregnancy. A future R526 could detect `cycle_profile.mode = 'perimenopause'` and adapt: longer recovery windows, lower stress threshold (T.STRESS_PERIMENOPAUSE), reduced intensity defaults, and exercise bias toward mobility and low-impact strength rather than HIIT. Would require a new `mode` value in the `cycle_profile` table and a Settings toggle alongside the existing pregnancy/postnatal setup.

### Data Quality
- **Continue enriching exercise instructions** — Migration 0032 enriched 12 exercises with thin instructions (Diamond Push-up, Wall Sit, Goblet Squat, Shoulder Press, Lateral Raise, Floor Press, Step-Up, Child's Pose, Quad Stretch, Couch Stretch, 90/90 Hip Switch, Calf Stretch). More exercises may benefit from additional steps/cues — especially newer bodyweight and band exercises added in later migrations.
- **Add `why` and `muscle_target` to all exercises** — New fields in `instructions_json`. Could be seeded via a migration script.

---

## Coding Conventions

- **Functions**: plain JS (`.js`), no TypeScript, no bundler, no imports from npm
- **Frontend**: React functional components, all styles inline using `C.` design tokens; `App.jsx` owns app shell/orchestration, feature views may be split as lazy-loaded boundaries (`SettingsView.jsx`, `AwardsView.jsx`), and pure JS modules live in `src/`
- **DB timestamps**: always milliseconds (`Date.now()`), column suffix `_at_ms`
- **DB IDs**: always `crypto.randomUUID()`
- **Error responses**: always `Response.json({ error: "Internal error" }, { status: 500 })` with `console.error(e)` server-side
- **Commits**: conventional format `feat:`, `fix:`, `chore:`, `refactor:`
- **Deploy**: canonical manual release = `npm run smoke` → `git push` (backup) → `npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main`
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

# Apply dashboard events migration
npx wrangler d1 execute justfit-db --remote --file migrations/0024_app_events.sql

# Set dashboard secret (do not commit secret values; keep out of README/public docs)
npx wrangler pages secret put DASHBOARD_PASSWORD --project-name=justfit

# Check tables
npx wrangler d1 execute justfit-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Deploy (smoke → push → wrangler)
npm run smoke
git add . && git commit -m "feat: ..." && git push
npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main

# Check recent executions
npx wrangler d1 execute justfit-db --remote --command "SELECT id, user_id, date, perceived_exertion, total_duration_sec FROM executions ORDER BY created_at_ms DESC LIMIT 10;"

# Check execution_steps actual_json for a given execution
npx wrangler d1 execute justfit-db --remote --command "SELECT step_index, exercise_id, actual_json FROM execution_steps WHERE execution_id='<id>';"

# Check users
npx wrangler d1 execute justfit-db --remote --command "SELECT id, primary_email, status, created_at_ms FROM users ORDER BY created_at_ms DESC LIMIT 10;"

# Check exercises with instructions
npx wrangler d1 execute justfit-db --remote --command "SELECT slug, name, instructions_json FROM exercises WHERE instructions_json IS NOT NULL LIMIT 5;"
```

---

## Drift Control

Four checks to enforce before merging any PR that touches the relevant area. Each is one line: what to verify, who is responsible, when it triggers.

- **Deploy consistency** — Verify that "After every change", "Deploy workflow", "Useful Commands" (CLAUDE.md) and "Deploy" (README.md) all show the identical three-step flow: `npm run smoke` → `git push` → `npm run build && npx wrangler pages deploy`. Owner: any dev. Triggers: every PR touching deploy/CI docs.
- **Architecture snapshot** — Confirm the `src/` module list and lazy-view boundaries in CLAUDE.md Project Structure match actual files on disk (`App.jsx`, `SettingsView.jsx`, `AwardsView.jsx`, `apiClient.js`, `messagePolicy.js`, `errorReporter.js`). Owner: dev adding/removing `src/` files. Triggers: every `src/` boundary change.
- **Migration numbering** — Before adding a migration, confirm no existing file shares the same `000N_` prefix; next valid number is `0031+`; never reuse a number. Owner: any dev. Triggers: every migration PR.
- **Legal docs parity** — Confirm all 5 pages (`mission`, `how-it-works`, `privacy`, `terms`, `disclaimer`) expose Share + Email buttons, and `/api/legal-email` handles all 5 document IDs (`privacy`, `terms`, `mission`, `how_it_works`, `disclaimer`). Owner: any dev. Triggers: every legal content or email endpoint change.
