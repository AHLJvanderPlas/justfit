# JustFit.cc

Privacy-first, consistency-driven fitness PWA. **Consistency > Intensity**.

Live: [justfit.cc](https://justfit.cc)

## Stack

- **Frontend**: React + Vite, single `src/App.jsx`, inline styles, no router
- **API**: Cloudflare Pages Functions (`/functions/api/`), plain JS, no npm
- **Database**: Cloudflare D1 (SQLite) — bound as `DB`
- **Auth**: JWT via Web Crypto API (no external libs), passkeys/Face ID, magic links

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
