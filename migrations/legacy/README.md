# migrations/legacy/

The migration history for JustFit lives in the **parent directory** (`migrations/*.sql`), not here.

This `legacy/` folder exists as a navigation landmark. No files have been moved — the flat list of `migrations/0002_*.sql … 0092_*.sql` files IS the complete audit trail.

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
| 0048–0058 | Protocols bridge, run templates, sport tags, trainer tables, admin tables |
| 0059–0079 | Auth tokens, gyms, billing, trainer profiles, availability, switch requests |
| 0080–0081 | Push subscriptions (consumer), invoice templates + sub billing period (trainer) |
| 0082–0088 | Schema consolidation: drop zombie/redundant tables, merge auth_users + user_contact into users |
| 0089–0091 | Sprint 5 trainer portal foundation, scheduling, commercial+messaging |
| 0092     | Entitlements source CHECK extended to include 'trial' |

---

## Duplicate prefix ledger (X-4)

Several migration numbers were used by **both** the consumer app and the trainer portal,
applied independently to the same D1 database (`justfit-db`). All files were applied to
production as-is — **do not rename them**. The table below is the authoritative record.

| Prefix | Consumer app file | Trainer portal file | Status |
|--------|-------------------|---------------------|--------|
| 0059 | `0059_admin_magic_tokens.sql` | `0059_trainer_suspended_at.sql` | Both applied ✓ |
| 0060 | `0060_admin_login_attempts.sql` | `0060_gyms.sql` | Both applied ✓ |
| 0061 | `0061_gym_id_scoped.sql` | `0061_invoice_number_unique.sql` | Both applied ✓ |
| 0072 | `0072_billing.sql` | `0072_billing_subscriptions.sql` | Both applied ✓ |
| 0074 | `0074_trainer_message.sql` | `0074_waitlist.sql` | Both applied ✓ |
| 0080 | `0080_push_subscriptions.sql` (consumer) | `0080_invoice_templates.sql` (trainer) | Both applied ✓ |

### Why this happened

During the sprint period (Apr–May 2026), the consumer app and trainer portal were developed
in parallel and each repo incremented the migration counter independently. Since D1 has no
Wrangler-managed migrations table (all applied via `--file`), numbering collisions were not
caught until the audit.

### Resolution

- Files are **not renamed** — the filenames are references in PR history and docs.
- Baseline files (`migrations/baseline/`) reflect the merged current schema — no conflicts.
- **Next valid migration number: `0093`** (0092 applied 2026-06-17). Any new migration from
  either repo must use a number ≥ 0093 and be coordinated to avoid future collisions.

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
