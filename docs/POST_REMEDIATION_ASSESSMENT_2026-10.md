# Post-remediation assessment — what is weak now, and how to fix it

**Date:** 2026-10-04
**Follows:** `PLANNER_AUDIT_2026-10.md` (findings) and `PLANNER_REMEDIATION_PLAN.md` (complete).
**Method:** every figure below was measured against the live database, the served site, or the
current source — not estimated.

---

## 0. Verdict

The planner is now **correct and guarded**: 73 smoke checks, 41 personas × 9 properties × 60
dates in the behavioural matrix, nothing waived, e2e 10/10. The weaknesses that remain are not
in the engine. They are **around** it — in how changes reach the database, how releases are
gated, the security posture of the client, and the two files that have absorbed most of the
codebase's weight. Ranked by the cost of leaving them:

| # | Finding | Severity | Effort |
|---|---|---|---|
| F1 | The database has no record of which migrations were applied | **Critical** (process) | Small |
| F2 | The e2e release gate is enforced by nobody | **High** (process) | Small |
| F3 | CSP allows `'unsafe-inline'` for both scripts and styles | **High** (security) | Script: small · Style: large |
| F4 | Two files carry the codebase: `plan.js` 3 922 lines, `App.jsx` 4 323 | Medium (maintainability) | Medium |
| F5 | Planner arithmetic is duplicated on the client | Medium (drift) | Small |
| F6 | `cycle_profile` — safety-critical — is not a STRICT table | Medium (data) | Small |
| F7 | The `awards` table is dead data | Low | Small |
| F8 | Five product-tuning items left open by the remediation | Low | Small each |

---

## 1. Findings

### F1 — No applied-migration ledger in the database *(Critical)*

**Measured.** `_migrations` has **0 rows**. There are **118** migration files. The only record of
what has been applied is a sentence in two markdown files, maintained by hand.

**Why it matters.** This is exactly how migration 0033 "applied" with zero rows in April and
nobody knew until this week: `INSERT OR IGNORE` swallowed a CHECK violation, the ledger said
"applied", and nothing ever compared intent against outcome. **Eleven** migrations use
`INSERT OR IGNORE`; any of them could have done the same. The house rule says "migration files
are not a reliable source of truth for what exists; check the live schema" — but there is
nothing to check *against*.

**Fix.**
1. A `schema_migrations` table: `filename, sha256, rows_written, applied_at_ms, applied_by`.
2. A tiny `scripts/migrate.mjs` that is the **only** way a migration reaches D1: refuses a
   filename already recorded, refuses a recorded filename whose checksum changed (append-only
   enforced by the tool, not the doc), records `rows_written` from wrangler's response, and
   **fails loudly when a seed migration writes zero rows**.
3. Seed the table once with the current state (all 118 as applied, checksums from disk) — a
   baseline row, not a guess.
4. A smoke check: every file in `migrations/` has a row; every row's checksum matches disk.
   Delete the "next valid number" sentences from both CLAUDE.md files — the table is the ledger.
5. Policy: `INSERT OR IGNORE` only where the conflict is the *intended* idempotency, and the
   apply tool asserts the row count. A CHECK violation must fail, not vanish.

### F2 — The e2e gate is advisory *(High)*

**Measured.** `npm run e2e` exists, runs 10 journeys, and passed 10/10 in 39 s today. CLAUDE.md
requires it green before any structural `App.jsx` change. Waves 4a and 4b changed `App.jsx`
substantially. **Nobody ran it** — not the two agents, not me — because nothing enforces it:
`npm run smoke` does not call it and there is no CI.

**Why it matters.** A gate that is green by luck is not a gate. This one spins up a local
wrangler dev server, so it is too slow to live inside `smoke`; that is the only reason it was
skipped, and it will be skipped again.

**Fix.** `npm run release` = `smoke` + `e2e`, and the canonical deploy flow in CLAUDE.md names
`release`, not `smoke`. Keep `smoke` as the fast inner loop. If 40 s is still too much, run e2e
conditionally: when `git diff --name-only <last-deploy-tag>` touches `App.jsx`, `WorkoutView`,
`SettingsView`, `SessionBuilder` or `auth.js`. Tag each deploy so that diff is computable.

### F3 — `'unsafe-inline'` on both `script-src` and `style-src` *(High, two very different sizes)*

**Measured, as served.** One CSP header (correct — the house rule's intersection trap is not
present). `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' …`.

**Script — small.** The only reason is **3 inline `<script>` blocks in `index.html`** (the
pre-paint theme and accent script). No inline event handlers anywhere. Move those three to an
external file, or give them a nonce from the Pages Function that serves `index.html`. This is
an afternoon and removes the more dangerous of the two allowances.

**Style — large, and growing.** **2 392 `style={{` props across 20 files.** The house rule
cites a sibling project reaching ~3 400 before a "multi-day refactor"; this one is on the same
trajectory, and Waves 4a and 4b added to it because the client-app convention says "all styles
inline with `C.` tokens" while the security guardrail says "no new inline styles". Both agents
flagged the contradiction. **Resolve it in CLAUDE.md first**, then ratchet:

