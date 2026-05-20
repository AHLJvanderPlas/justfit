// Military Coach constants and scheduling helpers (R570–R582)
// Used by plan.js runPlanner for military training session selection.

// Military Coach constants (R570–R582)
// ---------------------------------------------------------------------------

// Map (track, cluster) → program group key
export function getMilitaryGroup(track, cluster) {
  if (track === 'opleiding') {
    // O1–O6 (6 levels): thirds = 1-2 / 3-4 / 5-6
    if (cluster <= 2) return 'opleiding_low';
    if (cluster <= 4) return 'opleiding_mid';
    return 'opleiding_high';
  }
  // Keuring KB–K6 (7 levels: 0–6): thirds = 0-2 / 3-4 / 5-6
  if (cluster <= 2) return 'keuring_low';
  if (cluster <= 4) return 'keuring_mid';
  return 'keuring_high';
}

// Rolling block sequences per group — 4 training sessions per block, then rest is earned.
// No calendar-day dependency: any day can be a training day. Rest is a reward for work done.
//
// Sequence design (evidence-based periodization):
//   Session 1 — Zone 2 run (duurloop): aerobic base, lowest CNS demand, safe day-1 opener
//   Session 2 — Strength (kracht): neuromuscular work on aerobically-primed muscles
//   Session 3 — Intervals: highest VO2max stimulus, separated from Zone2 by a strength day
//   Session 4 — Strength/March: consolidates gains, lower intensity before earned rest
//   REST: earned recovery — adaptation happens here, not in the training sessions
export const BLOCK_SEQUENCES = {
  keuring_low:    ['duurloop', 'kracht',        'interval', 'kracht'],
  keuring_mid:    ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  keuring_high:   ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  opleiding_low:  ['duurloop', 'kracht',        'interval', 'kracht'],
  opleiding_mid:  ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  opleiding_high: ['duurloop', 'kracht_marsen', 'interval', 'kracht_marsen'],
};
export const SESSIONS_PER_BLOCK = 4;

// Volume progression across 6-block periodization cycle (index = cyclePosn - 1)
// Blocks 1-2: base (on-ramp → build), Blocks 3-4: peak volume, Block 5: deload, Block 6: peak/taper
export const BLOCK_VOLUMES = [0.75, 0.85, 1.00, 1.10, 0.60, 0.90];

