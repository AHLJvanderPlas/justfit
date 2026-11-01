// R598 — the DCP self-measurement: when it is due, and the two sets that take it.
//
// Moved out of plan.js (coach-dcp release 1). R598 used to MARK push-ups and
// sit-ups the selection happened to contain and announce "Zelfmeting ingepland"
// either way — so a military keuring session built from its programme template
// (flutter kicks, deadlift, goblet squat …) carried `assessment_planned: true`
// and no measurement at all. The announcement and the session now come from one
// place: ensureMeasurementSteps() puts both sets in, and assessment_planned is
// read off the finished steps (hasBothMeasurements), never off the intention.

import { dcpCardVisible, dcpIsStale } from './military.js';
import { prescribedStep } from './planStep.js';
import { getDefaultRest } from './session.js';

/** The DCP protocol window: max reps in two minutes, per movement. */
export const DCP_WINDOW_SEC = 120;

// Measurable rows in order of preference; the first one the athlete may do wins.
const KINDS = [
  { measures: 'dcp_pushups', key: 'pushEx',  family: /push-up/, slugs: ['push-up', 'knee-push-up', 'wall-push-up'] },
  { measures: 'dcp_situps',  key: 'situpEx', family: /sit-up/,  slugs: ['sit-up', 'bent-knee-sit-up', 'anchored-sit-up'] },
];

/**
 * Is a measurement due today, and can it be taken safely?
 *
 * Returns { pushEx, situpEx, lastAt } or null. Shared by the engine (which puts
 * the two sets in) and the user-authored path (W4.1), which only OFFERS them.
 * `safePool(ctx, rows)` is plan.js's _safePool: a measurement is still a set of
 * push-ups, so an injured shoulder or an R563 guard rules it out and the
 * measurement waits for a safe day.
 */
export function dcpMeasurementDue(ctx, safePool) {
  const mil = ctx.prefs?.preferences?.military_coach;
  const dcp = mil?.dcp;
  if (!dcpCardVisible(dcp, !!mil?.active)) return null;
  if (ctx.slot_type === 'rest' || !ctx.isStandardMode || ctx.bonusSession) return null;
  const lastAt = dcp.last?.at_ms ?? null;
  if (!(ctx.forceAssessment || !lastAt || dcpIsStale(lastAt, ctx.planDateMs))) return null;
  const measurable = safePool(ctx, ctx.exercises);
  const pick = ({ slugs }) => slugs.map(sl => measurable.find(ex => ex.slug === sl)).find(Boolean) ?? null;
  const pushEx = pick(KINDS[0]);
  const situpEx = pick(KINDS[1]);
  return pushEx && situpEx ? { pushEx, situpEx, lastAt } : null;
}

/** One measurement set: 1 set, no rep target, the 2-minute window, never scaled. */
export function measurementStep(ex, measures, restSec) {
  return prescribedStep(ex, {
    sets: 1, target_reps: undefined, target_duration_sec: DCP_WINDOW_SEC, rest_sec: restSec,
    max_effort: true, measures, measure_window_sec: DCP_WINDOW_SEC,
  });
}

/**
 * After assembly: make sure both measurement sets are IN the session.
 *
 * A movement the selection already measures is left alone. Otherwise a step of
 * the same family (a template's push-up variant, a weighted sit-up) becomes the
 * measurement — the row itself when it is a measurable one, else the row R598
 * chose — so the session does not carry the movement twice; with no such step
 * the measurement is appended. Every row here passed _safePool (the chosen ones
 * in dcpMeasurementDue, the selected ones in selection). Mutates `steps`.
 */
export function ensureMeasurementSteps(ctx, steps) {
  const m = ctx.dcpMeasure;
  if (!m) return steps;
  for (const kind of KINDS) {
    if (steps.some(st => st.measures === kind.measures)) continue;
    const idx = steps.findIndex(st => !st.max_effort && kind.family.test(st.exercise_slug ?? ''));
    const own = idx >= 0 && kind.slugs.includes(steps[idx].exercise_slug)
      ? ctx.exercises.find(ex => ex.id === steps[idx].exercise_id) : null;
    const ex = own ?? m[kind.key];
    const step = measurementStep(ex, kind.measures, idx >= 0 ? steps[idx].rest_sec : getDefaultRest(ex, ctx.slot_type));
    if (idx >= 0) steps[idx] = step; else steps.push(step);
    ctx.appendedIds?.add(ex.id);
  }
  return steps;
}

/** What `assessment_planned` means: both movements are measured in this session. */
export function hasBothMeasurements(steps) {
  const kinds = new Set((steps ?? []).filter(st => st.max_effort).map(st => st.measures));
  return KINDS.every(k => kinds.has(k.measures));
}
