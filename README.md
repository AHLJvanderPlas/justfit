# JustFit.cc

Privacy-first, consistency-driven fitness PWA. **Consistency > Intensity**.

Live: [justfit.cc](https://justfit.cc)
GitHub: [github.com/AHLJvanderPlas/justfit](https://github.com/AHLJvanderPlas/justfit)

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite; UI components and inline styles in `src/App.jsx`; pure non-React modules extracted to `src/`; no router library |
| Hosting | Cloudflare Pages (auto-deploy on push to `main`) |
| API | Cloudflare Pages Functions in `/functions/api/` (plain JS, no bundler, no npm) |
| Database | Cloudflare D1 (SQLite) — binding: `DB` |
| Auth | JWT via Web Crypto API (no external libs), passkeys/Face ID, magic links |
| Email | Resend API (`noreply@justfit.cc`) |

## Features

- Daily adaptive workout plans — deterministic rule-based planner v1.8.0 (rules R510–R565); sport-aware bias layer nudges strength targets to support your primary sport; **injury-aware filtering** (knee/shoulder/lower back/ankle) removes contraindicated exercises and supplements with safe mobility alternatives
- **Severity-based messaging** — `src/messagePolicy.js` maps all planner rule codes to severity buckets; BMI/adaptation notes replaced with compact `AdaptationChip` pill + collapsible "Why this plan?" panel (non-shaming, safety-first copy); postnatal clearance gate shows persistent `BlockingSafetyBanner` (ARIA role="alert"); run coach ramp-up warning scoped to Settings enrollment only
- **Production hardening** — auth rate limiting (DB-backed sliding window, migration 0022); generic API 500s (no internal leakage); `src/errorReporter.js` client error reporting; AwardsView lazy-loaded (535→528KB main chunk + 8.76KB async chunk); `npm run smoke` pre-deploy script; `/api/ping` DB check + `OPERATIONS.md` runbook
- **Check-in optional** — plan generates from settings alone when check-in is skipped or mode is manual; existing plan loaded from D1 on page reload (no re-generation); check-in includes injury scope/area picker with "save as ongoing issue" to profile
- Full coaching UX: instruction cards (swipeable, no auto-advance), rep-by-rep tap counting, **"All reps done"** shortcut, rest countdown, difficulty controls (±2 reps / ±10s), exercise substitution, perceived exertion rating
- **Equipment-aware planner** — selectable equipment includes dumbbells, resistance bands, pull-up bar, treadmill, stationary bike, indoor bike trainer, rowing machine; `null` equipment defaults to bodyweight-only; `chair` always treated as available
- **Exercise ordering** — core exercises first, indoor cardio second-to-last, outdoor exercises always last
- Pregnancy & postnatal mode: planner rules R530–R544, adapted rest timers (+15s), breathing reminders, pelvic floor coaching; inline Settings setup; deactivate button; sex-change safety warning modal
- Consistency score (0–100): active days ×10 + resilience bonus (low PE sessions) + continuity bonus (streaks)
- **Cross-device session sync** — history reconciled on load; session completed on another device shows as done immediately
- Wake Lock API — screen stays on during workout
- Rich `actual_json` tracking per step: reps per set, actual rest taken, target adjustments, substitutions, skip flag
- Passkey / Face ID (WebAuthn ES256), magic link login, password reset, forgot password flow
- Bonus sessions — ephemeral plan (not saved to D1), intensity-capped, visible until 23:00
- Delete workout from history — resets today's completed state and all related localStorage keys
- Responsive dashboard: full-width session card + compact score strip on mobile (< 600px)
- Weight unit toggle (kg ↔ lbs) — single tap-to-toggle button
- **11-colour accent picker** — synced to D1, applied on every device at load
- SVG polygon goal icons (stroke style matching lightning bolt logo) with watermark positioning
- PWA — installable, dark theme (`#020617`), default accent emerald (`#10b981`)
- Ghost Partner counter (circadian formula, updates every 60s)
- Weekly plan view (7-day session strip)
- EU liability waiver on first use

## Local development

```bash
npm install
npm run dev
```

Vite dev server runs at `http://localhost:5173`. API calls go to the local Vite proxy — Pages Functions are **not** available in local dev; use `wrangler pages dev` for full stack local testing if needed.

## Deploy

GitHub auto-deploy is suspended. Run the smoke check, then deploy:

```bash
npm run smoke   # lint + build + 4 live API checks — must pass before deploying
git add . && git commit -m "feat: ..." && git push
npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main
```

See `RELEASE_SMOKE.md` for the full manual pre-deploy checklist and `OPERATIONS.md` for the incident runbook.

## Environment variables (set in Cloudflare Pages → Settings → Variables)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | JWT signing key (required in production) |
| `RESEND_API_KEY` | Email sending via Resend |
| `EXERCISEDB_API_KEY` | Exercise GIF enrichment (optional) |
| `ADMIN_KEY` | Admin endpoint protection |
| `WEBAUTHN_RP_ID` | Passkey relying party ID — set to `justfit.cc` in prod, `localhost` for local |

## Database

- Database name: `justfit-db`
- Database ID: `4c6fedf0-b9e2-4441-aa98-71c1420136c1`
- Binding in wrangler.toml: `DB`
- Migrations: `migrations/0001_init.sql` → `0021_injury_tags.sql`

```bash
# Apply a migration
npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql

# Query remotely
npx wrangler d1 execute justfit-db --remote --command "SELECT ..."

# Check tables
npx wrangler d1 execute justfit-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

## API endpoints (`/functions/api/`)

| File | Routes | Description |
|---|---|---|
| `auth.js` | POST (signup/login/forgot/reset/magic/passkey), GET | Auth, passkeys, magic links, password reset |
| `plan.js` | POST, GET | Generate / fetch day plan; planner engine v1.8.0 |
| `execution.js` | POST, GET, DELETE | Save / fetch / delete workout executions + steps |
| `checkin.js` | POST, GET | Daily check-in (mood, energy, sleep, stress, pain scope/areas, toggles) |
| `exercises.js` | GET | Exercise library with tag filtering |
| `profile.js` | GET, POST | User preferences, cycle, pregnancy/postnatal context |
| `score.js` | GET | Consistency score (0–100) |
| `ping.js` | GET | Health check |

## Critical rules

- Never add `account_id` to `wrangler.toml` — Pages infers it from the project
- Pages Functions: plain JS only, no npm packages, no TypeScript, no bundler
- Always use `env.DB.batch([...])` for multiple D1 inserts — never sequential awaits in a loop
- All D1 timestamps: milliseconds (`Date.now()`), column suffix `_at_ms`
- All D1 primary keys: `crypto.randomUUID()`
- Bonus plans: returned in-memory (not saved to D1) to avoid `UNIQUE(user_id, date)` conflict on `day_plans`
- Plan re-generation uses `ON CONFLICT(user_id, date) DO UPDATE` so deleting today's workout and regenerating never fails

See `CLAUDE.md` for full project context, database schema, coaching interface spec, planner rules, and coding conventions.
