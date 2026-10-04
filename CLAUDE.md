# justfit-app — Claude Code Instructions

## SECURITY GUARDRAILS (read before writing any code)

Standing rules for new work in this repo. Each one exists because it already cost
real time somewhere in this codebase family. Skip a rule only if it plainly does
not apply (no mail, no `_headers`, no D1), never because it is inconvenient.

**Styling: no new inline styles.** Put styling in a CSS class, not in a `style=`
attribute or a React `style={{ }}` prop. Inline styles are the single reason a
Content-Security-Policy has to keep `style-src 'unsafe-inline'`, and the cost is
not recoverable later: one sibling project reached ~3400 instances across 134
files, which turned a one-line header fix into a multi-day refactor. Three things
that look like escapes and are not: a **nonce** only covers `<style>` elements,
never `style=` attributes; **`'unsafe-hashes'`** needs a hash per distinct value;
and a **CSS custom property is still an attribute** (`style={{'--w': x}}` does not
help). For dynamic values on SVG use presentation attributes (`fill`, `x`,
`width`), which are not CSS and cost nothing.

**Cloudflare Pages combines every matching `_headers` rule.** The most specific
rule does NOT win, and a browser enforces the intersection of every CSP it
receives. Any per-path header that `/*` also sets must be unset first:

```txt
/admin/*
  ! Content-Security-Policy
  Content-Security-Policy: <the policy you actually want>
```

Without the unset, `/*` silently cancels the per-path policy. This disabled a
WebAssembly transcoder for weeks with no error anywhere, and separately served
`X-Content-Type-Options: nosniff, nosniff`, which is not a valid value. Verify by
counting what is served, never by reading the file:
`curl -sI <url> | grep -ci content-security-policy` must be 1.

**A new third-party origin is a security decision, not a convenience.** Any new
CDN, font host, embed or API must be added to the CSP explicitly and justified in
the commit message. Never widen a directive to a bare scheme such as `https:` to
make something work.

**Code and database must agree.** Every table and column a query touches must
exist. Schema drift has caused more expensive incidents here than any other class
of bug: a dropped table still being written to, a column that never existed, 18
migrations missing from the tracking table. **If several repos share one D1
database, a schema change must update every one of them in the same pass** (a
portal kept writing to tables an admin-side migration had already dropped, and
customer-facing signing broke silently). Migration files are not a reliable
source of truth for what exists; check the live schema.

**Verify the deploy, do not trust the deploy command.** Confirm the deployed
artifact actually changed. A sibling project served a three-week-old build because
the local git branch did not match the Pages production branch, so every deploy
silently became a preview. A success message is not evidence.

**Secrets never live in code or in git.** Use `wrangler secret` / Pages secrets,
or a settings table. If a value must be recoverable, it belongs in the secrets
vault outside every repo, never in a source file or a CLAUDE.md.

**Mail, if this project sends any.** Keep DMARC alignment relaxed (`adkim=r;
aspf=r`) when a provider sends from a subdomain (Resend and SES do); strict
alignment fails every outgoing message. Never point a reporting address at a
mailbox with no routing rule if the zone has a catch-all drop, or the reports
vanish silently.

**DNS and certificates, if this project owns a zone.** Never narrow CAA to a
subset of the CAs Cloudflare uses; it picks the issuer itself and changes it
without notice, and a CAA naming only one CA nearly blocked a live renewal. If
HSTS carries `includeSubDomains` with `preload`, a new hostname must serve valid
HTTPS before it goes live, or it is unreachable rather than merely insecure.

**Prefer an enforced rule over a written one.** Where a rule can be a test, make
it a test: a source-scanning assertion, or a ratchet that only allows a number to
fall. A rule in a document is a rule people forget. When you write such a guard,
temporarily break the rule and confirm the guard actually fails, because a guard
that cannot fail looks like coverage while providing none.

> For ecosystem-level process rules (build workflow, Foundation validation, doc updates) see `/justfit/CLAUDE.md`.
> ⚠️ **Cloudflare auth is pre-configured.** `XDG_CONFIG_HOME` is set via `.claude/settings.local.json` — wrangler authenticates as `ahljvanderplas@gmail.com` automatically. **Never** run `wrangler login` or ask the user to authenticate in the browser.

---

# Standing Instructions — Always Follow

These rules apply to EVERY task in EVERY session, without exception.