// ---------------------------------------------------------------------------
// computeMilitaryPhase — rolling block-counter scheduler
// ---------------------------------------------------------------------------
// Returns { blockNum, blockIdx, cyclePosn, inBaseBuild, milWeek (=blockNum),
//           milDay (=blockIdx), milGroup, clusterLive, sessionType, milVol,
//           isPostAssessment, checkInOverride }
//
// No calendar-day dependency. Scheduling is driven entirely by block_session_index
// (how many sessions completed in the current block) and block_number (total blocks
// completed since enrollment). Rest is earned after SESSIONS_PER_BLOCK training
// sessions, not assigned to a fixed weekday.
//
// Check-in signals partially bypass R581 for safety (body always wins over schedule):
//   recovery_mode or general pain → rest override
//   low energy → intensity downgrade (interval → duurloop, duurloop → kracht)
//   poor sleep → volume ×0.85
export function computeMilitaryPhase(milCoach, checkIn, date) {
  const todayMs    = new Date(date + 'T12:00:00Z').getTime();
  const blockIdx   = milCoach.block_session_index ?? 0;  // 0–3 = training; ≥4 = rest earned
  const blockNum   = milCoach.block_number ?? 1;          // total blocks since enrollment

  const assessmentDate = milCoach.target_date;
  const assessMs = assessmentDate ? new Date(assessmentDate + 'T12:00:00Z').getTime() : null;
  const isPostAssessment = assessMs !== null && todayMs > assessMs && milCoach.mode !== 'open';

  const clusterLive = milCoach.cluster_current ?? milCoach.cluster_target ?? 1;
  const milGroup    = getMilitaryGroup(milCoach.track ?? 'keuring', clusterLive);

  // Position within 6-block periodization cycle (1–6)
  const cyclePosn   = ((blockNum - 1) % 6) + 1;
  const inBaseBuild = cyclePosn <= 2;

  // Determine session type from rolling block sequence
  const isRestBlock = blockIdx >= SESSIONS_PER_BLOCK;
  const blockSeq    = BLOCK_SEQUENCES[milGroup] ?? BLOCK_SEQUENCES.keuring_low;
  let sessionType   = isRestBlock ? 'rust' : (blockSeq[blockIdx] ?? 'kracht');

  // Cooper test: on first-ever session (no baseline yet), or at cycle start (block 1 of each 6-block cycle)
  if (!isRestBlock && blockIdx === 0 && (!milCoach.last_cooper_distance_m || cyclePosn === 1)) {
    sessionType = 'cooper_test';
  }

  // Volume from 6-block periodization cycle
  let milVol = BLOCK_VOLUMES[cyclePosn - 1] ?? 1.0;

  // Target mode: taper intensity near assessment date
  if (milCoach.mode === 'target' && assessMs && !isPostAssessment) {
    const daysOut = Math.ceil((assessMs - todayMs) / 86_400_000);
    if (daysOut <= 7)       milVol = Math.min(milVol, 0.60); // taper week
    else if (daysOut <= 14) milVol = Math.min(milVol, 0.75); // pre-taper
  }

  // Check-in safety integration (partial R581 bypass — body state always wins over schedule)
  const recoveryMode = !!(checkIn?.recovery_mode ?? checkIn?.checkin_json?.recovery_mode);
  const energy    = checkIn?.energy    ?? 10;
  const sleep     = checkIn?.sleep_hours ?? 8;
  const painLevel = checkIn?.pain_level  ?? 0;
  const painScope = checkIn?.pain_scope  ?? null;
  const painGeneral = painLevel >= 2 && painScope !== 'specific';

  let checkInOverride = null;
  if (!isRestBlock) {
    if (recoveryMode || painGeneral) {
      sessionType = 'rust';
      checkInOverride = recoveryMode ? 'recovery_mode' : 'pain';
    } else if (energy <= 3 && sessionType === 'interval') {
      sessionType = 'duurloop';   // downgrade HIIT to zone2 on low energy
      checkInOverride = 'low_energy';
    } else if (energy <= 3 && (sessionType === 'duurloop' || sessionType === 'kracht_marsen')) {
      sessionType = 'kracht';     // downgrade to strength (safest low-energy option)
      checkInOverride = 'low_energy';
    }
  }
  if (sleep <= 5) milVol *= 0.85; // poor sleep → volume reduction regardless of session type

  return {
    blockNum,
    blockIdx,
    cyclePosn,
    inBaseBuild,
    milWeek: blockNum,   // alias kept for label compatibility
    milDay:  blockIdx,   // alias kept for return-object compatibility
    milGroup,
    clusterLive,
    sessionType,
    milVol,
    isPostAssessment,
    checkInOverride,
  };
}

// Prescribed march weight (kg) per group per week (0 = no march / bodyweight)
// R577 caps actual increase at +5 kg from last week's weight
export const MIL_MARCH_KG = {
  keuring_low:    [ 0,  0,  5, 10,  0,  0],
  keuring_mid:    [ 0,  5, 10, 15,  0,  0],
  keuring_high:   [ 5, 10, 15, 20,  0, 10],
  opleiding_low:  [ 0,  0,  5, 10,  0,  0],
  opleiding_mid:  [ 0,  5, 10, 20,  0,  0],
  opleiding_high: [ 0, 10, 15, 25,  0, 10],
};

// Prescribed march duration (seconds) per group per week
export const MIL_MARCH_SEC = {
  keuring_low:    [   0,    0,  900, 1200,    0,    0],
  keuring_mid:    [   0,  900, 1200, 1500,    0,    0],
  keuring_high:   [ 900, 1200, 1500, 1800,    0,  900],
  opleiding_low:  [   0,    0,  900, 1200,    0,    0],
  opleiding_mid:  [   0,  900, 1200, 1800,    0,    0],
  opleiding_high: [   0, 1200, 1800, 2400,    0, 1200],
};

// Peak run levels per group: { zone2: continuous level, hiit: interval level }
// zone2 maps to run-continuous-level-N (7+), hiit maps to run-interval-level-N (1-6)
export const MIL_CLUSTER_RUN_PEAK = {
  keuring_low:    { zone2:  9, hiit: 3 },
  keuring_mid:    { zone2: 12, hiit: 5 },
  keuring_high:   { zone2: 15, hiit: 6 },
  opleiding_low:  { zone2:  9, hiit: 3 },
  opleiding_mid:  { zone2: 12, hiit: 5 },
  opleiding_high: { zone2: 16, hiit: 6 },
};

// Week offset applied to peak run level (index = week - 1)
// Negative = easier level than peak; 0 = at peak
export const MIL_RUN_WEEK_OFFSET = [-3, -2, -1, 0, -3, -1];

