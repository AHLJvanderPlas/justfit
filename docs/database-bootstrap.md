# JustFit — Database Bootstrap Guide

## When to use this

Use the baseline bootstrap when creating a **fresh** D1 database (staging, local dev, disaster recovery). Do **not** re-run these on the production database — the production DB already has the full migration history applied.

---

## Prerequisites

```bash
# Confirm you are logged in to the correct Cloudflare account
npx wrangler whoami
# Expected: ahljvanderplas@gmail.com / account: JustFit.cc

# Create a new D1 database (only if truly starting fresh)
npx wrangler d1 create <new-db-name>
# Add the new DB ID to wrangler.toml binding before continuing
```

---

## Bootstrap order

Apply the six baseline files **in this exact order**:

```bash
# Step 1 — Training schema (must come before core: execution_steps references exercises)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1010_schema_training.sql

# Step 2 — Core schema (users, auth, planning, executions, integrations)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1000_schema_core.sql

# Step 3 — Exercise library seed (308 general + 103 military exercises, 16 templates, 17 awards)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1020_seed_exercises.sql

# Step 4 — Cycling workouts seed (29 structured cycling workouts, cw01–cw29)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1030_seed_cycling.sql

# Step 5 — Military programme data (87 aliases, 13 templates, 1919 template items)
#           Requires exercises from Step 3 to be present first
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1040_seed_military.sql

# Step 6 — Running Coach programme templates (5 templates, 140 schedule items)
#           Requires exercises from Step 3 to be present first
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1050_seed_running.sql
```

All seed files are **self-contained executable SQL** — no additional migration replay required. Run them as-is against a fresh database.

---

## What each baseline file contains

| File | Contents | Derives from |
|------|----------|-------------|
| [1010_schema_training.sql](../migrations/baseline/1010_schema_training.sql) | `exercises`, `cycling_workouts`, `exercise_aliases`, `workout_protocols`, `workout_protocol_steps`, `program_templates`, `program_template_items` + indexes | 0001, 0035, 0043, 0044 |
| [1000_schema_core.sql](../migrations/baseline/1000_schema_core.sql) | All identity, auth, planning, execution, commercial, audit, body/cycle, and integration tables + indexes | 0001, 0006–0009, 0013–0014, 0017–0019, 0022–0026, 0028, 0036, 0038–0042 |
| [1020_seed_exercises.sql](../migrations/baseline/1020_seed_exercises.sql) | 482 exercises, 16 session templates, 12 awards — a regenerated snapshot of live D1 (2026-10-03), so it reflects every exercise-data migration through 0116 | all of them (generated, not assembled per migration) |
| [1030_seed_cycling.sql](../migrations/baseline/1030_seed_cycling.sql) | 29 structured cycling workouts (cw01–cw29) + 29 workout_protocols + 101 workout_protocol_steps | 0035, 0037, 0051 |
| [1040_seed_military.sql](../migrations/baseline/1040_seed_military.sql) | 87 exercise aliases, 13 programme templates, 1919 template items | 0046, 0047, 0048, 0049 |
| [1050_seed_running.sql](../migrations/baseline/1050_seed_running.sql) | 5 Running Coach programme templates (5km/10km/15km/20km/30km) + 140 schedule items | 0052 |

---

## Design decisions

### Why 1010 before 1000?

`execution_steps.exercise_id` is a FK to `exercises(id)`. SQLite will accept the table creation even if the referenced table does not exist yet (FKs are not enforced unless `PRAGMA foreign_keys=ON` is set), but declaring the FK correctly requires exercises to exist first. Running training schema first avoids the ambiguity.

### Why are the seed files self-contained rather than referencing legacy migrations?

The seed files were originally reference documents pointing to legacy migrations for replay. This required manual multi-step execution and was error-prone. As of 2026-05-03, they are **executable snapshots**:

