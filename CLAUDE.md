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
│       ├── auth.js      ← POST signup/login, GET verify token
│       ├── checkin.js   ← POST save check-in, GET fetch check-ins
│       ├── exercises.js ← GET exercises from D1 with tag filtering
│       ├── execution.js ← POST save workout, GET fetch history
│       ├── plan.js      ← POST generate plan (runs planner engine), GET fetch plan
│       ├── score.js     ← GET consistency score for user
│       └── ping.js      ← GET health check
├── public/
│   ├── login.html       ← standalone auth page (no React, plain HTML/CSS/JS)
│   ├── _routes.json     ← routes /api/* to Functions, /* to React SPA
│   └── _redirects       ← SPA fallback
├── migrations/
│   ├── 0001_init.sql    ← full schema
│   ├── 0002_seed.sql    ← awards seed data
│   └── 0003_cleanup.sql ← FK fixes
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

**executions** — completed workouts
```sql
id TEXT PK, user_id TEXT, date TEXT, day_plan_id TEXT,
execution_type TEXT, status TEXT, total_duration_sec INT,
perceived_exertion INT, created_at_ms INT, updated_at_ms INT
```

**execution_steps** — per-exercise detail within a workout
```sql
id TEXT PK, execution_id TEXT FK→executions(id), step_index INT,
step_type TEXT, exercise_id TEXT FK→exercises(id),
prescribed_json TEXT, actual_json TEXT, created_at_ms INT, updated_at_ms INT
```

**exercises** — 15 seeded exercises, target ~150
```sql
id TEXT PK, slug TEXT, name TEXT, category TEXT,
tags_json TEXT,               ← ["strength","bodyweight","no_floor","low_impact","quiet",...]
equipment_required_json TEXT, ← ["none"] or ["dumbbell"] etc
instructions_json TEXT,       ← {steps:[], cues:[]}
metrics_json TEXT,            ← {supports:["reps","sets","time",...]}
alternatives_json TEXT,       ← {substitutions:["slug1","slug2"]}
is_active INT, created_at_ms INT, updated_at_ms INT
```

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
// JWT secret: stored as env var JWT_SECRET (fallback to hardcoded during dev)
```

Password hashing:
```javascript
hash = SHA-256(salt + password + JWT_SECRET)
stored as: "salt:hash"
```

Auth endpoints:
- `POST /api/auth` with `{action:"signup"|"login", email, password}`
- `GET /api/auth` with `Authorization: Bearer <token>` → verifies token

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

### Views (internal state, no router)
- `today` — Dashboard with consistency score + today's session card
- `history` — List of past executions from API
- `awards` — Hall of Fame, 6 awards shown
- `settings` — Subscription toggle, app preferences, logout

### Key state
```javascript
userId        // from localStorage 'jf_user_id'
token         // from localStorage 'jf_token'
plan          // current day_plan object from API
score         // consistency score integer 0-100
history       // array of execution objects
isGenerating  // bool — plan generation in progress
showCheckIn   // bool — check-in modal visible
inWorkout     // bool — workout execution view active
```

### API calls (all in `api` object)
```javascript
api.generatePlan(userId, date, checkin)  // POST /api/plan
api.getScore(userId)                     // GET /api/score
api.saveExecution(userId, planId, date, steps, durationSec)  // POST /api/execution
api.getHistory(userId)                   // GET /api/execution
```

---

## Planner Engine (functions/api/plan.js)

Pure function `runPlanner(date, checkIn, exercises)` — no side effects, no DB calls.
Returns: `{ date, slot_type, intensity, session_name, steps[], rule_trace[] }`

### Rules implemented
| Rule | Trigger | Effect |
|---|---|---|
| R510 | time_budget ≤10 or no_time | slot_type = 'micro' |
| R511 | sleep_hours ≤5 | intensity = 'low' |
| R512 | energy ≤3 (out of 10) | reps/duration × 0.6 |
| R513 | stress ≥7 (out of 10) | category = 'mobility' |
| R514 | pain_level ≥2 | slot_type = 'rest' |
| R515 | no_clothing | filter: low_impact + no floor tag |
| R516 | no_gear or traveling | filter: equipment_required = ["none"] |

### Exercise filtering uses tags_json
Key tags: `no_floor`, `low_impact`, `quiet`, `high_impact`, `floor`, `loud`,
`bodyweight`, `dumbbell`, `strength`, `cardio`, `mobility`, `recovery`

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
| D1 schema + migrations | ✅ Live |
| Exercise library (15 exercises) | ✅ Seeded in D1 |
| Awards (12 awards) | ✅ Seeded in D1 |
| Pages Functions API | ✅ Live at /api/* |
| Planner engine R510-R516 | ✅ Live |
| Frontend wired to API | ✅ Live |
| Auth (login/signup) | ✅ Live — JWT, SHA-256, login.html, auth guard in App.jsx |
| Sign Out button in Settings | ✅ Live |
| execution_steps D1 batch insert | ✅ Fixed — no more 500s |
| Offline / IndexedDB sync | ⬜ Not started |
| Weekly plan view | ⬜ Not started |
| Pro tier gating | ⬜ Not started |
| Stripe integration | ⬜ Not started |
| Landing page (marketing) | ⬜ Not started |
| EU liability waiver | ⬜ Not started |
| Session templates seeded | ⬜ Empty table |
| Exercise library expanded | ⬜ 15/150 exercises |

---

## Known Bugs to Fix

1. **JWT_SECRET hardcoded** — move to Cloudflare environment variable:
   ```bash
   npx wrangler pages secret put JWT_SECRET
   ```

---

## Coding Conventions

- **Functions**: plain JS (`.js`), no TypeScript, no bundler, no imports from npm
- **Frontend**: React functional components, all styles inline using `C.` design tokens
- **DB timestamps**: always milliseconds (`Date.now()`), column suffix `_at_ms`
- **DB IDs**: always `crypto.randomUUID()`
- **Error responses**: always `Response.json({ error: e.message }, { status: 500 })`
- **Commits**: conventional format `feat:`, `fix:`, `chore:`, `refactor:`
- **Deploy**: `git push` only — never use `wrangler pages deploy` manually

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
npx wrangler d1 execute justfit-db --remote --command "SELECT id, user_id, date, execution_type FROM executions ORDER BY created_at_ms DESC LIMIT 10;"

# Check users
npx wrangler d1 execute justfit-db --remote --command "SELECT id, primary_email, status, created_at_ms FROM users ORDER BY created_at_ms DESC LIMIT 10;"
```
