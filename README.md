# JustFit.cc

Privacy-first, consistency-driven fitness PWA. **Consistency > Intensity**.

Live: [justfit.cc](https://justfit.cc)

## Stack

- **Frontend**: React + Vite, single `src/App.jsx`, inline styles, no router
- **API**: Cloudflare Pages Functions (`/functions/api/`), plain JS, no npm
- **Database**: Cloudflare D1 (SQLite) — bound as `DB`
- **Auth**: JWT via Web Crypto API (no external libs), passkeys/Face ID, magic links

## Features

- Daily adaptive workout plans via deterministic rule-based planner (v1.6.0)
- Full coaching execution UX: instruction cards, rep-by-rep tap counting, rest countdowns, difficulty controls, exercise substitution
- Pregnancy & postnatal mode: planner rules R530–R544, adapted rest timers, breathing reminders, pelvic floor coaching
- Consistency score with resilience bonus (perceived exertion tracking)
- Wake Lock API — screen stays on during workout
- Rich actual_json tracking per execution step (reps per set, actual rest, target adjustments, substitutions)
- Passkey / Face ID login (WebAuthn ES256), magic links, forgot password
- PWA — installable, dark theme

## Development

```bash
npm install
npm run dev          # local Vite dev server
```

## Deploy

```bash
git push             # push to main → auto-deploys via Cloudflare Pages (~30s)
```

## Migrations

```bash
npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql
```

See `CLAUDE.md` for full project context, schema, and coding conventions.
See `WORKOUT_EXECUTION_UX.md` for the coaching interface spec (fully implemented).