- 1020: generated from production DB snapshot + 0045 supplement (WHERE NOT EXISTS) + 0033 supplement (INSERT OR IGNORE)
- 1030: generated from production DB snapshot (all 29 workouts including 0037 updates) + 0051 protocol rows
- 1040: verbatim content of 0046 + 0047 (already portable INSERT OR IGNORE + SELECT-based resolution)
- 1050: verbatim content of 0052 (Running Coach programme templates)

All seed files use idempotent patterns (`INSERT OR IGNORE`) — safe to run against a fresh or partially-seeded DB.

### Why keep the legacy migrations in place?

There is no `migrations_dir` in `wrangler.toml` — D1 migrations are applied manually with explicit `--file` flags. Moving files would break no tooling, but it would orphan audit trail references in docs, CLAUDE.md, and PR history. The conservative choice is to keep all `migrations/000X_*.sql` files in place.

---

## Environment policy

| Environment | How to update |
|-------------|--------------|
| **Production** (`justfit-db`) | Apply numbered migrations only: `npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql` |
| **Staging / dev** | Use the baseline bootstrap from scratch, OR apply individual migrations sequentially |
| **Local `wrangler dev`** | Wrangler does not auto-apply migrations. Apply the same way as staging using `--local` instead of `--remote`. |

---

## After adding a migration

1. Apply the migration to production: `npx wrangler d1 execute justfit-db --remote --file migrations/000X_name.sql`
2. Update the baseline to match. There is **no "apply list"** to append to — an earlier version of this
   policy said to add each data migration to one, nobody did, and by October 2026 the exercise snapshot
   was 416 rows against 482 live and referenced nothing after migration 0045. Hand-patching reproduces
   that drift. The procedure is:
   - **Schema changes** → merge the new columns/tables into the CREATE TABLE definitions in `1000_schema_core.sql` or `1010_schema_training.sql` (still manual — check against `PRAGMA table_info(<table>)` on the live DB, not against the migration file).
   - **Seed data** (exercises, session_templates, awards, cycling_workouts, aliases, programme templates) → **regenerate from live D1**; never hand-edit rows:
     ```bash
     npx wrangler whoami                          # must be the account that owns justfit-db
     node scripts/generate-baseline-seeds.mjs     # read-only SELECTs; rewrites 1020, 1030 and 1040
     ```
     The generator rewrites all three seed files with generic headers. If you only want one, restore the
     others from version control afterwards. Then update the header of the file you keep: generated date,
     row counts and "migration coverage" (the last migration number the live DB had when you ran it).
   - Check row counts against live: `SELECT count(*) FROM exercises` should equal the `INSERT` count in `1020_seed_exercises.sql`.
3. Update the migration order table in `docs/training-model-architecture.md` (for training-model changes)

Known gap: `1040_seed_military.sql` and `1030_seed_cycling.sql` have not been regenerated since the
original snapshot (live now has 2059 `program_template_items` and 18 `program_templates`; 1040 reflects
1919 items). Regenerate them with the same command when next touching the military or cycling data.

---

## Pending migrations

| Migration | Contents | Blocker |
|-----------|----------|---------|
| 0053 | Sport support tags (59 exercises) | ✅ applied |
| 0054 | Sport mobility tags (59 exercises) | ✅ applied |
| 0055 | `why` + `muscle_target` fields on exercises | ✅ applied |
| 0056 | Perimenopause mode — `cycle_profile.mode` CHECK extension + R526 rule | ✅ applied |
| 0057–0116 | All applied (see `migrations/`) | — |
| 0117+ | Next available migration slot | — |

## Military data status (post-0049)

All 52 originally-deferred military `program_template_items` are now resolved:
- Migration 0048: 2 items (`hardlopen-zone-3-5-minuten` in KC2 + KC3)
- Migration 0049: 50 items (`optillen-vanaf-de-grond` ×48, `til-draagtest-gewicht-plaatsen-naar-heupen` ×1, `til-draagtest-full-exercise` ×1)

The baseline (`1040_seed_military.sql`) reflects all 1919 template items.
