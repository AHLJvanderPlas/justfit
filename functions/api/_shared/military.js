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
/**
 * ── DCP — Defensie Conditie Proef (C-F13) ────────────────────────────────────
 *
 * A DIFFERENT TEST from the aanstellingskeuring the rest of this file models.
 *
 *   aanstellingskeuring  one-time entry gate, standards by function cluster,
 *                        tests run / march / lift-carry / digging
 *   DCP                  recurring for the whole of service, standards by age
 *                        and sex, tests push-ups / sit-ups / 12-minute run
 *
 * So the DCP is not a goal with a finish line — it is a floor you must stay above
 * for twenty years. It is modelled as a standing standard with an optional date,
 * never as a second target-date programme.
 *
 * The run is deliberately not programmed here. A DCP run of 2,200 m is already
 * cleared by every keuring cluster (1–3 need exactly 2,200 m, 4–5 need 2,600 m,
 * 6 needs 2,700 m), so the running row displays the keuring target rather than
 * competing with it.
 *
 * Standards as published in the DCP material; unchanged per the 2025 confirmation.
 * A 2026-07-02 motion asked Defence to move to function-specific standards and
 * drop the age/sex system — not implemented at the time of writing, so if that
 * lands this table is what changes.
 */
export const DCP_NORMS = {
  male: [
    { maxAge: 30, pushups: 20, situps: 30, run_m: 2400 },
    { maxAge: 35, pushups: 18, situps: 27, run_m: 2300 },
    { maxAge: 40, pushups: 16, situps: 24, run_m: 2200 },
    { maxAge: 45, pushups: 14, situps: 21, run_m: 2100 },
    { maxAge: 50, pushups: 12, situps: 18, run_m: 2000 },
    { maxAge: 55, pushups: 10, situps: 15, run_m: 1900 },
    { maxAge: 60, pushups:  8, situps: 12, run_m: 1800 },
    { maxAge: 999, pushups: 6, situps:  9, run_m: 1700 },
  ],
  // Female standards are published separately by Defence and are NOT yet
  // transcribed here. Returning null is deliberate: showing a woman the male
  // table would be worse than showing her nothing, and inventing numbers for a
  // test someone is training against is not acceptable.
  female: null,
};

/**
 * Target tiers. One number demotivates: 32 push-ups means nothing at 6.
 *
 * `safe` is deliberately the SAME number the training bias defends (+20%). Two
 * near-identical thresholds — one for the goal, one for the bias — would be a
 * glossary nobody reads, so the goal says "work up to capacity" and the bias says
 * "never fall below safe", both pointing at one figure.
 */
export const DCP_TIERS = {
  safe:     1.2,   // +20% — the floor the bias holds, and the goal's middle tier
  capacity: 2.0,   // the minimum becomes a warm-up
  runSafe:     1.12,
  runCapacity: 1.25,  // ≈ cluster 6 (2,750 vs 2,700 m) — one target covers both tests
};

/**
 * Should the DCP card be shown at all?
 *
 * `dcp.enabled` only records that a baseline exists. Showing readiness stats and a
 * "go measure yourself" prompt to someone who has switched the coach AND the bias
 * off is nagging about a goal they do not have. One predicate, both mounts.
 */
export function dcpCardVisible(dcp, militaryActive) {
  if (!dcp?.enabled) return false;
  return !!militaryActive || !!dcp.bias_enabled;
}

/** A measurement older than this drives the bias off stale numbers. */
export const DCP_RETEST_DAYS = 42;   // six weeks — long enough to change, short enough to matter

export function dcpIsStale(lastAtMs, nowMs = Date.now()) {
  if (!lastAtMs) return false;        // never measured is a different state, handled separately
  return (nowMs - lastAtMs) > DCP_RETEST_DAYS * 86_400_000;
}

/**
 * How hard the training bias should push, given where the athlete sits.
 *
 * Hysteresis is the point. A goal pushes continuously; a bias must STOP once the
 * floor is cleared, or general training quietly becomes permanent DCP prep. Below
 * the minimum it pushes hardest, between minimum and safe it eases off, and at or
 * above safe it returns zero and gets out of the way.
 *
 * @returns {number} 0 … 1
 */
export function dcpBiasStrength(progress) {
  if (!progress || progress.value >= progress.safe) return 0;
  if (progress.value < progress.minimum) return 1;
  const span = progress.safe - progress.minimum;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (progress.safe - progress.value) / span)) * 0.6;
}

/**
 * Age from a birth year. The app stores no date of birth and no age — body profile
 * carries sex, height and weight only — so the DCP block keeps its own birth_year.
 * A year is enough for a five-year band and is less than a full DOB would be.
 */
export function dcpAgeFrom(birthYear, nowMs = Date.now()) {
  const y = Number(birthYear);
  if (!Number.isFinite(y) || y < 1900) return null;
  return new Date(nowMs).getUTCFullYear() - y;
}

/** Age + sex → the three minimums, or null when no table exists for that sex. */
export function getDcpNorms(sex, ageYears) {
  const table = DCP_NORMS[sex === 'female' ? 'female' : 'male'];
  if (!table || !(ageYears > 0)) return null;
  return table.find(b => ageYears <= b.maxAge) ?? table[table.length - 1];
}

/**
 * Where one movement stands: the tier the athlete has cleared, the next target
 * to aim at, and one achievable step toward it.
 *
 * `next` is never the capacity figure when the minimum has not been reached —
 * that is the whole point of tiering. The step is roughly a third of the gap,
 * floored at 1, so it always moves and never asks for a leap.
 */
export function dcpProgress(current, minimum, isRun = false) {
  if (!(minimum > 0)) return null;
  const safe     = Math.round(minimum * (isRun ? DCP_TIERS.runSafe : DCP_TIERS.safe));
  const capacity = Math.round(minimum * (isRun ? DCP_TIERS.runCapacity : DCP_TIERS.capacity));
  const value = Number(current) || 0;

  const tier = value >= capacity ? 'capacity'
    : value >= safe ? 'safe'
    : value >= minimum ? 'minimum'
    : 'below';

  // The target on screen is the next unmet tier, not the ceiling.
  const next = value < minimum ? minimum : value < safe ? safe : value < capacity ? capacity : capacity;
  const gap = Math.max(0, next - value);
  const step = gap === 0 ? 0 : Math.max(isRun ? 50 : 1, Math.round(gap / 3));

  return { value, minimum, safe, capacity, tier, next, gap, step,
           pct: Math.min(100, Math.round((value / capacity) * 100)) };
}

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

