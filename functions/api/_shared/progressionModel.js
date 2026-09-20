/**
 * Progression model — the single definition of how a score grows and fades.
 *
 * Previously this lived twice: `progression.js` held `DECAY_CONFIG` / `applyDecay`,
 * and `execution.js` held `PROG_DECAY_CONFIG` / `progApplyDecay` / `progApplyGain`.
 * Two copies of a formula drift silently — the scores would simply be wrong, with
 * no error anywhere — so both now import from here.
 *
 * ── Why the numbers changed (calibration, 2026-09-20) ────────────────────────
 *
 * The old model did not describe training. Measured against the live data, the
 * highest score any axis had ever reached across 15 logged sessions was 0.59 out
 * of 100, and the radar was an empty hexagon for a real user who had trained.
 *
 * Two faults, and only one of them was the obvious one:
 *
 *  1. DECAY WAS ~7× TOO FAST. Power decayed 4%/day after a 2-day grace, which
 *     claims you lose 65% of your strength in 28 days off. The detraining
 *     literature puts that at roughly 5-10%. This was the real bug.
 *
 *  2. THE CURVE WAS A CLIFF. Equilibrium by cadence under the old constants:
 *     every 2 days → 100, every 3 days → 43, weekly → 12. Nothing physiological
 *     behaves like that, and someone training weekly for a year read as untrained.
 *
 * Notably the per-set gain (0.8) was already right and is unchanged. The fix was
 * to slow the forgetting, not to inflate the earning.
 *
 * ── What a score means now ───────────────────────────────────────────────────
 * Fitted against these targets (4 sets per session, one year):
 *     weekly      → ~60   a real habit, not an athlete
 *     2× / week   → ~75   genuinely fit
 *     3-4× / week → ~86   strong
 *     daily       → ~92   elite — and 100 stays out of reach on purpose
 * Early movement is deliberate too: the first session from zero is worth +3.2,
 * so a beginner sees the needle move on day one.
 */

// ─── Gain ─────────────────────────────────────────────────────────────────────

/** Points per completed set, before the diminishing-returns curve. */
export const GAIN_PER_SET = 0.8;

/** Ceiling on what one exercise can contribute to one axis in a single session. */
export const MAX_STIMULUS_PER_AXIS = 9;

/**
 * Diminishing-returns exponent. At 1.0 the curve is linear and the top of the
 * scale is easy to reach; at 2.0 the last 20 points cost roughly as much as the
 * first 60, which is both truer to training and what keeps 100 meaningful.
 */
export const GAIN_EXPONENT = 2;

export function applyGain(currentScore, stimulus) {
  if (!(stimulus > 0)) return currentScore;
  const headroom = Math.max(0, 1 - currentScore / 100);
  return Math.min(100, currentScore + stimulus * Math.pow(headroom, GAIN_EXPONENT));
}

// ─── Decay ────────────────────────────────────────────────────────────────────

/**
 * Grace period then per-day decay, by adaptation type. Calibrated so retention
 * tracks the detraining literature rather than intuition:
 *
 *            14 days   28 days   90 days      literature (loss)
 *   power      99%       94%       78%        ~0% / ~7% / ~18%
 *   endurance  96%       89%       68%        ~6% / ~15% / ~30%
 *   mobility  100%       97%       85%        slowest of the three
 */
export const DECAY_CONFIG = {
  power:     { graceDays: 10, ratePerDay: 0.006 },
  endurance: { graceDays:  7, ratePerDay: 0.010 },
  mobility:  { graceDays: 14, ratePerDay: 0.004 },
};

export function applyDecay(currentScore, baseline, lastStimulusAtMs, nowMs, mode) {
  if (!lastStimulusAtMs) return currentScore;          // never trained → nothing to lose
  const cfg = DECAY_CONFIG[mode] ?? DECAY_CONFIG.power;
  const elapsedDays = (nowMs - lastStimulusAtMs) / 86_400_000;
  if (elapsedDays <= cfg.graceDays) return currentScore;
  const factor = Math.pow(1 - cfg.ratePerDay, elapsedDays - cfg.graceDays);
  return baseline + (currentScore - baseline) * factor;
}

// ─── Baseline ratchet ─────────────────────────────────────────────────────────

/**
 * `baseline` existed as a decay floor and was always 0, so it did nothing and the
 * floor was "back to nothing". That is not how training works: sustained work
 * leaves retained adaptation — the reason someone returning after a year rebuilds
 * far faster than a true beginner.
 *
 * The baseline now creeps toward a fraction of the score being sustained, and
 * never falls. It is also what gives the MetricCurve's floor line something true
 * to say: your base is permanent, only the top layer fades.
 */
export const BASELINE_RATIO = 0.45;   // long-run floor approaches 45% of sustained score
export const BASELINE_RATE  = 0.035;  // ~20 sessions to approach it — earned, not given

export function applyBaselineRatchet(baseline, score) {
  const target = score * BASELINE_RATIO;
  const next = baseline + (target - baseline) * BASELINE_RATE;
  // Monotonic: a baseline that could fall would not be a baseline.
  return Math.max(baseline, Math.min(next, score));
}