## After every change
- Run `npm run smoke` first — lint + build + live API checks; must pass before pushing
- Then commit and push (source backup): `git add . && git commit -m "..." && git push`
- Then deploy: `npm run build && npx wrangler pages deploy packages/client-app/dist --project-name=justfit-app --branch=main`
- **After deploy**: update the "Current Build Status" table in `CLAUDE.md` and `README.md` to reflect the change — never leave docs stale after a deployment
- Never leave uncommitted changes
- Commit messages must follow conventional format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`

## E2E release gate (Phase 4+ structural PRs)
`npm run e2e` runs the Playwright journey suite (6 journeys, local D1, wrangler pages dev).
**Must be green before any Phase 4 structural change** (App.jsx split, SettingsView split, auth migration).
Run: `npm run e2e` — requires the local dev server to be up or will spin one up automatically.
Journeys covered: signup/onboard/check-in/workout/history, guest mode, FIT-code connect (open + 409), trainer-invite accept, consent gate block/sign.
Do NOT skip this gate for C-E11/C-E12/C-B7 work.

## Deploy workflow (GitHub auto-deploy suspended)
- Git push = source backup only (GitHub auto-deploy to Cloudflare Pages is suspended)
- Canonical flow: `npm run smoke` → `git push` → `npm run build && npx wrangler pages deploy packages/client-app/dist --project-name=justfit-app --branch=main`
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
- All styles inline — no Tailwind, no CSS modules, no external stylesheets (client-app). Trainer-app uses Tailwind v4 with @theme tokens.
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

All items are on the v2 list. See the Product TODO List section for the full assessed backlog.

1. ~~**Return-to-training mode**~~ ✅ Done — R558: ≥14-day gap → volume ×0.75 re-ramp. *(Principle 2 + 3)*
2. ~~**Primary-intent conflict hierarchy**~~ ✅ Done — COACH_PRIORITY constant in plan.js + conflict modal in Settings → Your Coach. *(Principle 5)*
3. ~~**Recovery mode**~~ ✅ Done — R559: "Taking it easy today" check-in toggle → low intensity + mobility/recovery pool. *(Principle 2 + 3)*
4. ~~**Self-service data export**~~ ✅ Done — "Download my data (JSON)" in Settings (F1). *(Principle 6)*
5. ~~**Weekly outcome summary**~~ → moved to v2 backlog (see Product TODO List)

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

**This repo is a monorepo (npm workspaces).** The trainer portal is being rebuilt per `docs/JUSTFIT_TRAINER_PORTAL_REBUILD_PLAN.md`. Follow that document's phase order. The vanilla JS portal at the old domain remains live during rebuild; do not modify it unless explicitly asked.

| Layer | Technology |
|---|---|
| Frontend (client-app) | React + Vite; app shell/state orchestration in `packages/client-app/src/App.jsx`; Settings and Awards split into lazy-loaded view modules; non-React modules in `src/` (`apiClient.js`, `messagePolicy.js`, `errorReporter.js`); no router library |
| Frontend (trainer-app) | React + Vite + TypeScript + Tailwind v4 in `packages/trainer-app/` — trainer portal rebuild (P1A+) |
| Shared | `packages/shared/` — design tokens, types, auth helpers, rule engine (populated P1A+) |
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
| Pages project name | `justfit-app` |
| Cloudflare account email | ahljvanderplas@gmail.com |

wrangler.toml is configured with the D1 binding. Always use `--remote` flag when querying D1:
```bash
npx wrangler d1 execute justfit-db --remote --command "SELECT ..."
```

**Secrets — actual values:** `JWT_SECRET`, `RESEND_API_KEY`, `MOLLIE_API_KEY`, `STRAVA_CLIENT_ID`,
`STRAVA_CLIENT_SECRET`, `DASHBOARD_PASSWORD`, `ADMIN_KEY`, `GYM_MASTER_KEK`, and the CF API token in
`.claude/settings.local.json` are catalogued in
`/Users/alexander/Documents/Projects/Notes/.secrets/justfit.md` — never paste secret values into
this file. Check that file before asking the user for a key.

---

## Project Structure

```
justfit/                             ← monorepo root (npm workspaces)
├── packages/
│   ├── client-app/                  ← JustFit PWA (app.justfit.cc)
│   │   ├── src/
│   │   │   ├── App.jsx          ← app shell, view orchestration, primary workout/dashboard logic
│   │   │   ├── CoachView.jsx    ← Coach tab: primary intent, programmes, trainer card + sessions/groepslessen/credits, messaging (lazy-loaded)
│   │   │   ├── WorkoutView.jsx  ← full-screen workout execution overlay (phase state machine, rep counting, rest timer)
│   │   │   ├── PlanWeekView.jsx ← 7-day plan view with session strips and completed sessions (lazy-loaded)
│   │   │   ├── HistoryView.jsx  ← Progress tab: trajectory chart, radar, awards entry, cycling PMC (lazy-loaded)
│   │   │   ├── SettingsView.jsx ← Settings tab with 4 sub-views: You / Your Coach / Privacy / Account (lazy-loaded)
│   │   │   ├── AwardsView.jsx   ← Hall of Fame component (lazy-loaded via React.lazy to reduce initial bundle)
│   │   │   ├── MuscleMap.jsx    ← anatomical front+back SVG muscle map (male/female variants, lazy-loaded)
│   │   │   ├── uiComponents.jsx ← shared Glass card, Badge, and other reusable UI primitives
│   │   │   ├── icons.jsx        ← Icons (UI SVGs) + ExerciseIcon (movement line-art, 27 types)
│   │   │   ├── ErrorBoundary.jsx ← React error boundary wrapper
│   │   │   ├── main.jsx         ← renders App (no CSS import — all styles inline in App.jsx)
│   │   │   ├── tokens.js        ← design token object C, display(), eyebrow, mono(), ACCENT_COLORS, applyAccent()
│   │   │   ├── appConstants.js  ← RUN_TARGETS, EQUIPMENT_OPTIONS, ALL_SPORTS, GOALS, EXPERIENCE, SEX_OPTIONS
│   │   │   ├── planUtils.js     ← client-side plan helpers (upcoming session preview, conflict detection)
│   │   │   ├── exportUtils.js   ← file export generators: generateCyclingTcx(), generateZwoFile(), generateErgFile(), generateRunningTcx()
│   │   │   ├── authHelpers.js   ← JWT decode helpers, guest detection, token storage
│   │   │   ├── offlineCache.js  ← IndexedDB offline cache: cachePlan() write-through + getCachedPlan() fallback
│   │   │   ├── apiClient.js     ← all API calls (fetch wrappers, error code attachment)
│   │   │   ├── errorReporter.js ← fire-and-forget client error reporting (plan_generation, auth_failure); dedupes per session
│   │   │   └── messagePolicy.js ← message severity policy: RULE_POLICY, RULE_LABELS, parseRuleTrace(), hasBlockingSafety(), deriveChipLabel()
│   │   ├── public/              ← static assets (login.html, magic.html, manifests, etc.)
│   │   ├── index.html           ← Vite entry point
│   │   ├── vite.config.js
│   │   └── package.json
│   ├── trainer-app/             ← Trainer Portal React app (trainer.justfit.cc) — P1A+ rebuild
│   │   ├── src/                 ← React + TypeScript + Tailwind v4
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── shared/                  ← Shared: design tokens, types, auth helpers, rule engine (P1A+)
│       ├── src/index.ts
│       └── package.json
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
│       ├── plan.js      ← POST generate plan (runs planner engine v1.9.0, staged pipeline), GET fetch plan
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
│   ├── 0032a_enrich_instructions.sql ← enriches 12 exercises (Diamond Push-up, Wall Sit, Goblet Squat, Shoulder Press, Lateral Raise, Floor Press, Step-Up, Child's Pose, Quad Stretch, Couch Stretch, 90/90 Hip Switch, Calf Stretch)
│   ├── 0032b_run_interval_instructions.sql ← removes hardcoded durations from all 6 run-interval-level-* instruction steps (json_patch)
│   ├── 0033_running_milestone_awards.sql ← seeds 5 running milestone awards (run-5k/10k/15k/hm/30k); criteria_json type=run_distance
│   ├── 0034_exercise_instructions_enrichment.sql ← enriched instructions with 💡 coaching cues for 30 exercises (dumbbell/band/kettlebell/mobility/recovery)
│   ├── 0013_height.sql        ← height_cm column on user_preferences
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

Migration naming policy: migration files must use unique, monotonic prefixes. Next valid number is `0118` (0117 applied 2026-10-04; 0112–0116 applied, 0114 on 2026-10-03 with the axis-mapper fix); never reuse a number. **Verify against `ls migrations/ | tail -1` — never copy this number from a document.** Duplicate prefixes 0059/0060/0061/0072/0074/0080 are documented in `migrations/legacy/README.md` (applied as-is, not renamed). See also: **Database Migration Policy** section below.

---

## Database Schema (D1 — justfit-db)

> **Regenerated 2026-10-03 from the LIVE database** (`PRAGMA table_info` per table — 69 tables
> incl. `_cf_KV` and `sqlite_sequence`). Migration files are not a reliable source of truth; if this
> section and `PRAGMA table_info` disagree, the database wins — fix this section. The smoke check
> in `scripts/smoke.sh` fails when a bolded table name below is not in
> `scripts/fixtures/live-tables.json` (regenerate that fixture after any migration that adds or
> drops a table — command is in the check's comment).
>
> **Tables that do NOT exist** (earlier versions of this file documented them): `auth_users`,
> `user_contact` (both merged into `users` by migrations 0082–0088 — credentials are now
> `users.password_hash` / `password_algo`), `support_tokens`, `user_profile` (height, weight and sex
> live on `user_preferences`), `user_availability`.

Conventions: timestamps are `INTEGER` milliseconds (`*_at_ms`); ids are UUID `TEXT`. The 50 STRICT
tables include all twelve core tables below; 21 older tables are not STRICT (e.g. `cycle_profile`,
`cycling_workouts`, `app_events`, `appointments`, `trainer_profiles`). Foreign keys are by
convention (`user_id` → `users.id`); most are not enforced by D1.

### Core tables (full column detail)

**users** — identity and credentials in one row (auth_users/user_contact were merged in here)
```sql
id TEXT PK, status TEXT NOT NULL DEFAULT 'active',
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL, deleted_at_ms INT,
primary_email TEXT, primary_phone TEXT,
accepted_terms_version TEXT, accepted_terms_at_ms INT,
accepted_privacy_version TEXT, accepted_privacy_at_ms INT,
token_invalidated_at_ms INT DEFAULT NULL,   -- JWTs issued before this are rejected
email_verified INT NOT NULL DEFAULT 0,
password_hash TEXT, password_algo TEXT, last_login_at_ms INT,
locale TEXT, timezone TEXT, country_code TEXT
```
Password stored as `salt:hash` where hash = SHA-256(salt + password + JWT_SECRET).

**user_preferences** — profile + planner preferences (one row per user; replaces the old `user_profile`)
```sql
user_id TEXT PK, units TEXT NOT NULL DEFAULT 'metric', training_goal TEXT, experience_level TEXT,
intensity_pref INT, session_duration_min INT, days_per_week_target INT,
preferences_json TEXT,          -- coach toggles (military_coach, running_coach, ...), equipment, sports
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL,
sex TEXT, height_cm REAL, weight_kg REAL
```

**daily_checkins** — one per user per day
```sql
id TEXT PK, user_id TEXT NOT NULL, date TEXT NOT NULL (YYYY-MM-DD),
mood INT, energy INT, soreness INT, sleep_hours REAL, stress INT, weight_kg REAL, notes TEXT,
checkin_json TEXT (JSON with toggles: no_clothing, no_gear, no_time, gym_today,
                   traveling, recovery_mode, pain_level, pain_scope, pain_areas,
                   free_text, motivation, time_budget, pregnancy_signals, postnatal_signals),
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
```
Note: UI uses a 1-5 scale, multiplied by 2 before storing (→ 2-10 range in DB).
Note: UI exposes a 3-state SVG smiley ("feeling": 1/2/3) that maps to stress+motivation at
submit time. The `feeling` field is not stored; stress and motivation in DB are derived values.

**day_plans** — generated plans, one per user per day
```sql
id TEXT PK, user_id TEXT NOT NULL, date TEXT NOT NULL, plan_status TEXT NOT NULL DEFAULT 'draft',
plan_json TEXT NOT NULL (JSON: session_name, slot_type, intensity, steps[], rule_trace[]),
generated_by TEXT NOT NULL DEFAULT 'engine', engine_version TEXT, seed TEXT,
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
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

**executions** — completed workouts (also the landing table for Strava imports and trainer-assigned sessions)
```sql
id TEXT PK, user_id TEXT NOT NULL, date TEXT, day_plan_id TEXT, session_template_id TEXT,
execution_type TEXT NOT NULL DEFAULT 'workout', status TEXT NOT NULL DEFAULT 'completed',
started_at_ms INT, ended_at_ms INT, total_duration_sec INT, total_distance_m REAL,
total_energy_kcal REAL, avg_hr_bpm REAL,
perceived_exertion INT,   -- 3 (too easy) / 5 (just right) / 8 (too hard) / NULL (skipped rating)
notes TEXT, execution_json TEXT,
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL,
-- cycling / Strava (0036, 0038-0042)
tss_planned REAL, tss_actual REAL, tss_source TEXT, strava_activity_id INT,
strava_metadata_json TEXT, strava_metadata_expires_at_ms INT,
strava_upload_activity_id INT, strava_upload_at_ms INT,
-- trainer portal (0059+)
program_assignment_id TEXT, assigned_by_trainer_id TEXT, trainer_notes TEXT,
client_rpe INT, client_feedback TEXT
```

**execution_steps** — per-exercise detail within a workout
```sql
id TEXT PK, execution_id TEXT NOT NULL → executions(id), step_index INT NOT NULL,
step_type TEXT NOT NULL, exercise_id TEXT → exercises(id),
prescribed_json TEXT,   -- {sets, reps, duration_sec, rest_sec}
actual_json TEXT,       -- see rich actual_json structure below
started_at_ms INT, ended_at_ms INT, created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
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

**exercises** — the exercise library (482 live rows at 2026-10-03, after migrations 0107–0116)
```sql
id TEXT PK, slug TEXT NOT NULL, name TEXT NOT NULL, name_nl TEXT,
category TEXT,                -- CHECK IN ('strength','cardio','mobility','recovery','skill','mixed')
primary_muscles_json TEXT, secondary_muscles_json TEXT,   -- primary muscle drives progression axis mapping
tags_json TEXT,               -- ["strength","bodyweight","no_floor","low_impact","quiet",
                              --  "pregnancy_safe","postnatal_safe","pelvic_floor","kegel",
                              --  "breathing","supine","prone","crunch","valsalva","high_impact","inversion",...]
equipment_required_json TEXT, -- ["none"] or ["dumbbell"] etc
equipment_advised_json TEXT,  -- optional advisory equipment (migration 0010)
instructions_json TEXT,       -- {steps:[], cues:[], pregnancy_note?: string, postnatal_note?: string}
instructions_markdown TEXT, instructions_markdown_nl TEXT, contraindications_json TEXT,
media_json TEXT, image_r2_key TEXT, video_r2_key TEXT,
metrics_json TEXT,            -- {supports:["reps","sets","time",...]}
alternatives_json TEXT,       -- {substitutions:["slug1","slug2"]}
difficulty TEXT, source TEXT, parent_exercise_id TEXT,
gym_id TEXT, visibility TEXT NOT NULL DEFAULT 'global', created_by_user_id TEXT,   -- trainer-owned custom exercises
is_active INT NOT NULL DEFAULT 1, created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
```
Notes:
- `pelvic_floor` is a TAG (used for planner filtering), not a category. Pelvic floor exercises use category `'mobility'`.
- `instructions_json.pregnancy_note` — shown in instruction card for pregnant users (amber accent)
- `instructions_json.postnatal_note` — shown in instruction card for postnatal users (rose accent)
- Progression axis resolution: first primary muscle that maps to an axis, falling back to category; `category = 'cardio'` always resolves to conditioning (see the Planner Engine section).

**entitlements** — subscription/trial access
```sql
id TEXT PK, user_id TEXT NOT NULL, product_code TEXT NOT NULL,
source TEXT NOT NULL DEFAULT 'manual',   -- includes 'trial' (0092)
status TEXT NOT NULL DEFAULT 'active',   -- active/trialing/grace/canceled/expired
starts_at_ms INT NOT NULL, ends_at_ms INT, renews_at_ms INT,
external_ref TEXT, meta_json TEXT, mollie_customer_id TEXT, mollie_sub_id TEXT,
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
```

**user_progression** — current per-axis progression scores (one row per user)
```sql
user_id TEXT PK, scores_json TEXT NOT NULL, sport_scores_json TEXT,
last_computed_at_ms INT NOT NULL, created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
```

**user_progression_events** — append-only log of score changes (one per credited execution or assessment)
```sql
id TEXT PK, user_id TEXT NOT NULL, execution_id TEXT, event_type TEXT NOT NULL,
scores_before_json TEXT, scores_after_json TEXT, stimulus_json TEXT, created_at_ms INT NOT NULL
```

**fitness_assessments** — self-assessment results (R598 reads these)
```sql
id TEXT PK, user_id TEXT NOT NULL, date TEXT NOT NULL, focus TEXT NOT NULL,
results_json TEXT NOT NULL, scores_json TEXT NOT NULL, created_at_ms INT NOT NULL
```

**strava_connections** — Strava OAuth link per user (tokens are secrets — never log)
```sql
id TEXT PK, user_id TEXT NOT NULL, athlete_id INT NOT NULL,
access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at_ms INT NOT NULL,
scope TEXT, scope_granted TEXT, athlete_name TEXT, athlete_city TEXT, athlete_pic_url TEXT,
connected_at_ms INT NOT NULL, last_sync_at_ms INT, push_enabled INT NOT NULL DEFAULT 0, last_push_at_ms INT,
created_at_ms INT NOT NULL, updated_at_ms INT NOT NULL
```

### All other live tables (one line each)

Use `PRAGMA table_info(<table>)` against the live DB for columns of these; do not trust migration files.

**Identity and auth**
- **passkey_credentials** — WebAuthn/passkey registrations (credential_id UNIQUE, SPKI public key, counter)
- **password_reset_tokens** — single-use reset tokens, 1 hour expiry (`used_at_ms` NULL = unused)
- **magic_link_tokens** — single-use magic-link / email-change tokens, 15 min expiry; has `purpose`, `new_email`, `code`
- **deleted_users** — GDPR deletion tombstones (email hash only, no PII)
- **auth_rate_limits** — rate-limit buckets (`bucket`, `count`, `window_start_ms`)
- **app_events** — product/diagnostic event log (not STRICT)

**Consumer training**
- **awards** — award catalogue (12 rows)
- **user_awards** — awards unlocked per user
- **session_templates** — reusable session definitions (16 rows)
- **exercise_aliases** — alternative names for exercises (military/Defensie import)
- **context_overrides** — per-day user override of the plan context (type + JSON)
- **cycle_profile** — body mode (standard/pregnant/postnatal) and cycle tracking per user; has pregnancy due date/clearance and postnatal birth/clearance fields (not STRICT)
- **period_log** — period start events for smart cycle tracking
- **pregnancy_weekly_log** — weekly pregnancy summary (energy, nausea, breathlessness, sessions)
- **feedback_items** — in-app feedback and bug reports with status/flag
- **push_subscriptions** — Web Push endpoints per user (endpoint, p256dh, auth)

**Programmes, protocols and cycling**
- **program_templates** — coach programme templates (running 5–30 km, military Defensie)
- **program_template_items** — per-week/day/session items of a programme template
- **workout_protocols** — structured workout protocols (cycling and others)
- **workout_protocol_steps** — ordered steps of a protocol (duration, distance, reps, intensity)
- **cycling_workouts** — structured cycling workouts cw01–cw29 with TSS estimates (not STRICT)

**Billing and growth**
- **billing_events** — Mollie webhook/event log per user
- **vouchers** — voucher codes and redemption counters
- **referrals** — referral relationships and reward status
- **referral_codes** — one referral code per user
- **waitlist** — pre-launch email waitlist (not STRICT)

**Trainer portal and gyms**
- **gyms** — trainer business / gym tenant (billing identity, branding, subscription state)
- **gym_memberships** — user-in-gym roles, trainer assignment, consent, availability, conversation counters
- **trainer_profiles** — public trainer profile (bio, specialties, availability) (not STRICT)
- **trainer_invites** — pending trainer invitations
- **trainer_disclosures** — per-client disclosure level and encrypted contact/billing fields
- **trainer_messages** — trainer/client chat messages (not STRICT)
- **trainer_switch_requests** — client requests to switch trainer
- **support_requests** — client support/broadcast requests to trainers
- **client_intake** — structured intake form (goals, injuries, availability, equipment)
- **client_notes** — trainer notes about a client
- **client_packages** — sold session packages (sessions total/used, price, VAT)
- **appointments** — scheduled sessions/classes (not STRICT)
- **appointment_enrollments** — client RSVPs to appointments
- **programs** — trainer-authored programmes
- **program_sessions** — sessions within a trainer programme (week/day structure JSON)
- **program_assignments** — programme assigned to a client, adherence and status
- **assigned_sessions** — dated sessions generated from an assignment
- **trainer_invoices** — trainer-issued invoices (lines, VAT, Mollie payment link)
- **invoice_counters** — per-gym per-year invoice numbering
- **invoice_templates** — saved invoice line templates
- **supplier_invoices** — purchase invoices for the trainer's bookkeeping
- **audit_log** — gym-scoped audit trail of trainer/admin actions

**Admin and platform**
- **admin_justfit_users** — operator accounts for the admin console
- **admin_justfit_sessions** — admin console sessions
- **admin_justfit_audit** — admin console action audit
- **admin_login_attempts** — admin login rate limiting
- **admin_magic_tokens** — admin magic-link tokens
- **platform_config** — key/value platform settings (`key`, `value`, `updated_by`)
- **_migrations** — exists but is EMPTY (0 rows) — migrations are applied with `--file` and tracked in the ledger line under Database Migration Policy, not here
- **_cf_KV** — Cloudflare-internal; cannot be introspected (PRAGMA is refused). Do not use.
- **sqlite_sequence** — SQLite internal AUTOINCREMENT counters. Do not use.

---

## Auth System

JWT implementation uses Web Crypto API only (no npm). Located in `functions/api/auth.js`.

```javascript
// Session: HttpOnly __Host-jf_session cookie (Secure, SameSite=Strict, 7 days) — C-B7 + C-B17
// The JWT is never returned in response bodies or stored client-side.
// User ID stored in localStorage as 'jf_user_id' (identifier only, not a credential)
// On app load: if no jf_user_id → /login.html; else GET /api/auth verifies the cookie
//   (401 → clear + redirect; network error → stay, offline mode)
// JWT payload: { userId, email, exp }; JWT_EXPIRY = 7 days
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

Engine version: **v1.9.0** (sport-aware bias layer R560–R561; R557 TSB-aware cycling autoregulation).

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
| D1 schema + migrations | ✅ Live (0002–0117; next valid number **0118**; 0117 user_session_templates applied 2026-10-04) |
| Exercise library (482 exercises) | ✅ Seeded in D1 (migrations 0002–0010, 0020, 0029, 0030); taxonomy fixed in 0027; 0029 adds 16 military/gap-fill exercises; 0030 adds 'military' tag to 15 exercises for planner pool filtering |
| Session templates (16 templates) | ✅ Seeded in D1 (migrations 0005, 0011) |
| Awards (31 shown in Hall of Fame, evaluated client-side) | ✅ `AwardsView` owns all 31 definitions and evaluates them from history/progression/`runUnlocked`. The D1 `awards` table (12 rows) is **not read by the app** and `user_awards` is only ever deleted — never written. Migration 0033 (5 running milestones, `category='running'`) silently inserted **nothing**: that value fails the table's CHECK and `INSERT OR IGNORE` swallowed it. Harmless because the table is unused; recorded here so nobody "fixes" it by seeding dead data |
| Pages Functions API | ✅ Live at /api/* |
| Planner engine v1.9.0 (R510–R582 + R558–R559), staged pipeline (C-E13) | ✅ Live — `runPlanner` decomposed into 6 named stage functions (`_initPlannerContext` → `_applySafetyPolicies` → `_applyBodyModePolicies` → `_selectCoachBlueprint` → `_selectExercises` → `_assembleSession`) threaded by mutable `ctx`; all 73 rules preserved; file 2626 → 2405 lines; template-based, profile-aware, pregnancy/postnatal/military rules; sport-aware bias layer (R560); injury-aware filtering R562–R565; Military Coach R570–R582; R558 return-to-training; R559 recovery mode |
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
| Onboarding flow | ✅ Live — 2-scenario model: full onboarding on first use OR ≥90 days inactive (server-side last_activity_at_ms); daily check-in otherwise; "Re-do onboarding" button in Settings → You; 6-step flow (waiver / **goal** / about-you / fitness / equipment+time / sports); goal step is first (goals-first design): 5 vertical full-width cards (fat_loss/strength/health/mobility/pregnancy); pregnancy option sets training_goal=health + shows amber note to complete pregnancy setup in Settings |
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
| Sport preferences in Settings | ✅ Live — "Endurance Sports" section: Running/Cycling/Rowing/Swimming/Walking/Mixed Cardio toggles + primary sport selector; stored in preferences_json.sport_prefs via /api/progression POST; sport-aware bias on/off toggle (sport_prefs.bias_enabled); deep-merge in profile.js preserves bias_enabled on re-onboarding |
| Planner R550–R561 | ✅ Live — progression-aware rules: R550 profile load, R551 weak-axis compensation (reorders pool; prefers sport_support:{primary} tagged exercises within gap axis), R552 mode-aware note, R553 mobility decay maintenance, R554 explainability in rule_trace, R560 sport-aware bias layer (complement vectors × weighted average → ±12pt target nudge; volume-scaled guardrail on legs/conditioning: 0 sessions=100%, 1-2=80%, 3-4=60%, 5+=40%; bypassed when sport coach prescribes the session or bias_enabled=false), R561 sport mobility injection (appends one sport_mobility:{primary} tagged exercise per standard session) |
| Sport-aware bias pipeline (May 2026) | ✅ Live — SPORT_DEMAND reframed as complement vectors (37 sports); ONBOARDING_SPORTS chip multi-select in onboarding Step 4; PathChoiceModal saves sport_prefs on running/cycling path selection; migration 0053 adds sport_support tags for 6 sports (59 exercises); migration 0054 adds sport_mobility tags for 7 sports (59 exercises); SettingsView: "Sport-aware training bias" on/off toggle |
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
| AdaptationChip on PlanWeekView (F5) | ✅ Live — Today's Plan card in weekly view shows chip label (via deriveChipLabel) when a rule adaptation is active; completed sessions in history also show adaptation chip via rule_trace from execution GET |
| Active coach badge on Dashboard (F6) | ✅ Live — persistent inline badge below greeting shows active coach label (Military · K3 / Running · 10km / Cycling · Week 4); renders only when a coach is active |
| Check-in simplification — SVG smiley row (F8) | ✅ Live — Motivation + Stress sliders replaced with 3-button SVG smiley row ("Not great" / "Okay" / "Good"); feeling maps to stress + motivation at submit time (sad→stress=10/motivation=2, neutral→stress=4/motivation=6, good→stress=2/motivation=10); DB schema and all planner rules (R511–R513) unchanged; pre-fill from last check-in derives feeling from stored stress/motivation |
| Offline / IndexedDB sync | ✅ Live — `src/offlineCache.js` DB_VERSION=2; cachePlan() write-through + getCachedPlan() fallback; IDB stores: `jf-offline/plans` (keyPath=date) + `jf-offline/exercises` (keyPath=slug); cacheExercises()/getCachedExercises() used in WorkoutView alternatives sheet (write-through on success, IDB fallback on network failure) |
| Strava visibility sync | ✅ Live — `visibilitychange` listener in App.jsx fires Strava sync when user returns to app tab; 5-min cooldown (shared key `jf_strava_auto_sync` with app-open 30-min sync) |
| COACH_PRIORITY intent hierarchy | ✅ Live — `COACH_PRIORITY` constant in plan.js formalises intent order as machine-readable array (pregnant→postnatal→military→running→cycling→cycling_cross→general); returned on every plan response as `coach_priority[]`; adjacent to intent-hierarchy comment block |
| Adaptation memory (execution rule_trace) | ✅ Live — execution.js GET adds parallel D1 query with JSON_EXTRACT to attach rule_trace per date; PlanWeekView shows AdaptationChip on past sessions |
| messagePolicy R557+R561 test coverage | ✅ Live — 9 new Vitest test cases covering RULE_POLICY, RULE_LABELS, deriveCoachSentence, rest-day suppression for R557 (TSB autoregulation) and R561 (sport mobility injection) |
| R526 Perimenopause mode | ✅ Live — migration 0056 adds `'perimenopause'` to `cycle_profile.mode` CHECK; R526 in plan.js caps intensity at moderate, lowers stress threshold to ≥5 (vs ≥7 standard), disables cycle phase rules R520–R525; SettingsView violet toggle in Body mode section; App.jsx banner; messagePolicy entry |
| Dutch-first i18n + language toggle | ✅ Live — `src/i18n.js`: `t()`, `useLang()`, `setLang()`, 500+ NL translations; WorkoutView / PlanWeekView / HistoryView / SettingsView / App.jsx all wrapped; NL/EN toggle in Settings → You → Appearance; training science terms (FTP/TSS/RPE etc.) stay English in both modes; default `'nl'`, stored in `localStorage('jf_lang')` |
| Consumer Pro billing (Mollie recurring) | ✅ Live — migration 0072 adds mollie_customer_id/mollie_sub_id to entitlements + billing_events table; POST/GET/DELETE /api/subscribe (checkout, entitlement state, cancel); POST /api/webhooks/mollie-consumer (first/recurring/failed/expired/canceled); 14-day trial entitlement on signup (source=trial, product_code=pro_trial); plan.js checks entitlements table for isPro (prefs.isPro remains manual override); ProGate.jsx full-screen upgrade wall (NL, early bird pricing, Mollie checkout redirect); App.jsx: isPro loaded from /api/subscribe, ?upgrade=success handler, PathChoiceModal locks running/cycling for non-Pro; SettingsView: coach enrollment locked with "Upgrade naar Pro →" CTA, Account → Abonnement section with live status + cancel flow; early bird cap: 200 subscribers |
| Stripe integration | ⬜ Not started (Mollie chosen instead) |
| **Strava — 2026 API Policy rework** | ✅ Live (2026-09-12) — migration `0099`. Reworked against the Strava API Policy + Agreement effective 2026-06-01. **§5.8**: Pro entitlement gate removed from `/api/strava-auth` and `/api/strava-sync` (charging end users for API functionality is prohibited) — this reverses C-G1. **§7.4/§2.5**: `DELETE /api/strava-auth` now revokes via `/oauth/revoke` (supersedes the legacy `/oauth/deauthorize`, which `auth.js` account-deletion also now uses) and purges all Strava Data, returning written deletion confirmation. **§6.2**: `executions.strava_metadata_expires_at_ms` gives the cached Strava payload a seven-day life, swept on every sync; the derived JustFit record (duration/sport/TSS) survives. **§2.3/§6.1**: trainer `clients/:id/history` excludes `strava_*` executions and Strava-linked sessions — roadmap item T-F11 is closed as not permitted. **§7.2**: granted scopes stored in `strava_connections.scope_granted` and honoured. **Security**: OAuth `state` is now mandatory, HMAC-signed (JWT_SECRET), 15-min TTL, constant-time compare — it was previously optional and unsigned, allowing an attacker to bind their own Strava account to a victim's JustFit account via a crafted callback URL. **Correctness**: 429 handling + rate-limit reporting; first-sync pagination fixed (with `after=` Strava returns oldest-first, so the old 2-page cap imported the *oldest* 200 activities and dropped everything recent); `STRAVA_API_BASE` env var ready for the `api-v3.strava.com` migration; 2026 sport types added. **Attribution**: "Powered by Strava" in Settings + "View on Strava" deep links per the Brand Guidelines. New shared modules `functions/api/_shared/strava.js` + `strava-exercises.js`; 22 new tests in `tests/strava.test.js` |
| **Fitness assessment — "Where you are"** | ✅ Live (2026-09-12) — migration `0100`. A short self-administered battery that **measures** four progression axes and writes the per-axis `baseline`, which had been hardcoded to 0 and written by no code path (decay drained to zero; new users had no meaningful radar). Calibrates the existing model — adds no second score. **Measured:** push (push-up variants, normalised wall ×0.35 / knee ×0.60 / full ×1.00), legs (squats/60s), core (plank hold), conditioning (march/3min). **Not measured:** pull and mobility — no honest equipment-free test exists; rendered as "not measured" rather than invented. **Presets:** all_round / upper / lower / stamina / power, each an explicit tests×emphasis pair (the original list mixed scope and mode, leaving gaps like "upper-body power"). **Scoring:** documented piecewise-linear curves in `_shared/assessment.js`, deliberately coarse and labelled as such; the honest signal is the delta between a user's own assessments. Measurement raises power/endurance only when higher than inference, so a bad day never deletes progress; baseline = score × 0.75 and tracks the latest measurement both ways. **Safety gate (server-enforced):** pregnancy, postnatal, pain ≥2, recovery mode, or sleep ≤5h refuse outright. **Cold start** creates the progression row. Free for every account. `GET/POST /api/assessment`; runner is `AssessmentView.jsx` (10.8 kB lazy chunk), entry card above the radar in `HistoryView`. Migration 0100 also rebuilt `user_progression_events` — its CHECK allowed only workout/decay/recompute, so logging an assessment in the same batch would have failed the save (13 rows preserved). 37 tests. Design: `docs/FITNESS_ASSESSMENT_DESIGN.md` |
| **Strava session upload (`POST /api/strava-push`)** | ✅ Live (2026-09-12) — uploads a completed JustFit session to Strava using the JSON upload format Strava added 2026-05-21 (`data_type=json`): structured per-set data (`exercise_type`/`repetitions`/`duration`) for WeightTraining / HIIT / Workout / Crossfit, plus a text muscle summary in the description. 88 JustFit exercise slugs mapped to Strava's 636-value enum with category generics as fallback; a test asserts every emitted identifier exists in the enum. Opt-in per athlete: requires `activity:write` (requested only via `GET /api/strava-auth?write=1`) **and** `strava_connections.push_enabled` (toggled by `PATCH /api/strava-auth`). Dedupe via `executions.strava_upload_activity_id`. **Strava has no public media-upload endpoint** — attaching photos is limited to partner apps — so the JustFit muscle map cannot be posted as an image; it is rendered as a text bar chart instead |

---

| Accent colour picker | ✅ Live — 11 colours (Emerald/Violet/Sky/Rose/Amber/Indigo/Lime/Cyan/Orange/Fuchsia/Coral); CSS custom properties (--accent, --accent-rgb, --accent-dim, --accent-border) on :root; stored in D1 + localStorage jf_accent; applied before first render; Appearance section at top of Settings |
| Messaging architecture | ✅ Live — `src/messagePolicy.js` centralises severity buckets (blocking_safety / adaptive_safety / progression_caution / account_security / validation_error / system_error); maps planner rule codes (R510–R565) to human-readable labels; `parseRuleTrace()`, `hasBlockingSafety()`, `deriveChipLabel()` helpers; BMI/adaptation warnings replaced with `AdaptationChip` (compact status pill) + `WhyPlanPanel` (collapsible "Why this plan?" panel with Safety / Training / Suggested action groups, auto-expands first view via `jf_whypanel_<plan_id>` in localStorage); `BlockingSafetyBanner` (role="alert") for clearance gates (R539); run coach ramp-up kept in Settings enrollment only (progression_caution style); standalone rule trace card removed (absorbed into WhyPlanPanel) |
| Production hardening | ✅ Live — 7-task hardening pass: (1) 0 react-hooks/exhaustive-deps warnings (useMemo, stable refs, isProRef); (2) DB-backed rate limiting (migration 0022) for login/reset/verify — 429 on abuse; (3) All API 500s return `{error:"Internal error"}` — no e.message leakage; (4) `src/errorReporter.js` — fire-and-forget deduped client error reports via /api/feedback; (5) AwardsView lazy-loaded via React.lazy (535KB → 528KB main chunk + 8.76KB async chunk); (6) `npm run smoke` — lint+build+4 live API checks before deploy; (7) `/api/ping` includes D1 check, `docs/operations-runbook.md` runbook with alert thresholds and rollback procedure |
| In-app documentation system | ✅ Live — 5 docs (Mission/Vision, How It Works, Privacy Policy, Terms & Conditions, Disclaimer); shared DocViewer with back + "See full page →" header controls + metadata bar (version, effectiveDate); DOCS module-level constant as single source of truth; Settings Information list driven by DOCS.map; standalone HTML pages for all 5 docs (public/mission.html, public/how-it-works.html, public/privacy.html, public/terms.html, public/disclaimer.html); Share + Email buttons available on all 5 pages; /api/legal-email supports all 5 docs via Resend; SettingsView lazy-split (428KB main chunk) |
| Terms & Privacy acceptance audit | ✅ Live — migration 0023 adds accepted_terms_version/at_ms + accepted_privacy_version/at_ms to users table; signup requires acceptance checkbox (login.html) and validates version server-side (400 if missing); stored in users INSERT; existing users shown fullscreen gate modal on next app load (needsTermsAcceptance from profile GET); /api/accept-terms JWT-gated endpoint records acceptance; re-prompts automatically when CURRENT_TERMS_VERSION / CURRENT_PRIVACY_VERSION bumps in auth.js + profile.js |
| Hidden admin dashboard | ✅ Live — `/dashboard` (not linked in UI) shows registered user count + chronological event/error list (newest first). Data source: `/api/dashboard` (JWT-independent, secret-gated via `DASHBOARD_PASSWORD`, fallback `ADMIN_KEY`). Event storage: `app_events` table (migration 0024). `feedback.js` now persists structured events for dashboard visibility. |
| Owner admin portal | ✅ Live — `/admin/` full SPA (session-gated, DB-backed). Covers: platform KPIs dashboard, user management (deactivate/GDPR delete), trainer lifecycle (approve/reject/suspend/plan-change), billing (invoices + plan pricing + MRR summary), exercise library CRUD, admin team management + audit log. Migration 0058 adds admin tables. Bootstrap: set `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars for first login. |
| Trainer invite flow (email + QR/code) | ✅ Live — Sub-flow A: email invite for existing JustFit users (`GET /api/trainer-invite?t=`, `POST /api/trainer-invite/accept`, `TrainerInviteScreen` in App.jsx); Sub-flow B: signup with pending invite (`?invite=` → sessionStorage → `PendingInviteModal` post-onboarding); Sub-flow C: QR/short-code connect (`GET/POST /api/connect`, `FIT-XXXXXX` code in Settings → Trainers → Connect). Migration 0070 adds `trainer_invites` table. Two Resend email templates (existing user vs. new signup). |
| Gym branding on custom exercise steps | ✅ Live — `plan.js` fetches `custom_exercises JOIN gyms.branding_json` for user's active memberships; maps to standard exercise schema; merges into `allExercises` pool; embeds `trainer_logo_url`/`trainer_logo_bg` on plan steps for custom exercises only. WorkoutView instruction phase shows 36×36 logo badge top-right. Today card step list shows 18×18 inline badge after exercise name. |

## Drift from original mission/vision

| Drift item | Why it drifted | Risk level | Recommendation |
|---|---|---|---|
| Documentation truth drift (conflicting deploy runbooks) | Deploy process changed over time and docs were updated in different places | High | Keep one canonical release flow in both README + CLAUDE; treat deviations as docs bugs and update both files in the same PR |
| Structural drift (single-file doctrine vs boundary split) | Performance and maintainability work introduced lazy view boundaries (Settings/Awards) | Medium | Keep boundary-based split explicit in docs; avoid re-fragmenting into prop-drilling UI splits without clear ownership |
| Operational drift (migration numbering/version hygiene) | Historical duplicates at 0059/0060/0061/0072/0074/0080 documented in `migrations/legacy/README.md` (X-4 resolved 2026-06-18). Next valid number is `0118`. | Low | Enforce unique monotonic numbering for all new migrations (0118+); never reuse a number. |
| UX/legal governance drift (consent + legal docs completeness) | Terms/privacy acceptance and legal pages expanded after initial launch scope | Low | Maintain explicit versioned consent model, keep legal copy synchronized across in-app summaries/email/full pages |

| Product-principles gap closure (April 2026) | ✅ Live — (1) R568: polarised training renamed from R558 (collision); R558/R559 added to messagePolicy.js RULE_POLICY, RULE_LABELS, deriveChipLabel; (2) DOCS metadata updated to April 2026, how-it-works.html v1.1 reflects recovery mode / return-to-training / all 3 coaches, privacy.html export section updated to self-service; (3) GhostCounter removed; Rebuild scores hidden behind ▸ Advanced disclosure; (4) cycling coach Today card shows Zone 2 / Intervals session type; general goal card shows one-line focus per goal; Progress tab adds cycling coach insight block (week, sessions, next focus) |
| Military scheduler redesign (April 2026) | ✅ Live — rolling block-counter replaces Mon-Fri calendar; 3 bug fixes: open mode K1 start, Walk-run chip guard, rest-day scheduling; check-in integration for military (body state overrides schedule) |
| Military Coach Phase 3b — DB-backed strength sessions (May 2026) | ✅ Live — strength sessions (kracht / kracht_marsen / circuit) now read exercise lists from `program_template_items` (migrations 0047–0049: 13 templates, 1919 items). Falls back to military-tagged exercise pool when DB returns fewer than 3 items. Run/cooper sessions and all adaptation logic remain code-driven and unchanged. |
| Session-phase warm-up/cooldown (April 2026) | ✅ Live — migration 0031 adds `easy-jog-warmup` (7 min Zone 1 jog) and `cooldown-walk` (5 min); tagged `session_phase` to exclude from general pool; Cooper test session: mobility warmups → easy jog → 12 min test → cooldown walk (~26 min total, accurate estimate); Running Coach (R556): cooldown walk appended after every run; Military Zone 2 (R571) + Intervals (R572): cooldown walk appended; all three exercises are `isFixedDuration` (exempt from volume/energy/experience scaling) |
| Running milestones + progress (April 2026) | ✅ Live — migration 0033 seeds 5 running milestone awards; AwardsView gets `runUnlocked` prop; Progress tab adds Running Coach header card (Week X of Y · Nkm · progress bar) above Goal Fit, parallel to Military Coach header; run interval instruction steps de-hardcoded (migration 0032); instruction enrichment pass: migration 0034 adds 💡 coaching cues to 30 dumbbell/band/kettlebell/mobility/recovery exercises |
| Visual refresh v2 (April 2026) | ✅ Live — 4-PR design system overhaul: Barlow Condensed/Inter Tight/JetBrains Mono fonts via Google Fonts; extended C tokens (bgCard2, borderStrong, emeraldSoft/Glow now accent-variable); `display()`, `eyebrow`, `mono()` helpers; `src/icons.jsx` with Icons (UI SVGs) + ExerciseIcon (movement line-art); Today screen: greeting, KPI strip (STREAK/READY/WEEK), hero session card with gradient + glow (tracks accent colour), ExerciseIcon per step, weekly 7-day grid; Progress screen: Barlow headers, TRAINING BALANCE eyebrow on radar, redesigned axis bars with delta, recent sessions block, chart icon in nav; Settings: Barlow header, stacked sport-coach cards with ACTIVE badge, multi-select general_goals chips (up to 3), Military track left-bar redesign, Cooper stub card |
| Exercise icon expansion + MuscleMap thumbnail (April 2026) | ✅ Live — ExerciseIcon set expanded from 12 to 27 types (press, dip, hip, stretch, band, step, walk, sprint, rotation, breathe, foam, military, bike, climb, shoulder added); iconKeyFor() updated with matching slug/tag rules; `src/MuscleMap.jsx` new component — anatomical front+back SVG muscle map (male/female variants, primary/secondary group highlighting, emerald accent); WorkoutView instruction phase shows MuscleMap thumbnail (size=180) with primary muscle groups highlighted; falls back to text label when no groups derived |
| Professional MuscleMap SVG + lazy-load (April 2026) | ✅ Live — MuscleMap.jsx replaced with professional anatomical SVG paths for all 4 views (male/female front+back, viewBox 1320.92×1206.46); primary/secondary muscle group fills via color prop; body outline stroke on top; MuscleMap lazy-loaded (64KB async chunk, main bundle −57KB); `musclesFor` inlined in App.jsx; wrapper gets `maxWidth:180, flexShrink:0` |
| Instruction phase UX polish (April 2026) | ✅ Live — "Ready — let's go →" button now sticky/fixed to bottom (matches pre-overview "Start Workout" pattern); MuscleMap centered and wrapped in "Muscles targeted" card with uppercase title (matches Equipment card style); all 4 body outline path arrays complete (MB/MF/FF/FB) |
| Workout UX & bug fixes (April 2026) | ✅ Live — (1) exerciseComplete phase removed: last set advances directly to next exercise instruction, no 2-second dead screen; (2) "← Prev" button in top-right header during instruction phase (exIdx > 0) navigates back to previous exercise; (3) Cooper modal standalone save fixed: opening from Settings now persists `last_cooper_distance_m` via `api.saveProfile` instead of silently returning on null `cooperPending`; (4) weekly summary cutoff changed from rolling last-7-days to Monday of current calendar week |
| Cycling Coach Phase 1 — FTP foundation + load capture (April 2026) | ✅ Live — migration 0035: `cycling_workouts` table seeded with 23 structured workouts (5 sub-goals × 4 archetypes + 3 FTP tests); migration 0036: `executions.tss_planned/actual/source` load provenance columns; execution.js auto-computes cycling TSS (IF=0.65 Z2 / IF=0.75 intervals × RPE modifier, source='rpe_estimated'); SettingsView: sub-goal chips (build_fitness/climbing/sprint/aerobic_base/race_fitness) in enrollment + FTP test modal (ramp ×0.75 / 12min ×0.85 / 20min ×0.95 formula, saves ftp_watts + ftp_tested_at_ms + ftp_history); enrollment stores sub_goal + ftp_test_interval_weeks=6 + ftp_history=[]; App.jsx cycling insight block: amber FTP retest recommendation when ftp_tested_at_ms is null or stale (> interval_weeks × 7 days), suppressed for HR-based users |
| Cycling Coach Phase 2 — PMC chart (April 2026) | ✅ Live — GET /api/cycling-pmc endpoint: queries cycling executions (tss_source IS NOT NULL), computes CTL (42-day EMA) / ATL (7-day EMA) / TSB series, returns last 90 days; cyclingPmc state in App → passed as prop to HistoryView; Progress tab cycling insight block extended with: CTL/ATL SVG line chart (emerald solid / amber dashed), CTL/ATL/TSB metric pills with zone-colour TSB, TSB insight message (4 ranges), ~est. footnote when hasEstimated=true, FTP history sparkline (≥2 tests required) |
| Cycling Coach Phase 3b — TSB-aware autoregulation (April 2026) | ✅ Live — `computeCyclingTsb()` helper in plan.js recomputes CTL/ATL/TSB from execution history (same EMA as cycling-pmc.js); onRequestPost fetches TSS executions in parallel with progression query when cycling_coach is active; R557b gate: TSB < -25 → force endurance (fatigue override), TSB > +5 + build phase → promote quality session type; no-op when TSB is null (new users with no data) |
| Cycling Coach Phase 3c — Protocol bridge (May 2026) | ✅ Data migrated — migration 0051 seeds all 29 cycling workouts into `workout_protocols` (sport='cycling') + 101 rows in `workout_protocol_steps`. Protocol rows cross-referenced via `wp-{cw_id}` IDs and `cw_ref:{cw_id}` tags. |
| Cycling Coach Phase 3d — Runtime cutover (May 2026) | ✅ Live — R557 now reads `workout_protocols` + `workout_protocol_steps` (JOIN, sport='cycling'). `buildCyclingWorkoutsFromProtocols()` reconstructs the in-memory cycling workout pool (sub_goal, workout_type, intervals_json, duration_min) from step rows. Legacy `cycling_workouts` query retained as fallback when protocol pool is empty. All downstream consumers (scaleCyclingIntervals, calcCyclingTSS, buildCyclingCoachNote, TCX/ZWO/ERG exports) unchanged. |
| Running Coach Phase 4 — Programme template adoption (May 2026) | ✅ Live — migration 0052 seeds 5 `program_templates` (run-5km/10km/15km/20km/30km) + 140 `program_template_items` mirroring the `RUN_PROGRAMS` JS constant. `buildRunProgramsFromTemplates()` reconstructs `{targetKm: [{hiit, zone2},...]}` from DB rows. R556 uses DB-backed schedule with fallback to hardcoded constant. All progression/adaptation logic (experience offset, time-budget selection, regression, warm-up assembly) remains code-driven and unchanged. Baseline: `migrations/baseline/1050_seed_running.sql`. |
| Cycling Coach Phase 4 — TCX export (April 2026) | ✅ Live — `generateCyclingTcx()` client-side XML generator + `triggerFileDownload()` helper in App.jsx; cycling coach today card shows "↓ TCX" button when plan step has `intervals_json`; expands all sets into individual `<Step>` elements (no Repeat_t); power targets in watts (FTP-based) or BPM (HR-based); Garmin Connect / TrainingPeaks compatible; filename: `{workout_slug}_{date}.tcx` |
| Cycling Coach Phase 3a — Structured workout library (April 2026) | ✅ Live — migration 0037: 6 new FIT-file-inspired workouts (cw24-cw29: VO2max Pyramid, Sprint–VO2–Sprint, Sprint Pyramid, 40-20s ×2 sub-goals, Flamme Rouge); min_sets/max_sets scaling on cw06/cw10/cw18 + cw27/28/29 for time-budget adaptation; plan.js R557 rewritten: CYCLING_PROFILES rotation (3-session weekly cycle per sub_goal), getCyclingBlockPhase 7-week block periodization (base→build→recovery), scaleCyclingIntervals scales repetitions to time budget, calcCyclingTSS from intervals_json, buildCyclingCoachNote with FTP/HR targets, date-seeded variety for interval selection; cycling_workouts fetched from DB in onRequestPost; tss_planned embedded on plan step; execution.js uses pre-computed tss_planned (IF heuristic retained as fallback) |
| Cycling Coach Phase 5a — Strava OAuth connect (April 2026) | ✅ Live — migration 0038: `strava_connections` table; `functions/api/strava-auth.js`: GET returns auth URL + connection status, POST exchanges code for tokens (upserts strava_connections), DELETE disconnects; SettingsView: "Integrations" section above Security with Strava card (connect/disconnect + athlete name display); App.jsx: detects `?code=&scope=activity` on mount, exchanges code, shows "Strava connected · {name} ✓" activity toast; requires `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` env vars |
| Cycling Coach Phase 5b — Strava sync all activity types (April 2026) | ✅ Live — migration 0039: `strava_activity_id` + `strava_metadata_json` columns on executions; `functions/api/strava-sync.js`: POST fetches Strava activities (2 pages × 100), classifies 30+ sport types, computes TSS only for cycling (power-based / HR-estimate / IF fallback), deduplicates via unique(user_id, strava_activity_id); SettingsView: Sync button + last sync timestamp + import summary; App.jsx history: Strava activities show sport icon, name, distance, elevation, orange STRAVA badge; PMC filter guards: cycling-pmc.js + plan.js query only cycling execution types |
| Phase 6 — Workout file export (May 2026) | ✅ Live — `generateZwoFile()`: Zwift ZWO XML (Warmup/Cooldown/SteadyState/IntervalsT elements, FTP ratio targets); `generateErgFile()`: ERG time-series for Wahoo/smart trainers (absolute watts, step-change pairs); `generateRunningTcx()`: Garmin TCX for running sessions (Sport=Running, HR zone targets per step type); Cycling coach today card: ↓ TCX + ↓ ZWO + ↓ ERG buttons when intervals_json present; Running coach today card: ↓ TCX button when plan has time-based steps |
| Cycling cross-training runs (May 2026) | ✅ Live — R557c in plan.js: prescribes run sessions on rest/short days when cycling coach active + cross-training enabled; rolling 7-day window for all schedule gates (cycling, run, cross-train); cycling_days_per_week configurable (3/4/5, min 2 rest days enforced); shadow run ramp-up (run_level 1–21, same exercises as run coach, advances every 3 sessions, 14-day gap regresses 1 level); execution.js detects session_type='cycling_cross_run' to advance run_level and last_cross_run_at_ms; SettingsView: sessions/week chips (3/4/5) in enrollment, cross-training toggle + run days selector in active state; App.jsx: correct session_type on save (cycling_coach/run_coach/cycling_cross_run/workout), cross-training card with TCX export + badge |
| Strava hardening + BYO app (May 2026) | ✅ Live — (1) strava-auth.js: getByoCreds() reads strava_byo.{client_id,client_secret} from user preferences, falls back to env vars; handleGet/handlePost use BYO creds; GET includes is_byo flag; (2) strava-sync.js: cycling reconciliation (links strava activities to existing cycling_coach executions on same date, no duplicates); BYO creds used for token refresh; (3) SettingsView: renamed to "Strava Import Beta", BYO App badge, collapsible Advanced setup panel with numbered instructions + client_id/secret inputs, Save credentials button; (4) App.jsx: auto-sync on app open with 30-min cooldown (jf_strava_auto_sync localStorage key); (5) profile.js: cycling_coach server-side validation (whitelist sub_goal/unit, clamp numeric ranges); GET strips strava_byo.client_secret; (6) onboarding fix: null last_activity_at_ms treated as new account (not 90-day inactive); (7) cycling coach copy: "5 goals, 7-week block cycle (base→build→recovery)" replaces "8 weeks · polarised" framing; (8) FTP stale banner: actionable Go to FTP test + Remind me next week buttons, 7-day snooze in localStorage, suppressed on rest days |

| Guest mode + no-email banner (May 2026) | ✅ Live — (1) auth.js: `guest_signup` action creates anonymous DB user (no email, provider=guest), returns JWT with `{guest:true, email:null}`; rate-limited 5/IP/hour; (2) login.html/js: "Continue without account →" link below auth card; (3) App.jsx: decodes JWT to detect missing email; amber banner on Today screen "Add your email to keep your data" with Add → shortcut to Settings, dismissible for 24h; (4) onboarding step 1: display name text input (optional, saved to preferences.display_name); (5) migration 0040: High Pull `equipment_required_json` corrected from `["none"]` to `["dumbbell"]` — stops military sessions prescribing it to users with no weights |

| Today screen design overhaul — Sprint 1 (May 2026) | ✅ Live — Single 11px mono top strip (date left, streak·score right → taps to Progress); greeting section + 3 KPI cards removed; session name hero at 52px display weight-900; coach pill (Military·K3 / Running·Xkm / Cycling·WeekN) inside card just above session name; AdaptationChip removed; deriveCoachSentence() in messagePolicy.js renders plain-language rationale below session name (24 rule codes, body-mode prefix); static conflict label removed |
| Check-in overhaul — Sprint 1C (May 2026) | ✅ Live — Conversational 3-step bottom-sheet replaces form modal: Step 1 smiley tap (≤2 taps to complete); Step 2 chip multi-select (pain/zero-time/gym/taking-easy/period) + free text + Skip/Apply; Step 3 conditional detail (pain scope/areas, pregnancy signals, postnatal signals). Sliders, time stepper, and full-check-in expander removed. Data shape unchanged for API compatibility. |
| Running Coach distances expanded (May 2026) | ✅ Live — 13 goal distances (5/10/10.5/15/20/21.1/25/30/35/40/42.2/45/50 km); RUN_TARGETS constant in appConstants.js; programme schedules for all 13 in running.js; parseInt→parseFloat fix in buildRunProgramsFromTemplates |
| Settings as coach console — Sprint 2A (May 2026) | ✅ Live — 4 sub-views (You / Your coach / Privacy / Account) with landing page chevron rows + back navigation; active intent header ≥32px display (MILITARY·K3 / RUNNING·Xkm / CYCLING·sub_goal / GENERAL HEALTH); conflict modal when 2+ coaches active without primary_intent; sign-out button in Account sub-view; sections routed: Training Focus + Integrations → coach, Daily Planning + body profile + Appearance → you, Feedback + Info → privacy, Subscription + Email + Security + Delete → account; conflict modal useEffect auto-fires on coach sub-view when primary_intent unset |
| Progress = one trajectory — Sprint 2B (May 2026) | ✅ Live — Trajectory bar chart (12 ISO weeks, current bar accent-coloured, median reference line) above fold on Progress; STREAK · N DAYS display 28px + trajectorySentence() 16px (4 variants based on 4-week history buckets); radar hidden for general users with <14 completed sessions (military always shown); Awards entry point single row at bottom of Progress; fixed Glass import bug in HistoryView (Glass was used without import — caused silent runtime error on Progress tab) |
| Path-choice onboarding — Sprint 2C (May 2026) | ✅ Live — PathChoiceModal (2×2 grid: General / Running / Cycling / Military) shown on first load when primary_intent unset; follow-up step per path (running: km selector, cycling: sub-goal picker, military: track + mode + optional date); saves primary_intent + coach prefs via api.saveProfile; shown after onboarding completion AND for existing users without intent on profile load; "Change path →" button in Settings → Your coach sub-view re-opens modal |
| Workout polish — Sprint 3A (May 2026) | ✅ Live — Rest phase: flat progress bar replaced with 200px SVG ring (r=88, stroke-dashoffset animation, restColor fill, track stroke rgba 0.07); countdown centered inside ring at 64px; "Breathe · let your heart rate settle" italic pulse text shown during rest for non-pregnancy users; wake-lock denied copy tightened to actionable tip |
| Awards next-unlock — Sprint 3B (May 2026) | ✅ Live — Awards & milestones entry row on Progress shows "N sessions to next award" sub-label in accent colour; driven by nextSessionUnlock() comparing completedCount against milestones [1,3,7,10,25,50,100]; disappears at 100 sessions (all session-count awards earned) |
| Plan tab Glass import fix (May 2026) | ✅ Live — PlanWeekView.jsx was missing `Glass` in its uiComponents import, causing `ReferenceError: Glass is not defined` crash on Plan tab open; fixed by adding Glass to the import |
| Plan/Progress/Awards/Coach polish (May 2026) | ✅ Live — (1) Plan completed sessions: same-day JustFit+Strava entries merged into one card, sorted new→old, Done pill replaced with STRAVA pill; (2) Today card: equipment-related rule sentences (R516/R515) suppressed on rest days via `slotType` param on `deriveCoachSentence`; (3) Progress: recent sessions card removed (duplicate of Plan tab); (4) Awards: sorted unlocked→locked then category A-Z then title A-Z; (5) Your Coach: cycling sub-goal chips shown even when coach active + inline Save goal button; running target distance picker shown even when enrolled with contextual button label |
| Check-in polish — chips, icons & layout (May 2026) | ✅ Live — (1) Two new context chips: "Rough night" (maps poor_sleep → sleep_hours=4, triggers R511) and "Low energy" (maps low_energy → energy=3, triggers R512); (2) All chips replaced with 14×14 SVG line icons (no emoji); (3) Step 2 header reworded to "What's going on?" / "Tap anything that fits — or just hit Apply"; textarea placeholder updated to "Rough night? Big day? Tell me anything…"; (4) Moon emoji in onboarding replaced with inline SVG icon (both occurrences); (5) Check-in bottom sheet constrained to maxWidth 520 on desktop via centering wrapper div |

| Design system overhaul — files 15-19 (May 2026) | ✅ Live — (PR3/file16) Today context blocks: 3px accent hairline + "WEEK N OF M" in coach cards, "Check in →" link below weekly summary; (PR4/file18) Trophy Room: Earned/Next up/Far horizon sections with deltaText, Progress entry → plain text "Next: [award] · Trophy room →" link; (PR5/file19) Coach tab replaces Plan+Awards in nav, CoachView with primary intent radio + conflict resolution + weekly plan link; plan+awards views still renderable from nav links |
| Onboarding re-do fix (May 2026) | ✅ Live — OnboardingModal now pre-fills all fields from existing prefs (name, sex, weight, height, goal, experience, equipment, duration); weight_kg/height_cm omitted from API payload when left blank (prevents null overwrite); Settings → You: "Set values to default" button with red inline confirmation resets profile to standard defaults (User/Male/75kg/180cm/bodyweight/emerald) |
| Military coach settings always visible (May 2026) | ✅ Live — removed `!isActive` guard so Mode/Track/Target level/Date/Pack weight settings are always shown when Military Coach card is selected (whether or not already enrolled); static read-only status card removed; save button label changes to "Save changes · KN" when coach is already active |
| Login page as marketing — Overhaul 20+20a (May 2026) | ✅ Live — `public/login.html` restructured into two zones: Zone 1 (auth card, 100dvh, unchanged behaviour) + Zone 2 (product explainer below fold); Google Fonts added; animated scroll cue chevron; three pillars (Bolt/Compass/Shield SVG icons); static Today card mockup; "What we don't do" em-dash mono list; single pricing sentence; smooth-scroll "Back to sign in →" link. 20a patch: coral `#f43f5e` accent throughout (logo-mark tile stays green, separate brand pass); ✉️ emoji replaced with SVG envelope; canonical Compass icon (r=9 circle + needle path); all three pillar icons normalised to stroke-width 1.6 |
| Coach tab programme dashboard (May 2026) | ✅ Live — Programme-management cards moved from Progress tab (HistoryView) to Coach tab (CoachView in App.jsx). Coach tab now owns: Training Goal card (general mode), Running programme card + week timeline bar chart + insight text, Cycling PMC chart + FTP stale banner + CTL/ATL/TSB pills, Military level ladder + coach insights (Cooper test, march weight, weakest axis, tips). Progress tab now shows pure performance data only: trajectory chart, streak sentence, radar, goal fit ring, axis breakdown, key insights. CoachView receives new props: `progression`, `cyclingPmc`, `ftpSnoozedUntil`, `setFtpSnoozedUntil`, `accentHex`, `setView`. HistoryView props cleaned: removed `cyclingPmc`, `plan`, `ftpSnoozedUntil`, `setFtpSnoozedUntil`; kept `setView` (Trophy room button). Accent colours use `var(--accent)` CSS variables throughout CoachView (no hardcoded emerald). |
| B2B2C Pro grant on connect (May 2026) | ✅ Live — `POST /api/connect` now checks `gyms.sub_status='active'`; if the gym has an active B2B subscription, inserts a `trainer_grant` entitlement (`product_code='pro_consumer'`, `ends_at_ms=gym.sub_ends_at_ms`) so the user gets Pro immediately without waiting for a Mollie webhook. Guarded: skips if an active trainer_grant already exists. |
| Gym client limit enforcement — T-E11 partial (2026-05-30) | ✅ Live — `POST /api/connect` and `POST /api/trainer-invite/accept` check `gyms.free_tier_client_limit` (migration 0089) for `sub_tier='starter'` gyms; 409 `gym_client_limit_reached` when at limit. ConnectScreen + TrainerInviteScreen show Dutch user message. |
| Trainer message banner — amber + 7-day filter (May 2026) | ✅ Live — Banner is now amber (`rgba(245,158,11,...)`) instead of accent/emerald. Adds `msgFresh` check: only shown when `trainer_message_sent_at_ms` is within the last 7 days. |
| Weekly outcome sentence above trajectory chart (May 2026) | ✅ Live — `weeklyOutcomeSentence(history)` in HistoryView.jsx compares current ISO-week sessions vs trailing 4-week median; one of 4 variants: "Strong week — above your average", "On track — steady as usual", "Lighter week — still consistent", "Fresh start — let's build from here". Rendered above the `<TrajectoryChart>` inside the Progress Glass card. |
| "Why this exercise" line in WorkoutView (May 2026) | ✅ Live — `deriveExerciseWhy(category, tags)` module-level helper in WorkoutView.jsx; renders a small italic muted line (12px) directly below the exercise name `<h1>` in the instruction phase. Examples: "Builds strength · resistance training", "Mobility · flexibility & joints", "Cardio · conditioning". No DB change. |
| Security headers hardening (May 2026) | ✅ Live — `packages/client-app/public/_headers` updated: added `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`; CSP expanded to allow Google Fonts (style/font-src), blob: img-src, and specific connect-src origins (Resend, Strava, Mollie); `worker-src 'none'` and `object-src 'none'` added; `script-src 'unsafe-inline'` retained (required for inline styles throughout app). |
| PBKDF2 password hashing upgrade (May 2026) | ✅ Live — `functions/api/auth.js`: new `hashPasswordPbkdf2(password, salt, iterations)` using `crypto.subtle` PBKDF2+SHA-256 (100k iterations). New signups store `algo='pbkdf2+sha256'`, hash format `salt:iterations:hash`. Login reads `password_algo` and dispatches to legacy SHA-256 verifier or PBKDF2 verifier; legacy accounts silently upgraded to PBKDF2 on next successful login. Password reset always writes PBKDF2. No DB migration needed (`password_algo` column already existed). |
| Unlock running for free users (May 2026) | ✅ Live — `PathChoiceModal` lock condition changed from `p.key === "running" \|\| p.key === "cycling"` to `p.key === "cycling"` only. Running path is now free; Cycling remains Pro-only. |
| Power zones from FTP (May 2026) | ✅ Live — Cycling coach card in App.jsx shows a 5-zone power table below the FTP sparkline when `ftp_watts > 0` and unit is not HR. Z1 <55% / Z2 55–75% / Z3 75–90% / Z4 90–105% / Z5 >105% FTP; Z4–Z5 rendered in accent colour. |
| Sleep trend chart polish (May 2026) | ✅ Live — HistoryView sleep section: threshold raised from 3 to 5 check-ins; summary condensed to single sentence "Gemiddeld X.Xu slaap de afgelopen 30 dagen". |
| Periodisation phase chip (May 2026) | ✅ Live — Cycling coach card shows BASE / BUILD / RECOVERY / PEAK chip derived from `enrolled_at_ms`. 7-week cycle: Base (wk 1–2) → Build (wk 3–5) → Recovery (wk 6) → Peak (wk 7). Only shown when `enrolled_at_ms` is set. |
| /api/subscribe rate limiting (May 2026) | ✅ Live — POST /api/subscribe now enforces 5 checkout initiations per IP per hour using the `auth_rate_limits` table; returns 429 on abuse. (C-B6) |
| Account deletion cleanup (May 2026) | ✅ Live — `handleDeleteAccount` in auth.js now cancels the user's active Mollie subscription (fire-and-forget) and revokes their Strava OAuth token (deauthorize API, with token refresh if expired) before erasing DB rows. (C-B4) |
| JWT invalidation after password reset (May 2026) | ✅ Live — migration 0075 adds `token_invalidated_at_ms` to `users` table. `handleResetPassword` sets it to `now`. `_shared/auth.js getUser` rejects tokens issued before `token_invalidated_at_ms`. Prevents stolen sessions surviving a password reset. (C-B5) |
| Multi-trainer Gym tier — consumer app [APP] (May 2026) | ✅ Live — migrations 0076–0079: `trainer_profiles`, gym model columns (`gyms.model/switch_auto_approve/trainer_tab_config_json`), gym_memberships columns (`show_in_client_app`, `team_view_opt_in`, `allow_trainer_switch`, `availability_status`, `availability_updated_at_ms`, `support_trainer_user_id`), `support_requests` table, `trainer_switch_requests` table. New `/api/client/` endpoints: `GET /trainer` (assigned trainer + team + pending switch/support + consent flag), `POST /support-request` + `GET /support-request/active`, `POST /switch-request` + `PATCH /switch-request/:id/cancel` + `GET /switch-requests`, `PATCH /trainer-switch-consent`. CoachView: Jouw trainer card (photo, bio, specialties, availability dot), Ons team chip row + profile sheet, Vraag om hulp bottom sheet (compose + sent/accepted/replied states), Wissel van trainer bottom sheet (trainer selection + message step + pending/cancel states). SettingsView > Trainers: Trainer instellingen section with allow-switch toggle (only shown when connected to gym). |

| Consumer App Enhancements batch (2026-05-22) | ✅ Live — C-E1: advanced cues filter; C-E2: DoneCard UX; C-E4: GuestConvertModal (`action=convert_guest`); C-E5: R583 BMI pace note (28–30); C-E6: referral programme (`/api/referral`, JF code, 14-day Pro grant); C-E7: push subscription infrastructure (migration 0080, `/api/subscribe-push`, SW handlers — dispatch needs CF Cron Worker); C-E8: progress sharing (Canvas 2D PNG + Web Share API); C-E9: PlanWeekView week navigation chevrons; C-E10: workout notes textarea → `executions.notes` → history display |

## Known Bugs to Fix

None currently. 🟢

### Shipped 2026-10-03 — remediation Waves 3, 4a, 5, 6

- **W3** — pool rebuilds can no longer discard earlier filters (`_safePool` + recorded guards
  + assembly backstop); long-cardio safety is a duration property, not a tag; volume floor 0.5
  stated via R519; R524 kept as a protective slow start, DCP → progression → weight as basis
  order, re-clamped after; R574 march dedupe; total session time bounded; R536/R534 by rule.
  Matrix 38 personas, `KNOWN_GAPS` empty.
- **W4a — user override.** `POST /api/plan` accepts `custom_steps` (library ids only, 400 on
  unknown, clamped), runs safety in ADVISORY mode via the same recorded guards (409 +
  `safety_ack` for blocking), stores `generated_by='user'`, exempt from C-G4, **protected from
  auto-regeneration** unless `replace_user_plan`. `pinned_exercise_ids` (1–3) seeds the engine.
  `SessionBuilder.jsx` reachable from "Can't do this today?" → "Ik doe iets anders". All
  three `day_plans` upserts now write `generated_by`. Request-level harness
  `scripts/plan-override-requests.mjs`. Verified live.
- **W5** — 0114 (72 cardio rows get primary muscles), 0115 (substitutions 23% → 96%
  reciprocated), 0116 (`protocol` ×77, `measurable` ×7). Both progression axis mappers fixed
  so cardio always credits Cardio — a pre-existing misroute 0114 would have spread.
- **W6** — schema section regenerated from live D1 (5 ghost tables removed, STRICT claim
  corrected), baseline 1020 regenerated 416 → 482, table-name guard.
- Smoke 65 → **70**; `npm test` 206/206.

**Open follow-ups:** `exercises` has `gym_id`/`visibility` columns but neither the planner's
base query nor `GET /api/exercises` filters on them — latent leak the day a gym-private
exercise is created (all 482 are global today). Pins sit under the C-G4 cap (product call).
R593/R594 call `dcpAgeFrom` without the plan date (determinism). `1040_seed_military.sql`
stale (1919 vs 2059 live). W4b (saved templates) not started.

### Shipped 2026-10-03 — remediation Waves 0–2 (see `docs/PLANNER_REMEDIATION_PLAN.md`)

- **W0** — goal read fixed (`App.jsx` read a column from the JSON blob); migration **0113**
  repaired the substitution graph (29 non-existent targets, 5 empty sheets). Ledger → 0114.
- **W1** — `scripts/planner-behaviour.mjs`: 36 personas × 8 properties × 60 dates, runs the
  real planner, asserts on steps. Found a live 500 (DCP bias with no sport) on first run.
- **W2** — every planner adaptation is explainable: 24 new labels, `INTERNAL_RULE_CODES`,
  R502/R524/R525 now trace, one accumulated volume sentence (**R519**), 81 NL entries.
  Guard W2.1 closes the category.
- **Also:** `situp_max` scoring curve (npm test was red); audit figure corrected to ×0.48.
- Smoke 64 → 65; `npm test` 206/206.

**Open from the matrix, queued for W3:** pool rebuilds (R518/R535/R540/R545/R561/R564) re-read
the unfiltered library and can put a rucksack lift test in a caesarean-recovery session;
R574 re-appends `weighted-march` unscaled; R524 runs after the rep floor; advanced strength
overruns the budget by 20–30 min; `optillen-vanaf-de-grond` leaks past R596.

### Fixed 2026-10-02 — planner audit (C-F16 / C-F17): five contradictions

Triggered by a `fat_loss` session of three rucksack marches, each prescribed as
2 x 18s although their names say 25, 30 and 40 minutes.

1. **R590 and R593 were inert.** `shuffled` is derived from `ctx.pool` once and
   the session is sliced from `shuffled`; both rules rewrote `ctx.pool` after
   that point. They printed their trace lines and changed nothing. Guard `A-F1`
   now fails on any `ctx.pool` write after the selection list is derived.
2. **153 of 247 timed exercises had no duration** (`metrics_json.base_duration_sec`),
   so all fell back to `?? 30`. 57 stated minutes only in their name — 731 min
   the planner could not see. It also disabled `isLongCardio` (`> 300`), so a
   50-minute run never had its sets clamped. Migration **0112** seeds all 153 and
   marks the 70 name-declared ones `fixed_duration` (never volume-scaled).
   **R595** drops any exercise longer than the whole session.
3. **DCP steered a plan the user had switched off.** R593 gated on `dcp.enabled`
   alone while the card used `dcpCardVisible`. Both now use `dcpCardVisible`.
4. **No variety guard.** Selection was a flat top-N. **R597** allows one exercise
   per movement family; the key is the trailing noun of the slug (last two tokens
   after dropping digits/units), which groups `knee-push-up`/`bent-knee-sit-up`
   where a qualifier stop-list did not.
5. **`military` was never filtered OUT.** R572 filters *to* military for military
   sessions; the mirror case did not exist. **R596** removes military cardio,
   skill tests, rucksack work and name-declared protocol prescriptions from
   civilian sessions — 76 exercises, keeping the 26 general strength movements.

**C-F17 — the nulmeting moved into training.** `dcp.last` was read in four places
and written by none, so the card sat at 0/19 and the bias aimed at a baseline
that never existed. The separate assessment screen was its intended writer and
was unreachable: `HistoryView` passed `onStartAssessment` straight to `DcpCard`'s
`onMeasure`, which is called as `onClick`, so React handed it a click event and
the screen rendered an empty preset list. **R598** now schedules two max-effort
sets (2-minute DCP protocol window, exempt from volume scaling) inside a normal
session when the DCP is a target and the baseline is missing or older than
`DCP_RETEST_DAYS`; `execution.js` writes the result back. Both entry points force
it into today's session and read "Zelfmeting gepland" once it is there.

**Lint and guards.** `functions/` had never been linted (see below).
`scripts/planner-behaviour.mjs` now runs the real planner over a fixture of real
library rows and asserts on the produced steps — every other guard reads source
text, which is how R590/R593 shipped inert. Smoke: 53 -> 62 checks.

### Fixed 2026-10-01 — PLAN-500 (plan generation down in production)

`_selectExercises(ctx)` destructures `checkIn, exercises, prefs, date, pregnancyContext`
from `ctx`, but **not** `bodyProfile`. The two DCP rules added in C-F13/C-F15 (R593
movement guarantee, R594 target bias) both read `bodyProfile?.sex`, which resolved to
nothing in that scope → `ReferenceError` → caught by the handler → `{error:"Internal
error"}` → PLAN-500 on every plan generation. Fixed by reading `ctx.sex`, which
`_initPlannerContext` already derives from the same `bodyProfile.sex`.

**Root cause was not the typo — it was that `functions/` has never been linted.**
`npm run lint` only ever ran `--workspace=client-app`, so the entire API, planner
included, had no `no-undef` check. Added root `eslint.config.js` covering
`functions/**/*.js` with Workers globals; `no-undef` and the other
will-throw-at-runtime rules are errors, the rest of `recommended` is a warning so a
retrofit does not bury real failures. Wired in as `npm run lint:functions`, which
`npm run lint` (and therefore `npm run smoke`) now runs. Guard verified by
reintroducing the exact bug: 2 errors, exit 1.

## Shipped 2026-08-11 — all items below LIVE and verified

| Item | Commit | Status |
|---|---|---|
| C-B17 cookie-only session auth (Bearer/localStorage fallback removed) | b4c3dcc | ✅ LIVE — verified: cookie round-trip, no token in bodies, Bearer rejected |
| GDPR deletion confirmation email (request + cancel, Resend) | db152d2 | ✅ LIVE |
| Switch-trainer sheet real availability status | 30fba92 | ✅ LIVE |
| Account deletion 500 fix | f944afd | ✅ LIVE — verified: guest create→delete→ok |
| X-27 baseline schema regenerated from production | (chore) | ✅ complete |
| justfit-ops worker (weekly D1 backup → R2 EU `justfit-db-backups-eu` + daily push dispatch) | (feat) | ✅ DEPLOYED — crons `0 2 * * SUN` + `0 7 * * *`; manual triggers `/run-backup` `/run-push` (Bearer `PUSH_DISPATCH_SECRET`); first backup 2.25 MB verified |
| C-E19: 4 new E2E journeys (workout/billing×2/settings) — 10 total green | (test) | ✅ complete |

Push secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_DISPATCH_SECRET`) are set
on justfit-app Pages env; worker has `PUSH_DISPATCH_SECRET` + `RESEND_API_KEY`. Values in the secrets vault.

---

## Sprint 4 — Complete (2026-05-29)

All five items shipped: C-G1 (Strava Pro gate), C-G2 (Push notifications Pro gate), C-G3 (History 30-day/unlimited), C-G4 (Plan regen 1/day/unlimited), C-F5 (Defensie readiness pathway, free). See FUNCTIONAL_DOCS.md for details.

## Sprint 5 — Trainer-client features (C-H)

| Item | Status |
|---|---|
| C-H1 — DPA consent flow | ✅ LIVE (2026-05-29) |
| C-H2 — Sessions view | ✅ LIVE (2026-05-29) |
| C-H3 — Credit balance | ✅ LIVE (2026-05-29) |
| C-H4 — Messaging | ✅ LIVE (2026-05-29) |

**New files:**
- `functions/api/client/consent.js` — GET/POST DPA consent
- `functions/api/client/sessions.js` — GET upcoming appointments
- `functions/api/client/packages.js` — GET session credit balances
- `functions/api/client/messages.js` — GET/POST/PATCH trainer-client messages

**Extended files:**
- `functions/api/client/trainer.js` — added `consent_json`, `gym_name`, `conv_unread_client` to response
- `packages/client-app/src/apiClient.js` — `signConsent`, `getSessions`, `getClientPackages`, `getMessages`, `sendMessage`, `markMessagesRead`
- `packages/client-app/src/App.jsx` — CoachView: consent modal gate, sessions strip, credits card, Berichten button + bottom-sheet chat thread, unread nav dot

## Lean & Clean Improvement Plan — Phases 1-2 (2026-06-12)

See `docs/IMPROVEMENT_PLAN.md` for the full checklist (Phases 3-4 pending, gated as described there).

| Item | Status |
|---|---|
| 1.1 — `fmtDateNL` shared formatter in planUtils.js | ✅ LIVE |
| 1.2 — Stray `fetch('/api…')` calls routed through apiClient.js | ✅ LIVE |
| 1.3 — Orphan `packages/trainer-app/` workspace removed | ✅ done (no deploy needed) |
| 1.4 — C-B14/C-B15 confirmed resolved, removed from ROADMAP.md | ✅ done (no deploy needed) |
| 1.5 — CoachView extracted to `CoachView.jsx`, lazy-loaded | ✅ LIVE — main chunk 591.68 kB → 531.02 kB (CoachView own 61 kB chunk) |
| 2.1 — CoachView headers/buttons NL-first via `t()` | ✅ LIVE — new i18n.js section "COACH VIEW — section headers & buttons" |
| 2.2 — Trainer sessions/groepslessen/credits merged into one card | ✅ LIVE |
| 2.3 — Trainer unread badge refresh on `visibilitychange` | ✅ LIVE |

### isPro check pattern (use this in every new gate)

```js
// In any Pages Function handler, after resolving userId:
const entRow = await env.DB.prepare(`
  SELECT 1 FROM entitlements
  WHERE user_id = ?
    AND product_code IN ('pro', 'pro_consumer', 'pro_trial', 'trainer_grant')
    AND status IN ('active', 'trialing')
    AND ends_at_ms > ?
  LIMIT 1
`).bind(userId, Date.now()).first();
const isPro = !!entRow;
```

Never trust `prefs.isPro` alone for gate enforcement — always re-check entitlements server-side.

---

### ~~C-G1 — Strava sync → Pro gate~~ ✅ LIVE (2026-05-29)

`POST /api/strava-auth` and `POST /api/strava-sync` return 403 `{ error: 'Strava import vereist Pro', requiresUpgrade: true }` for free users. GET and DELETE remain ungated. SettingsView shows Pro badge + Upgrade CTA when free; card always visible.

---

### ~~C-G2 — Push notifications → Pro gate~~ ✅ LIVE (2026-05-29)

`POST /api/subscribe-push` returns 403 `{ error: 'Push notificaties vereisen Pro', requiresUpgrade: true }` for free users. GET and DELETE remain ungated. SettingsView shows Pro badge + Upgrade CTA on push toggle for free users.

---

**Files:** `functions/api/subscribe-push.js`, `packages/client-app/src/SettingsView.jsx`

**Backend — `subscribe-push.js` POST handler:**
After auth, resolve `isPro`. If `!isPro` return:
```js
return Response.json({ error: 'Push notificaties vereisen Pro', requiresUpgrade: true }, { status: 403 });
```
GET and DELETE remain ungated (free users should always be able to check and remove subscriptions).

**Frontend — `SettingsView.jsx` Account section (push toggle):**
- When `!isPro`: render toggle as disabled (`opacity: 0.4`, `pointerEvents: 'none'`); show `"Pro"` badge pill inline; below the toggle add: "Dagelijkse trainingsherinneringen — beschikbaar met Pro" with upgrade CTA.
- When `isPro`: existing toggle behaviour unchanged.

---

### C-G3 — Execution history → 30-day free / unlimited Pro

**Principle:** Recent data is fully visible. Depth beyond 30 days is a scale feature for athletes who've been consistent for months — exactly the users who will pay.

**Files:** `functions/api/execution.js`, `packages/client-app/src/apiClient.js`, `packages/client-app/src/App.jsx`, `packages/client-app/src/HistoryView.jsx`

**Backend — `execution.js` GET handler:**
After auth, resolve `isPro`. Build the executions SELECT:
```js
const cutoff = isPro ? 0 : Date.now() - 30 * 24 * 60 * 60 * 1000;
const rows = await env.DB.prepare(`
  SELECT ... FROM executions
  WHERE user_id = ?
    ${isPro ? '' : 'AND created_at_ms >= ?'}
  ORDER BY created_at_ms DESC
`).bind(...isPro ? [userId] : [userId, cutoff]).all();

return Response.json({ results: rows.results ?? [], truncated: !isPro });
```

**Frontend — `apiClient.js`:**
Update `getHistory()` to return `{ results, truncated }` instead of the raw array. Handle both shapes gracefully during the transition.

**Frontend — `App.jsx`:**
Update the history state and all consumers to use `history.results` (array) and store `history.truncated` separately.

**Frontend — `HistoryView.jsx`:**
Accept `historyTruncated` prop. When `true`, render at the bottom of the list:
```
┌─────────────────────────────────────────────────┐
│ Bekijk je volledige trainingsgeschiedenis        │
│ met Pro →                              [Upgrade] │
└─────────────────────────────────────────────────┘
```
Style: `rgba(255,255,255,0.04)` card, muted text, accent upgrade CTA. Do not hide any existing history entries.

---

### C-G4 — Plan regeneration → 1/day free / unlimited Pro

**Principle:** Every user gets a daily plan. Re-rolling for a different session is a depth/control feature.

**Files:** `functions/api/plan.js`, `packages/client-app/src/App.jsx`

**Backend — `plan.js` `onRequestPost`:**
After auth and `isPro` check, when `!isPro`:
```js
const existing = await env.DB.prepare(
  'SELECT plan_json FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1'
).bind(userId, today).first();
if (existing) {
  const plan = JSON.parse(existing.plan_json);
  return Response.json({ ...plan, capped: true });
}
```
Pro users skip this block entirely — always regenerate.

**Frontend — `App.jsx`:**
- When `plan?.capped === true`: suppress the regenerate button/icon; below the session card show a single muted line: "Je dagelijkse plan staat klaar — Pro gebruikers kunnen opnieuw genereren" with a small inline upgrade link.
- When `plan?.capped` is absent or `false`: existing regenerate behaviour unchanged.
- Set `plan.capped` to `false` on first load if undefined (defensive default).

---

### ~~C-F5 — Defensie readiness pathway~~ ✅ LIVE (2026-05-29)

Free permanently — no isPro gate. `KeuringReadinessCard` in CoachView above the level ladder. Target-mode keuring users: countdown chip, 4-item test checklist (1500m/push-ups/pull-ups/5km march) vs `KEURING_NORMS[clusterTarget]`, weakest-axis focus note. Open/fit-mode keuring users: Cooper benchmark + gap to next level + weakest axis. Disclaimer always shown. No migrations. `KEURING_NORMS` constant in `App.jsx`.

**Marketing site (M-F5):** separate deliverable in the `justfit-site` repo.

---

## Product TODO List

All items are on the v2 backlog. Risk / impact / complexity assessed for each.
Legend: 🟢 Low risk · 🟡 Medium risk · 🔴 High risk | ⚡ Low effort · 🔧 Medium effort · 🏗 High effort

### Ready to build — web-only, no blockers

| # | Item | Risk | Effort | Impact | Notes |
|---|---|---|---|---|---|
| C | **Level-appropriate cues** | 🟢 | ⚡ | Medium | Filter `💡💡`-prefixed cues in WorkoutView by `experience_level`; convention already in DB |
| D | **Log activity UX consolidation** | 🟢 | ⚡ | Low–Med | After session, show bonus-plan + extra-time input on the complete card instead of separate taps |
| E | **BMI-aware pace guidance** | 🟡 | 🔧 | Low–Med | `bmi_note` field in `instructions_json` or WorkoutView rule for obese BMI + cardio exercises |
| F | **`why` + `muscle_target` data seeding** | 🟢 | 🏗 | Medium | New fields in `instructions_json`; requires a migration seeding all ~290 exercises — data-heavy |

### Content-blocked (needs assets first)

| # | Item | Blocker | Notes |
|---|---|---|---|
| G | **Images/GIFs in instruction cards** | No images/GIFs exist yet | UI is trivial (`gif_url` on every step); blocked on content creation |

### Deferred by user

| # | Item | Risk | Effort | Notes |
|---|---|---|---|---|
| H | **Pro tier gating** | 🟡 | 🔧 | Feature flags + entitlements table already exist; needs UX + enforcement |
| I | **Stripe integration** | 🟡 | 🏗 | Depends on H; requires Stripe account + webhook handler + D1 subscription state |

### Requires native app (not web-only)

| # | Item | Notes |
|---|---|---|
| J | **Apple Watch / HealthKit** | Needs Swift iOS companion app (WorkoutKit bridge); TCX export is the web workaround |

### Women's Health v2

| # | Item | Risk | Effort | Notes |
|---|---|---|---|---|
| K | ~~**R526 — Perimenopause mode**~~ | ✅ | Done | migration 0056 + R526 rule (cap moderate, stress≥5→low, disable R520-R525) + SettingsView toggle + App banner |

---

## Coding Conventions

- **Functions**: plain JS (`.js`), no TypeScript, no bundler, no imports from npm
- **Frontend**: React functional components, all styles inline using `C.` design tokens; `App.jsx` owns app shell/orchestration, feature views may be split as lazy-loaded boundaries (`SettingsView.jsx`, `AwardsView.jsx`), and pure JS modules live in `src/`
- **DB timestamps**: always milliseconds (`Date.now()`), column suffix `_at_ms`
- **DB IDs**: always `crypto.randomUUID()`
- **Error responses**: always `Response.json({ error: "Internal error" }, { status: 500 })` with `console.error(e)` server-side
- **Commits**: conventional format `feat:`, `fix:`, `chore:`, `refactor:`
- **Deploy**: canonical manual release = `npm run smoke` → `git push` (backup) → `npm run build && npx wrangler pages deploy packages/client-app/dist --project-name=justfit-app --branch=main`
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
npm run build && npx wrangler pages deploy packages/client-app/dist --project-name=justfit-app --branch=main

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

## Database Migration Policy

### Adding a migration

1. Choose the next monotonic number (`0117`, `0118`, …). Never reuse a number, never skip one.
2. Write the file as `migrations/000N_description.sql`. Keep it additive where possible.
3. Apply to production: `npx wrangler d1 execute justfit-db --remote --file migrations/000N_description.sql`
4. **Update the baseline** — this is mandatory:
   - Schema change → merge new columns/tables into `migrations/baseline/1000_schema_core.sql` or `migrations/baseline/1010_schema_training.sql`
   - Exercise/awards data → regenerate `migrations/baseline/1020_seed_exercises.sql` from live D1: `node scripts/generate-baseline-seeds.mjs` (there is no "apply list"; do not hand-edit rows)
   - Cycling data → add to `migrations/baseline/1030_seed_cycling.sql`
   - Military data → add to `migrations/baseline/1040_seed_military.sql`
5. Update `docs/training-model-architecture.md` migration order table if it is a training-model change.
6. Update the "Current Build Status" table in this file.
7. Commit: `chore: migration 000N description + baseline update`

### Baseline files (source of truth for new environments)

```
migrations/baseline/
  1010_schema_training.sql  — training tables (run FIRST)
  1000_schema_core.sql      — all other tables (run SECOND)
  1020_seed_exercises.sql   — exercise/template/awards seed reference
  1030_seed_cycling.sql     — cycling workouts seed reference
  1040_seed_military.sql    — military programme data seed reference
migrations/legacy/
  README.md                 — explains that migrations/*.sql are the audit trail
docs/
  database-bootstrap.md     — full bootstrap procedure for new environments
```

The baseline files contain **merged** CREATE TABLE definitions — no ALTER TABLE chains.
The legacy migrations (`migrations/000X_*.sql`) remain in place as the audit trail.

### Rules

- **Never edit a migration that has been applied to production.** Migrations are append-only history.
- **Baseline must stay current.** Every schema migration must be reflected in the baseline before the PR is merged.
- **No auto-discovery.** There is no `migrations_dir` in `wrangler.toml`. Every migration is applied with an explicit `--file` flag.
- **D1 only.** Never apply SQLite-only pragmas (e.g. VACUUM, ATTACH) that D1 does not support.

---

## Drift Control

Four checks to enforce before merging any PR that touches the relevant area. Each is one line: what to verify, who is responsible, when it triggers.

- **Deploy consistency** — Verify that "After every change", "Deploy workflow", "Useful Commands" (CLAUDE.md) and "Deploy" (README.md) all show the identical three-step flow: `npm run smoke` → `git push` → `npm run build && npx wrangler pages deploy`. Owner: any dev. Triggers: every PR touching deploy/CI docs.
- **Architecture snapshot** — Confirm the `src/` module list and lazy-view boundaries in CLAUDE.md Project Structure match actual files on disk (`App.jsx`, `SettingsView.jsx`, `AwardsView.jsx`, `apiClient.js`, `messagePolicy.js`, `errorReporter.js`). Owner: dev adding/removing `src/` files. Triggers: every `src/` boundary change.
- **Migration numbering** — Before adding a migration, confirm no existing file shares the same `000N_` prefix; next valid number is `0118`; never reuse a number. Owner: any dev. Triggers: every migration PR.
- **Legal docs parity** — Confirm all 5 pages (`mission`, `how-it-works`, `privacy`, `terms`, `disclaimer`) expose Share + Email buttons, and `/api/legal-email` handles all 5 document IDs (`privacy`, `terms`, `mission`, `how_it_works`, `disclaimer`). Owner: any dev. Triggers: every legal content or email endpoint change.
