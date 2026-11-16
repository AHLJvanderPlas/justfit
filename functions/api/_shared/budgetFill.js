// UX review 2026-11-16, finding 6 — the session fills the time the user chose.
//
// The exercise COUNT comes from a fixed table (R501: base by budget, −1 for a
// beginner) and a beginner then loses a set and a fifth of every rep (R502).
// W3 bounded the session from above (R595) and nothing from below, so a beginner
// who chose 20 minutes got ~6–7 minute sessions.
//
// R601 runs once, inside assembly, after the selection has been turned into steps
// and before R502/R519 report the volume. When the estimated minutes
// (estimateSessionSec, the client's estimateMins arithmetic) are below FILL_LOW of
// the effective budget it tops the session up toward FILL_TARGET, never above
// FILL_CAP (R525 may still append its 30 s mobility step and R595 trims anything
// over the budget afterwards):
//   1. restore sets — one at a time, fewest first, never above the goal's base set
//      count (the experience offset is +0 here); a beginner keeps the rep scale;
//   2. add exercises — from the already-filtered, already-shuffled selection list
//      (date-seeded, so deterministic), each one re-checked against every pool
//      guard (_safePool: kit, body mode, R563 injury, R596 protocol …), the injury
//      load model once more, and the variety rule (R597: one per movement family).
// It never fires when less is the point (see fillSkipReason): a micro session,
// a rest day, recovery mode, a sleep / energy / stress / mood downgrade, a return
// after a break, pregnancy or postnatal mode, a coach programme, a bonus session,
// a forced measurement or an unlimited budget. User-built sessions never reach
// assembly. Plain ESM; imports only siblings.

import { estimateSessionSec } from './session.js';
import { loadsAny } from './injuryLoad.js';

export const R_FILL = 'R601';
export const FILL_LOW = 0.70;
export const FILL_TARGET = 0.85;
export const FILL_CAP = 0.95;
export const FILL_MAX_STEPS = 10;            // R501's own ceiling on the count
export const R525_RESERVE_SEC = 90;          // its 30 s hold plus the rest it adds before it

// A rule in today's trace that said "less": the body or the circumstances asked
// for a lighter day, and filling the time back up would undo it.
const LESS_TODAY = /^R5(11|12|13|17|35|36|58|59)\b|^R526 .*stress/;

/** Why the fill must not run today, or null when it may. Reads ctx only. */
export function fillSkipReason(ctx) {
  if (ctx.slot_type === 'rest') return 'rest';
  if (ctx.slot_type === 'micro') return 'micro';
  if (ctx.unlimited || !(ctx.budget > 0)) return 'unlimited';
  if (ctx.bonusSession) return 'bonus';
  if (ctx.forceAssessment) return 'forced_measurement';
  const mode = ctx.pregnancyContext?.mode;
  if (mode === 'pregnant' || mode === 'postnatal') return 'body_mode';
  if (ctx.runProgramOverride || ctx.crossTrainingOverride || ctx.cyclingProgramOverride
    || ctx.militaryProgramOverride || ctx.militaryDbSelection || ctx.militarySessionType) return 'coach';
  if ((ctx.trace ?? []).some(t => LESS_TODAY.test(String(t)))) return 'less_today';
  return null;
}

/**
 * The pure core. `steps` is mutated (sets) and appended to; returns what changed.
 *   budgetMin  — the effective budget in minutes
 *   setCap     — highest set count a restored step may reach
 *   canGrow    — (step) => may this step gain a set
 *   candidates — exercise rows, in preference order, already safe
 *   buildStep  — (row) => a plan step prescribed like every other pick
 *   familyOf   — (slug) => movement family (R597)
 *   reserveSec — room kept free for a step a later rule appends (R525)
 */
export function fillToBudget(steps, { budgetMin, setCap, canGrow = () => true, candidates = [], buildStep, familyOf = (s) => s, reserveSec = 0 }) {
  const before = estimateSessionSec(steps);
  const low = budgetMin * 60 * FILL_LOW, target = budgetMin * 60 * FILL_TARGET;
  const cap = Math.max(target, budgetMin * 60 * FILL_CAP - reserveSec);
  const out = { setsAdded: 0, added: [], beforeSec: before, afterSec: before };
  if (!steps.length || before >= low) return out;

  while (estimateSessionSec(steps) < target) {
    const growable = steps.filter(st => canGrow(st) && (st.sets ?? 1) < setCap)
      .sort((a, b) => (a.sets ?? 1) - (b.sets ?? 1));
    let grew = false;
    for (const st of growable) {
      st.sets = (st.sets ?? 1) + 1;
      if (estimateSessionSec(steps) <= cap) { out.setsAdded++; grew = true; break; }
      st.sets -= 1;
    }
    if (!grew) break;
  }

  const ids = new Set(steps.map(st => st.exercise_id));
  const fams = new Set(steps.map(st => familyOf(st.exercise_slug)));
  for (const row of candidates) {
    if (estimateSessionSec(steps) >= target || steps.length >= FILL_MAX_STEPS) break;
    if (ids.has(row.id) || fams.has(familyOf(row.slug))) continue;
    const step = buildStep(row);
    if (!step) continue;
    steps.push(step);
    if (estimateSessionSec(steps) > cap) { steps.pop(); continue; }
    ids.add(row.id); fams.add(familyOf(row.slug));
    out.added.push(row);
  }
  out.afterSec = estimateSessionSec(steps);
  return out;
}

/**
 * Stage 6's fill, as the planner calls it. `pool` is the ordered selection list
 * (ctx.shuffled); `safePool` re-applies every registered guard; `appendedIds`
 * marks steps a rule added (they keep their own prescription).
 */
export function applyBudgetFill(ctx, steps, { setCap, isFixed, safePool, buildStep, familyOf }) {
  if (fillSkipReason(ctx)) return null;
  const inSession = new Set(steps.map(st => st.exercise_id));
  const candidates = safePool(ctx, ctx.shuffled ?? [])
    .filter(ex => !inSession.has(ex.id) && !loadsAny(ex, ctx.injuryAreas));
  const r = fillToBudget(steps, {
    budgetMin: ctx.budget, setCap, candidates, buildStep, familyOf,
    canGrow: (st) => !st.max_effort && !isFixed(st) && !ctx.appendedIds?.has(st.exercise_id),
    // R525 appends one 30 s mobility step to a standard main session without one.
    reserveSec: ctx.slot_type === 'main' && ctx.isStandardMode && !steps.some(st => st.category === 'mobility') ? R525_RESERVE_SEC : 0,
  });
  if (!r.setsAdded && !r.added.length) return r;
  ctx.trace.push(`R601 — Session topped up to your ${ctx.budget}-min choice: +${r.setsAdded} set(s), +${r.added.length} exercise(s)`
    + ` (~${Math.ceil(r.beforeSec / 60)} → ~${Math.ceil(r.afterSec / 60)} min)`);
  return r;
}
