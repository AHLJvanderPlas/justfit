# JustFit.cc

Privacy-first, consistency-driven fitness PWA. **Consistency > Intensity**.

Live: [justfit.cc](https://justfit.cc)

## Stack

- **Frontend**: React + Vite → Cloudflare Pages, single `src/App.jsx`, inline styles, no router
- **API**: Cloudflare Pages Functions (`/functions/api/`), plain JS, no npm
- **Database**: Cloudflare D1 (SQLite) — binding: `DB`
- **Auth**: JWT via Web Crypto API (no external libs), passkeys/Face ID, magic links
- **Email**: Resend

## Features

- Daily adaptive workout plans via deterministic rule-based planner (v1.6.0)
- Full coaching execution UX: instruction cards, rep-by-rep tap counting, rest countdowns, difficulty controls, exercise substitution
- Pregnancy & postnatal mode: planner rules R530–R544, adapted rest timers, breathing reminders, pelvic floor coaching
- Consistency score with resilience bonus (perceived exertion tracking)
- Wake Lock API — screen stays on during workout
- Rich actual_json tracking per execution step (reps per set, actual rest, target adjustments, substitutions)
- Passkey / Face ID login (WebAuthn ES256), magic links, forgot password
- PWA — installable, dark theme

## Local development

```bash
npm install
npm run dev
```

## Deploy

Push to `main` — Cloudflare Pages auto-deploys in ~30s.
Never run `wrangler pages deploy` manually.

## Environment variables (set in Cloudflare Pages → Settings → Variables)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | JWT signing key |
| `RESEND_API_KEY` | Email sending |
| `EXERCISEDB_API_KEY` | Exercise GIF enrichment |
| `ADMIN_KEY` | Admin endpoint protection |
| `WEBAUTHN_RP_ID` | Passkey relying party ID (`justfit.cc`) |

## Database

- Database: `justfit-db`
- ID: `4c6fedf0-b9e2-4441-aa98-71c1420136c1`
- Binding: `DB`

Run a migration:
```bash
npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql
```

Query remotely:
```bash
npx wrangler d1 execute justfit-db --remote --command "SELECT ..."
```

## Critical rules

- Never add `account_id` to `wrangler.toml` — Pages infers it automatically
- Pages Functions: plain JS only, no npm packages, no TypeScript
- Always use `env.DB.batch()` for multiple D1 inserts, never sequential awaits in a loop

See `CLAUDE.md` for full project context, schema, coaching interface spec, and coding conventions.
