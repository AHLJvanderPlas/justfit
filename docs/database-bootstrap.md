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

Apply the five baseline files **in this exact order**:

```bash
# Step 1 — Training schema (must come before core: execution_steps references exercises)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1010_schema_training.sql

# Step 2 — Core schema (users, auth, planning, executions, integrations)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1000_schema_core.sql

# Step 3 — Exercise library seed (308 general + 103 military exercises, 16 templates, 17 awards)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1020_seed_exercises.sql

# Step 4 — Cycling workouts seed (29 structured cycling workouts, cw01–cw29)
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1030_seed_cycling.sql

# Step 5 — Military programme data (87 aliases, 13 templates, 1867 template items)
#           Requires exercises from Step 3 to be present first
npx wrangler d1 execute <db-name> --remote --file migrations/baseline/1040_seed_military.sql
```

All seed files are **self-contained executable SQL** — no additional migration replay required. Run them as-is against a fresh database.

---

## What each baseline file contains

| File | Contents | Derives from |
|------|----------|-------------|
| [1010_schema_training.sql](../migrations/baseline/1010_schema_training.sql) | `exercises`, `cycling_workouts`, `exercise_aliases`, `workout_protocols`, `workout_protocol_steps`, `program_templates`, `program_template_items` + indexes | 0001, 0035, 0043, 0044 |
| [1000_schema_core.sql](../migrations/baseline/1000_schema_core.sql) | All identity, auth, planning, execution, commercial, audit, body/cycle, and integration tables (including `support_tokens`) + indexes | 0001, 0006–0009, 0013–0014, 0017–0019, 0022–0026, 0028, 0036, 0038–0042 |
| [1020_seed_exercises.sql](../migrations/baseline/1020_seed_exercises.sql) | 411 exercises (308 general library + 103 military from 0045), 16 session templates, 17 awards (12 general + 5 running milestones from 0033) | 0002, 0004–0005, 0010–0012, 0015–0016, 0020–0021, 0027, 0029–0034, 0040, 0045 |
| [1030_seed_cycling.sql](../migrations/baseline/1030_seed_cycling.sql) | 29 structured cycling workouts (cw01–cw29) | 0035, 0037 |
| [1040_seed_military.sql](../migrations/baseline/1040_seed_military.sql) | 87 exercise aliases, 13 programme templates, 1867 template items | 0046, 0047 |

---

## Design decisions

### Why 1010 before 1000?

`execution_steps.exercise_id` is a FK to `exercises(id)`. SQLite will accept the table creation even if the referenced table does not exist yet (FKs are not enforced unless `PRAGMA foreign_keys=ON` is set), but declaring the FK correctly requires exercises to exist first. Running training schema first avoids the ambiguity.

### Why are the seed files self-contained rather than referencing legacy migrations?

The seed files were originally reference documents pointing to legacy migrations for replay. This required manual multi-step execution and was error-prone. As of 2026-05-03, they are **executable snapshots**:

- 1020: generated from production DB snapshot + 0045 supplement (WHERE NOT EXISTS) + 0033 supplement (INSERT OR IGNORE)
- 1030: generated from production DB snapshot (all 29 workouts including 0037 updates)
- 1040: verbatim content of 0046 + 0047 (already portable INSERT OR IGNORE + SELECT-based resolution)

All five files use idempotent patterns — safe to run against a fresh or partially-seeded DB.

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
2. Update the relevant baseline file to reflect the change:
   - Schema changes → update `1000_schema_core.sql` or `1010_schema_training.sql` (merge the new columns/tables into the CREATE TABLE definitions)
   - Exercise/awards seed data → append INSERT statements to `1020_seed_exercises.sql`; or re-run `node scripts/generate-baseline-seeds.mjs` for exercises/awards/cycling
   - Cycling seed data → re-run `node scripts/generate-baseline-seeds.mjs` (updates 1030)
   - Military seed data → append to `1040_seed_military.sql` (or re-run generator once training model tables exist in production)
3. Update the migration order table in `docs/training-model-architecture.md` (for training-model changes)

---

## Pending migrations

| Migration | Contents | Blocker |
|-----------|----------|---------|
| 0049+ | Map `cycling_workouts` → `workout_protocols` | Phase 3b (deferred) |

## Still-deferred military data (post-0048)

3 exercises remain unresolvable without trainer input. 46 `program_template_items` that reference them are also excluded from the baseline.

| Exercise slug | Reason still deferred |
|---|---|
| `optillen-vanaf-de-grond` | Object/load completely unspecified — cannot be safely prescribed |
| `til-draagtest-full-exercise` | Defensie Til/draagtest test load and object not in any local source |
| `til-draagtest-gewicht-plaatsen-naar-heupen` | Load weight unspecified in all source data |

When trainer supplies the missing specifications, create migration `0049` (or next available number) to import those exercises and backfill the 46 items.
