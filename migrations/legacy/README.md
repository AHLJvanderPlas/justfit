# migrations/legacy/

The migration history for JustFit lives in the **parent directory** (`migrations/*.sql`), not here.

This `legacy/` folder exists as a navigation landmark. No files have been moved — the flat list of `migrations/0002_*.sql … 0047_*.sql` files IS the complete audit trail.

---

## What "legacy" means here

These files were applied sequentially to the production D1 database (`justfit-db`). They are the authoritative record of every schema change and data import since the project started.

| Range | Content |
|-------|---------|
| 0002–0005 | Initial seed: awards, exercises batch 1, session templates |
| 0006–0009 | Auth tokens, passkeys, body-aware (cycle/pregnancy) |
| 0010–0012 | Exercise library batches 2 + 3 |
| 0013–0017 | Height, progression, run program, polarised training |
| 0018–0024 | DB hardening, email verification, rate limits, app events |
| 0025–0030 | Feedback, indexes, deleted users, military exercises |
| 0031–0034 | Session-phase exercises, instruction enrichment, running awards |
| 0035–0037 | Cycling Coach Phase 1–3a (cycling_workouts, TSS columns) |
| 0038–0042 | Strava OAuth, activity columns, execution rebuild, BYO creds |
| 0043–0047 | Training model foundation + military Defensie data import |

---

## Do not move or rename these files

The migration files in `migrations/` are applied manually with:

```bash
npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql
```

There is no auto-discovery. File names and paths are not tracked by Wrangler. Moving or renaming files does not affect the production DB — but it will break audit trail references in docs, PR history, and CLAUDE.md.

---

## For new environments

To bootstrap a fresh D1 database, see:

```
docs/database-bootstrap.md
migrations/baseline/
```

The baseline files contain the merged current schema (no ALTER TABLE chains) and
reference the legacy migrations for seed data.