1. New code: CSS classes in one `styles.css`, tokens exposed as CSS custom properties (the
   `--accent` family already exists — extend it). Dynamic values on SVG use attributes.
2. A smoke ratchet: `style={{` count may only fall. This stops the bleeding the day it lands.
3. Migrate one view per release, starting with the smallest. Do not attempt all 2 392 at once.

### F4 — Two files carry the codebase *(Medium)*

**Measured.** `plan.js`: 3 922 lines, 49 functions; `onRequestPost` alone is **582 lines**, the
four pipeline stages 325–456 each. `App.jsx`: 4 323 lines, 15 components; one component is
**~1 700 lines**, `Dashboard` 794.

**Why it matters.** Not correctness — the matrix guards behaviour, which is why incremental
refactoring is now *safe*. The cost is every cold start: each agent in this engagement spent its
first ten minutes reading these two files, and every future change pays the same tax. A 582-line
request handler also mixes four concerns (parsing, cap/override, planner call, persistence)
that each deserve a test of their own.

**Fix.** Extract, do not rewrite:
- `onRequestPost` → `_shared/planRequest.js` (parse + validate + cap/override decision) and a
  thin handler. The request harness already tests the decision logic end-to-end.
- `App.jsx`: the 1 700-line component and `Dashboard` out to their own lazy boundaries,
  following the existing `SettingsView`/`CoachView` pattern (9 lazy views already exist).
- A line-count ratchet on both files so they cannot grow back.

### F5 — Duplicated planner arithmetic on the client *(Medium)*

**Measured.** `SessionBuilder.jsx` mirrors `getDefaultRest`; `my-sessions.js` ports
`estimateMins`. The W4b harness asserts the estimate port equals the client's — good — but the
rest-time mirror is unguarded, and `packages/shared/` exists precisely for this ("design tokens,
types, auth helpers, rule engine") and holds neither.

**Fix.** Move `getDefaultRest` and `estimateMins` to `packages/shared/src/` and import from
both sides. Delete the two copies. The existing equality assertion becomes an import.

### F6 — `cycle_profile` is not STRICT *(Medium)*

**Measured.** 17 non-STRICT tables; the consumer app writes to 7 of them. `cycle_profile` holds
pregnancy and postnatal mode — the inputs to R530–R544, the engine's hardest safety rules. A
non-STRICT table accepts a mistyped write silently.

**Fix.** Rebuild `cycle_profile` as STRICT using the proven 0100 pattern (create, copy, drop,
rename, with row-count assertions). Then `period_log` and `pregnancy_weekly_log`. Leave the
trainer-side tables for the trainer workstream.

### F7 — The `awards` table is dead data *(Low)*

**Measured.** 12 rows; 37 definitions in `AwardsView.jsx`; **0** server reads of `awards`;
**0** writes to `user_awards` (only the deletion batch touches it). Migration 0033 inserted
nothing and nothing noticed, because nothing looks.

**Fix.** Pick one honestly. Either the client owns awards (it does, today, and it works) — then
drop both tables, remove them from the deletion batch and the export, and record that in a
migration. Or awards become data — then the client reads the table and `user_awards` is written
on unlock. I would drop: the second option is a feature nobody asked for.

### F8 — Product-tuning items the remediation left open *(Low)*

Each is a small, deliberate call rather than a bug:

- **Unmeasured-user cardio at 20 min** — revisit after a week of real first sessions.
- **R525 appends a mobility exercise for female users only** — it now traces, but *why* is
  documented nowhere. Either write the rationale or remove the sex gate.
- **Free-tier check-in adaptation never applies once a plan exists** — the C-G4 cap answers
  before `adapt_mode`. Adapting today's plan to a check-in is not a re-roll; it should be exempt
  like `custom_steps`, pins and `force_assessment` now are.
- **Recalibrate is silent on a user-authored day** — the preserved plan is returned and nothing
  tells the user why. One sentence in the UI.
- **One-tap template use never shows the R598 measurement offer** that the builder shows.

---

## 2. Advice — the order to do it in

```
A  process      F1 migration ledger + F2 release script           2 deploys   ← first
B  security     F3 script-src (3 blocks) + style ratchet          1 deploy
C  structure    F4 + F5 together, with line-count ratchets        2–3 deploys
D  data         F6 STRICT rebuild · F7 drop awards                 2 deploys
E  product      F8 as one batch, after a week of real use          1 deploy
```

**A first, because everything after it is a change to the database or to `App.jsx`**, and A is
what makes those changes verifiable. B's script half is small enough to do the same day. C is
the one that pays back on every subsequent change. D and E can wait for a quiet week.

## 3. What not to do

- **Do not rewrite `plan.js`.** The matrix makes incremental extraction safe; a rewrite would
  throw that safety away.
- **Do not migrate 2 392 inline styles in one pass.** Ratchet, then one view per release.
- **Do not reconstruct the migration ledger by guessing.** Record the current state as the
  baseline row and move forward.
- **Do not add a CI system to fix F2.** A `release` script the deploy flow actually names is
  enough for a one-person project; CI is a separate decision.
