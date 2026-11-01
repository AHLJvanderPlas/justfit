// C-B32 — the weekly training-days target, and where the rest days fall.
//
// Settings → Doel & coach → TRAININGSDAGEN (2x/3x/4x/5x) saves
// preferences.training_days_per_week. That key is the ONE source of truth:
// the planner, the week pill on Voortgang and Deze week all read it through
// weeklyTarget() below. The user_preferences.days_per_week_target column is a
// legacy default (onboarding and /api/profile wrote 3 for everyone, nobody ever
// chose it) and is read by nothing; unset means "no target", never 3.
//
// Plain ESM, no imports: the client reaches this file through a relative path,
// like _shared/session.js and _shared/sessionOutcome.js.
//
// ── The rule (general path only) ──────────────────────────────────────────────
// Applies when a target is set and no running / cycling / military coach is
// active (those coaches own their schedules), outside pregnancy and postnatal
// mode (their body-mode programme owns the day), and never for a bonus session,
// a pin request or a forced self-measurement — those are the user asking for a
// session today. Check-in safety keeps priority: R514 still sets the rest day
// and leads the coach sentence; a rest day can never be less safe than a session.
//
// Inputs are the plan date and the dates of the user's training days (a
// completed or stopped-with-sets execution that is not a "Gewoon rusten" row)
// strictly before it, from the Monday of its ISO week or two days back,
// whichever is earlier. Deterministic: the plan date, never the clock.
//
//   D = training days this ISO week before today, T = target,
//   R = available days from today to Sunday (blocked weekdays excluded),
//   N = T − D still to do.
//   1. D ≥ T                         → rest   R599 "Je weekdoel (Tx) is gehaald"
//   2. N ≥ R                         → train  (every remaining day is needed)
//   3. D ≥ ⌈T × elapsed / available⌉ → rest   R600 (on pace — spread the week)
//   4. trained yesterday AND the day before → rest R600 (no third day in a row)
//   5. otherwise                     → train
// Following the plan from a fresh Monday this gives 2x: ma do · 3x: ma wo vr ·
// 4x: ma di do za · 5x: ma di do vr zo — never more than T, never three in a
// row unless rule 2 needs it. The rest day is the existing shape (slot_type
// 'rest', no steps; Today offers "Eigen training" and the bonus as always).

export const WEEK_TARGET_KEY = 'training_days_per_week';
export const WEEK_TARGET_RANGE = [1, 7];
export const R_MET = 'R599';
export const R_SPREAD = 'R600';

/** The user's weekly target: an integer 1–7, or null when none is set. */
export function weeklyTarget(prefs) {
  const raw = prefs?.preferences?.[WEEK_TARGET_KEY];
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < WEEK_TARGET_RANGE[0] || n > WEEK_TARGET_RANGE[1]) return null;
  return n;
}

/** Any programme coach active — mirrors the client's activeCoachOf() !== 'general'. */
export function coachActive(prefs) {
  const p = prefs?.preferences ?? {};
  return !!((p.run_coach?.enrolled && !p.run_coach?.completed)
    || (p.cycling_coach?.active && !p.cycling_coach?.completed)
    || p.military_coach?.active);
}

/** Whether the target places rest days for this user (body mode is the planner's own check). */
export function weekTargetApplies(prefs) {
  return weeklyTarget(prefs) != null && !coachActive(prefs);
}

// The week pill's target when the user set none: the goal's own number, as before.
export const GOAL_WEEK_DEFAULTS = { health: 3, strength: 4, muscle_gain: 4, fat_loss: 4, endurance: 5, mobility: 3 };

/** The number the week pill and Deze week count against: the target, else the goal default. */
export function weekCountTarget(prefs, goal) {
  return weeklyTarget(prefs) ?? GOAL_WEEK_DEFAULTS[goal ?? prefs?.training_goal] ?? 3;
}

// ── Dates (YYYY-MM-DD, calendar arithmetic at noon UTC) ──────────────────────
const _ms = (date) => Date.parse(date + 'T12:00:00Z');
export function addDays(date, n) {
  return new Date(_ms(date) + n * 86_400_000).toISOString().slice(0, 10);
}
/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(date) {
  return ((new Date(_ms(date)).getUTCDay() + 6) % 7) + 1;
}
export function isoWeekStart(date) {
  return addDays(date, 1 - isoWeekday(date));
}
/** The first date the planner needs: the week's Monday, or two days back for the streak check. */
export function trainedDaysFrom(date) {
  const mon = isoWeekStart(date), back2 = addDays(date, -2);
  return mon < back2 ? mon : back2;
}
const _isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(_ms(d));

