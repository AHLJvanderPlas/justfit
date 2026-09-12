// Running Coach helpers
// Programme schedule constants and DB-to-constant conversion.
// Primary source: program_template_items (run-Nkm templates).
// Fallback source: RUN_PROGRAMS constant (retained — not yet retired).

export const RUN_PROGRAMS = {
  5: [
    {hiit:2,zone2:7},{hiit:3,zone2:7},{hiit:3,zone2:8},{hiit:4,zone2:8},
    {hiit:4,zone2:9},{hiit:5,zone2:9},{hiit:5,zone2:9},{hiit:6,zone2:10},
  ],
  10: [
    {hiit:3,zone2:8},{hiit:4,zone2:8},{hiit:4,zone2:9},{hiit:5,zone2:9},
    {hiit:5,zone2:10},{hiit:6,zone2:10},{hiit:6,zone2:11},{hiit:6,zone2:11},
    {hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},
  ],
  15: [
    {hiit:4,zone2:9},{hiit:5,zone2:10},{hiit:5,zone2:10},{hiit:6,zone2:11},
    {hiit:6,zone2:11},{hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},
    {hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:14},{hiit:6,zone2:14},
  ],
  20: [
    {hiit:5,zone2:10},{hiit:5,zone2:11},{hiit:6,zone2:11},{hiit:6,zone2:12},
    {hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:13},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
  ],
  30: [
    {hiit:5,zone2:11},{hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},
    {hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},
  ],
  // ── Extended distances ─────────────────────────────────────────────────────
  // Zone2 levels cap at 21 (max continuous-run exercise level in DB).
  10.5: [  // ¼ Marathon — 13 weeks
    {hiit:3,zone2:8},{hiit:4,zone2:8},{hiit:4,zone2:9},{hiit:5,zone2:9},
    {hiit:5,zone2:10},{hiit:6,zone2:10},{hiit:6,zone2:11},{hiit:6,zone2:11},
    {hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},
    {hiit:6,zone2:13},
  ],
  21.1: [  // ½ Marathon — 18 weeks
    {hiit:5,zone2:10},{hiit:5,zone2:11},{hiit:6,zone2:11},{hiit:6,zone2:12},
    {hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:14},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:16},{hiit:6,zone2:16},
  ],
  25: [  // 25 km — 18 weeks
    {hiit:5,zone2:11},{hiit:6,zone2:11},{hiit:6,zone2:12},{hiit:6,zone2:12},
    {hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:14},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:17},
  ],
  35: [  // 35 km — 22 weeks
    {hiit:5,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},
    {hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:18},
    {hiit:6,zone2:18},{hiit:6,zone2:18},
  ],
  40: [  // 40 km — 24 weeks
    {hiit:5,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:13},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:17},
    {hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:18},
    {hiit:6,zone2:18},{hiit:6,zone2:18},{hiit:6,zone2:19},{hiit:6,zone2:19},
  ],
  42.2: [  // Marathon — 24 weeks
    {hiit:5,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:14},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},
    {hiit:6,zone2:17},{hiit:6,zone2:18},{hiit:6,zone2:18},{hiit:6,zone2:18},
    {hiit:6,zone2:18},{hiit:6,zone2:19},{hiit:6,zone2:19},{hiit:6,zone2:20},
  ],
  45: [  // 45 km — 26 weeks
    {hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:17},
    {hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:18},
    {hiit:6,zone2:18},{hiit:6,zone2:18},{hiit:6,zone2:19},{hiit:6,zone2:19},
    {hiit:6,zone2:19},{hiit:6,zone2:19},{hiit:6,zone2:20},{hiit:6,zone2:20},
    {hiit:6,zone2:20},{hiit:6,zone2:21},
  ],
  50: [  // 50 km — 28 weeks
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},
    {hiit:6,zone2:18},{hiit:6,zone2:18},{hiit:6,zone2:18},{hiit:6,zone2:18},
    {hiit:6,zone2:19},{hiit:6,zone2:19},{hiit:6,zone2:19},{hiit:6,zone2:19},
    {hiit:6,zone2:20},{hiit:6,zone2:20},{hiit:6,zone2:20},{hiit:6,zone2:20},
    {hiit:6,zone2:21},{hiit:6,zone2:21},{hiit:6,zone2:21},{hiit:6,zone2:21},
  ],
};
export const RUN_WARMUP_TAG = 'run_warmup';


// Running Coach helpers
// ---------------------------------------------------------------------------

// Convert program_template_items JOIN rows (from run-{N}km templates) into the
// same {targetKm: [{hiit, zone2}, ...]} shape as the RUN_PROGRAMS constant, so
// R556 can fall back to the constant when the DB returns nothing.
export function buildRunProgramsFromTemplates(rows) {
  const map = {}; // { [targetKm]: [{hiit: level, zone2: level}, ...] }
  for (const r of rows) {
    const km = parseFloat(r.program_template_id.replace('run-', '').replace('km', ''));
    if (!map[km]) map[km] = [];
    const weekIdx = r.block_week - 1;
    if (!map[km][weekIdx]) map[km][weekIdx] = {};
    const level = parseInt((r.slug ?? '').match(/(\d+)$/)?.[1] ?? '0', 10);
    if (r.session_order === 1) map[km][weekIdx].hiit = level;
    else if (r.session_order === 2) map[km][weekIdx].zone2 = level;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Core planner — pure function, no DB calls
// ---------------------------------------------------------------------------

// ── Run volume identification (R555 safety filter) ───────────────────────────
//
// R555 keeps unprepared runners off long runs by replacing generic running with a
// level-appropriate run/walk interval. It used to do that with a hardcoded list of
// four English slugs:
//
//   easy-run-outdoor, run-intervals-outdoor, tempo-run-outdoor, treadmill-run-steady
//
// Migrations since added ~70 more running exercises that the list never learned
// about — the Dutch `hardlopen-zone-*` military set (49), `run-continuous-level-7`
// through `-21` (up to a 180-minute long run), the Cooper test, fartlek, hill
// repeats and trail runs. All of them bypassed the filter, so a beginner with a
// high BMI and no running history could be handed a 120-minute long run out of the
// general pool. That is the exact outcome R555 exists to prevent (Principle 3).
//
// Identification is structural rather than a slug list, so a future migration
// cannot silently reopen the hole:
//
//   cardio  AND  (needs running shoes OR tagged `running`)  AND  not a warm-up/cool-down
//
// The equipment half alone is not enough: the military `hardlopen-*` exercises and
// `12-minuten-loop` declare `equipment_required_json = ["none"]`, so they reach users
// who own no running shoes at all. The `running` tag is what catches those.

/** True when an exercise represents real running volume (not a warm-up or cool-down). */
export function isRunVolumeExercise(ex) {
  if (!ex || ex.category !== 'cardio') return false;

  const parse = (s) => { try { return JSON.parse(s || '[]'); } catch { return []; } };
  const tags  = parse(ex.tags_json).map((t) => String(t).trim());
  const equip = parse(ex.equipment_required_json).map((e) => String(e).trim());

  // Warm-ups and cool-downs are prescribed alongside a run, not instead of one.
  if (tags.includes('session_phase') || tags.includes('run_warmup')) return false;

  return equip.includes('running_shoes') || tags.includes('running');
}
