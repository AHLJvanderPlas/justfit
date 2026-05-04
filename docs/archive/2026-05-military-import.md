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

## Exercises: 107 of 107 Resolved

Source: `defensie-exercise-catalogue-import-ready.json` (107 entries).

103 were imported in migration 0045 using `INSERT WHERE NOT EXISTS slug`. 4 entries were initially deferred and resolved by follow-up migrations:

| Slug | Resolved in | Notes |
|------|------------|-------|
| `hardlopen-zone-3-5-minuten` | 0048 | Duration conflict resolved (5 min used) |
| `optillen-vanaf-de-grond` | 0049 | Generic lift — prescribed as bodyweight/dumbbell |
| `til-draagtest-full-exercise` | 0049 | Military test simulation |
| `til-draagtest-gewicht-plaatsen-naar-heupen` | 0049 | Military test movement |

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

## Program Template Items: 1919 of 1919

All 1919 matrix items are now imported.

| Migration | Items added | Exercises resolved |
|-----------|-------------|-------------------|
| 0047 | 1867 | 103 (all non-deferred) |
| 0048 | 2 | `hardlopen-zone-3-5-minuten` (KC2 + KC3) |
| 0049 | 50 | `optillen-vanaf-de-grond` (×48), `til-draagtest-gewicht-plaatsen-naar-heupen` (×1), `til-draagtest-full-exercise` (×1) |
| **Total** | **1919** | **107** |

---

## Runtime Status

As of Phase 3b (May 2026), the military planner reads directly from `program_templates` + `program_template_items` for strength sessions (kracht / kracht_marsen / circuit). Tag-based pool filtering remains as a fallback when DB lookup returns fewer than 3 exercises.