// A training day, server side: completed, or stopped with sets done (an abandoned
// row is only stored with at least one — _shared/sessionOutcome.js), and not the
// "Gewoon rusten" row (execution_type 'recovery'). Bind: user_id, from, date.
export const TRAINED_DAYS_SQL =
  `SELECT DISTINCT date FROM executions WHERE user_id = ? AND date >= ? AND date < ?
     AND status IN ('completed', 'abandoned') AND execution_type != 'recovery'`;

/** The same test on a client history row (status may be absent on older rows). */
export function isTrainingDayRow(row) {
  if (!row?.date || row.execution_type === 'recovery') return false;
  const status = row.status ?? 'completed';
  if (status === 'completed') return true;
  return status === 'abandoned' && (Number(row.stopped_after?.exercises_done) || 0) > 0;
}

/** Distinct training days in the ISO week of `date`, up to and including it. */
export function trainingDaysThisWeek(rows, date) {
  const mon = isoWeekStart(date);
  return new Set((rows ?? []).filter(r => isTrainingDayRow(r) && r.date >= mon && r.date <= date).map(r => r.date)).size;
}

/**
 * The Deze week preview plans day by day; each earlier preview day it planned as
 * a session is passed back as `week_sim`, so the next day sees it. Only a preview
 * request carries it (planRequest.js), and only dates in the planner's window
 * before the plan date survive.
 */
export function sanitizeWeekSim(raw, date) {
  if (!Array.isArray(raw) || !_isDate(date)) return [];
  const from = trainedDaysFrom(date);
  return [...new Set(raw.filter(d => _isDate(d) && d >= from && d < date))].slice(0, 9);
}

/**
 * The decision for one day. `blockedWeekdays` holds JS weekdays (0 = Sunday),
 * as preferences.blocked_weekdays does. Returns
 *   { rest, code: 'R599' | 'R600' | null, reason: 'met' | 'forced' | 'pace' | 'streak' | 'behind',
 *     target, done, need, remaining }.
 */
export function weekTargetDecision({ target, trainedDates = [], date, blockedWeekdays = [] }) {
  const mon = isoWeekStart(date);
  const trained = new Set(trainedDates);
  const done = [...trained].filter(d => d >= mon && d < date).length;
  const out = (rest, code, reason, extra = {}) => ({ rest, code, reason, target, done, need: Math.max(0, target - done), ...extra });
  if (done >= target) return out(true, R_MET, 'met', { remaining: 0 });

  const blocked = new Set(blockedWeekdays);
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const avail = week.filter(d => !blocked.has(new Date(_ms(d)).getUTCDay()));
  const remaining = avail.filter(d => d >= date).length;
  const need = target - done;
  if (need >= remaining) return out(false, null, 'forced', { remaining });
  const pace = Math.ceil((target * avail.filter(d => d <= date).length) / Math.max(1, avail.length));
  if (done >= pace) return out(true, R_SPREAD, 'pace', { remaining });
  if (trained.has(addDays(date, -1)) && trained.has(addDays(date, -2))) return out(true, R_SPREAD, 'streak', { remaining });
  return out(false, null, 'behind', { remaining });
}

/**
 * Stage 2's rest-day placement, run first: R999 (a weekday the user blocked) and
 * then the weekly target. Mutates ctx.slot_type and ctx.trace only.
 * ctx.trainedDates is null when the caller did not load them (the user-authored
 * path's guard context) — the target rule is then off rather than guessing.
 */
export function applyRestDays(ctx) {
  if (ctx.bonusSession) return;
  if (ctx.blockedWeekdays.size > 0) {
    const dow = new Date(ctx.date + 'T12:00:00Z').getDay(); // 0=Sun…6=Sat
    if (ctx.blockedWeekdays.has(dow)) {
      ctx.slot_type = 'rest';
      ctx.trace.push(`R999 — Preferred rest day (weekday ${dow} blocked) → rest session`);
      return;
    }
  }
  const target = weeklyTarget(ctx.prefs);
  if (target == null || ctx.trainedDates == null || coachActive(ctx.prefs) || ctx.inSpecialMode
    || ctx.forceAssessment || ctx.pinnedIds?.length || ctx.slot_type === 'rest') return;
  const d = weekTargetDecision({ target, trainedDates: ctx.trainedDates, date: ctx.date, blockedWeekdays: [...ctx.blockedWeekdays] });
  if (!d.rest) {
    ctx.trace.push(`Weekdoel — ${d.done} van ${target} trainingsdagen deze week → trainen (${d.reason})`);
    return;
  }
  ctx.slot_type = 'rest';
  if (d.code === R_MET) ctx.trace.push(`R599 — Weekly target ${target}x reached (target=${target} done=${d.done}) → rest day`);
  else ctx.trace.push(`R600 — Spreading ${target} training days over the week (target=${target} done=${d.done} ${d.reason}) → rest day`);
}
