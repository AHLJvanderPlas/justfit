# Phase 2 Import Note — Military Data

**Date**: 2025-05-03
**Migrations**: 0044–0047

---

## What Was Imported

| Table | Rows |
|-------|------|
| `exercises` | 103 |
| `exercise_aliases` | 87 |
| `program_templates` | 13 |
| `program_template_items` | 1867 |

---

## Exercises: 103 of 107 Resolved

Source: `defensie-exercise-catalogue-import-ready.json` (107 entries).

4 entries were deferred (see below). 103 were imported using `INSERT WHERE NOT EXISTS slug` — exercises whose slugs were already present from migrations 0029–0034 are preserved without modification; only genuinely new slugs were added.

---

## Deferred Exercises (4)

These 4 entries remain unimported. They are NOT in the `exercises` table as active canonical rows.

| Slug | Confidence | Reason |
|------|-----------|--------|
| `optillen-vanaf-de-grond` | low | Object/load completely unspecified — cannot be safely prescribed without weight/object definition |
| `til-draagtest-full-exercise` | medium | Military test simulation — load and object specs missing |
| `til-draagtest-gewicht-plaatsen-naar-heupen` | medium | Military test movement — load weight unspecified in source |
| `hardlopen-zone-3-5-minuten` | medium | Source sample says 2 min, name says 5 min — genuine data conflict |

**Resolution path**: A trainer must specify the missing parameters. Once resolved, add a small migration to insert these 4 rows. No code changes needed.

---

## Exercise Aliases: 87 Added

87 aliases were added mapping name variants to canonical exercise slugs. Aliases are globally unique (enforced by UNIQUE index added in 0044).

Alias categories:
- **Typo corrections**: Bycicle crunch, Heug Brug, Pylo Push Up, Hand Releas Push Up, Marsten (6 km/u)
- **Plural variants**: Burpees, Broad Jumps, Lunges, Squat Jumps, Tuck Jumps, Shoulder taps, Mountain Climbers
- **Case variants**: Back Squat, Bird Dog, Dead Bug, Flutter Kicks, Goblet Squat, etc.
- **Dutch grammar variants**: Zijwaarts plank, Voorwaarts plank, Rompstabiliteit: Zijwaartse plank
- **Running zone notation variants**: spacing variants (2x 10 min vs 2x10 minuten), loop suffix, min abbreviations
- **Marsen variants**: speed notation (km/h vs km/u), weight format variants
- **Merged entries**: Video afspelen → cooling-down, Wisselsprong → wissel-sprongen

3 aliases were silently skipped by INSERT OR IGNORE — either duplicate alias texts or targets not yet present in the DB at execution time.

---

## Program Templates: 13

One `program_templates` row per schema+cluster combination from `defensie-matrix-clean.json`:

| Slug | Programme | Level | Weeks |
|------|-----------|-------|-------|
| `keuring-basis` | Keuring Basis | beginner | 6 |
| `keuring-cluster-1` | Keuring Cluster 1 | beginner | 6 |
| `keuring-cluster-2` | Keuring Cluster 2 | beginner | 6 |
| `keuring-cluster-3` | Keuring Cluster 3 | intermediate | 6 |
| `keuring-cluster-4` | Keuring Cluster 4 | intermediate | 6 |
| `keuring-cluster-5` | Keuring Cluster 5 | advanced | 6 |
| `keuring-cluster-6` | Keuring Cluster 6 | advanced | 6 |
| `opleiding-cluster-1` | Opleiding Cluster 1 | beginner | 6 |
| `opleiding-cluster-2` | Opleiding Cluster 2 | beginner | 6 |
| `opleiding-cluster-3` | Opleiding Cluster 3 | intermediate | 6 |
| `opleiding-cluster-4` | Opleiding Cluster 4 | intermediate | 6 |
| `opleiding-cluster-5` | Opleiding Cluster 5 | advanced | 6 |
| `opleiding-cluster-6` | Opleiding Cluster 6 | advanced | 6 |

---

## Program Template Items: 1867 of 1919

1919 total matrix items. 1867 imported, 52 skipped.

### Skipped Items (52): Due to Deferred Exercises

All skipped items reference one of the 4 deferred exercises. No placeholder rows were created.

| Deferred exercise | Items skipped |
|-------------------|--------------|
| `optillen-vanaf-de-grond` | 34 |
| `til-draagtest-full-exercise` | 6 |
| `til-draagtest-gewicht-plaatsen-naar-heupen` | 6 |
| `hardlopen-zone-3-5-minuten` | 6 |
| **Total** | **52** |

These items are distributed across all 6 Opleiding clusters. When the deferred exercises are resolved and imported, a follow-up migration can insert the 52 missing items with the same pattern used in 0047.

---

## Runtime Status

The live military planner (`plan.js`) continues to read from the `exercises` table using tag-based filtering. It does not yet query `program_templates` or `program_template_items`. Current app behavior is unchanged.

---

## What Remains Before Runtime Adoption

1. **Resolve 4 deferred exercises** — trainer must supply missing load/duration data
2. **Import deferred items** — ~52 matrix items pending (small follow-up migration)
3. **Runtime migration** — rewrite the military scheduler to read from `program_templates` + `program_template_items` instead of tag-based exercise pool selection (Phase 3)
4. **Exercise quality audit** — compare the 103 new rows against existing 0029-era rows for the overlapping slugs; decide whether to update the older rows with richer muscle/instruction data from the import-ready file

No code changes needed for steps 1–2. Step 3 is a `plan.js` refactor (deferred).
