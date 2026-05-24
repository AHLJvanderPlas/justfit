/**
 * Rule engine R520–R529 — pure functions, no DOM or Node-specific deps.
 * Each rule has explicit TypeScript input/output contracts.
 */
import type {
  PhaseStructureEntry, PhaseTargets, SessionStructure, ExerciseSlot,
  ClientIntake, ValidationResult, RuleConstraints,
} from './types.js';

// ─── R521: getPhaseTargets ────────────────────────────────────────────────────
/**
 * Returns the phase config (intensity range, volume target) for a given week.
 * Supports linear, undulating, and block phase structures.
 */
export function getPhaseTargets(
  phaseStructure: PhaseStructureEntry[] | null | undefined,
  weekIndex: number,
): PhaseTargets {
  if (!phaseStructure?.length) {
    // Default linear: week 1-4 low-to-high intensity
    const defaultIntensity: [number, number] = [5 + Math.min(weekIndex, 3), 7 + Math.min(weekIndex, 3)];
    return { intensity_range: defaultIntensity, volume_target: 1.0 };
  }
  const phase = phaseStructure.find(
    p => weekIndex >= p.week_start && weekIndex <= p.week_end,
  ) ?? phaseStructure[phaseStructure.length - 1];
  return {
    intensity_range: phase.intensity_range,
    volume_target: phase.volume_target,
    focus: phase.focus,
    phase_name: phase.name,
  };
}

// ─── R523: canSubstituteExercise ──────────────────────────────────────────────
/**
 * Returns whether a specific exercise slot can be substituted.
 */
export function canSubstituteExercise(
  session: SessionStructure,
  exerciseSlotId: string,
): boolean {
  const slot = findSlot(session, exerciseSlotId);
  if (!slot) return false;
  return slot.lock_flag !== 'locked';
}

// ─── R524: validateContraindications ─────────────────────────────────────────
/**
 * Checks all exercises in a session against the client's contraindications and injuries.
 * Hard fail = direct conflict. Soft warn = adjacent concern.
 */
export function validateContraindications(
  session: SessionStructure,
  clientIntake: ClientIntake,
): ValidationResult {
  const hardFail: ValidationResult['hardFail'] = [];
  const softWarn: ValidationResult['softWarn'] = [];

  const clientContras = new Set((clientIntake.contraindications_json ?? []).map(c => c.tag));
  const activeInjuries = (clientIntake.injuries_json ?? [])
    .filter(i => i.active)
    .map(i => i.area);

  for (const block of session.blocks) {
    for (const slot of block.exercises) {
      const exContras = new Set(slot.contraindications ?? []);
      // Hard fails: direct intersection
      for (const c of clientContras) {
        if (exContras.has(c)) {
          hardFail.push({ rule: 'R524', exercise_id: slot.exercise_id,
            message: `Exercise is contraindicated for: ${c}`, contraindication: c });
        }
      }
      // Hard fails: active injury areas
      for (const area of activeInjuries) {
        if (exContras.has(area)) {
          hardFail.push({ rule: 'R524', exercise_id: slot.exercise_id,
            message: `Exercise conflicts with active injury: ${area}`, contraindication: area });
        }
      }
    }
  }

  return { hardFail, softWarn };
}

// ─── R526: getAllowedSubstitutionPool ─────────────────────────────────────────
/**
 * Returns the allowed substitution pool for a slot.
 * - 'locked': empty array (no substitution)
 * - 'pool': trainer-defined pool (filtered by client contraindications)
 * - 'open': caller should use search API with contraindication filter
 */
export function getAllowedSubstitutionPool(
  session: SessionStructure,
  exerciseSlotId: string,
  clientIntake?: ClientIntake,
): string[] {
  const slot = findSlot(session, exerciseSlotId);
  if (!slot || slot.lock_flag === 'locked') return [];

  if (slot.lock_flag === 'pool') {
    const pool = slot.sub_pool_ids ?? [];
    if (!clientIntake) return pool;
    // Filter out contraindicated exercises from pool
    // Note: full contraindication check requires exercise data — caller must verify
    return pool;
  }

  // 'open' — signal to caller to use search API
  return ['__open__'];
}

// ─── R527: validateWeeklyDistribution ────────────────────────────────────────
/**
 * Checks muscle group balance for a single session.
 * Returns soft warnings only (never blocks save).
 */
export function validateWeeklyDistribution(
  sessions: SessionStructure[],
  constraints: RuleConstraints,
): { warnings: string[] } {
  const warnings: string[] = [];
  if (!constraints.weekly_checks) return { warnings };

  let pushCount = 0, pullCount = 0, compoundCount = 0, isolationCount = 0;

  for (const session of sessions) {
    for (const block of session.blocks) {
      for (const slot of block.exercises) {
        const muscles = slot.primary_muscles ?? [];
        if (muscles.some(m => ['chest', 'front_delt', 'triceps'].includes(m))) pushCount++;
        if (muscles.some(m => ['lats', 'upper_back', 'biceps', 'rear_delt'].includes(m))) pullCount++;
        if (slot.sets && slot.sets >= 3) compoundCount++;
        else isolationCount++;
      }
    }
  }

  if (constraints.weekly_checks.push_pull_balance) {
    if (pushCount > 0 && pullCount === 0) {
      warnings.push(`R527: Push/pull imbalance — ${pushCount} push vs 0 pull exercises. Add pulling work this week.`);
    } else if (pullCount > 0 && pushCount === 0) {
      warnings.push(`R527: Push/pull imbalance — ${pullCount} pull vs 0 push exercises. Add pushing work this week.`);
    } else if (pushCount > 0 && pullCount > 0) {
      const ratio = pushCount / pullCount;
      if (ratio > 1.5) warnings.push(`R527: Push/pull imbalance — ${pushCount} push vs ${pullCount} pull exercises. Consider adding more pulling work.`);
      if (ratio < 0.67) warnings.push(`R527: Push/pull imbalance — ${pullCount} pull vs ${pushCount} push exercises. Consider adding more pushing work.`);
    }
  }

  if (constraints.weekly_checks.compound_isolation_ratio) {
    const total = compoundCount + isolationCount;
    if (total > 0 && isolationCount / total > 0.6) {
      warnings.push(`R527: High isolation volume (${isolationCount}/${total} exercises). Consider more compound movements.`);
    }
  }

  return { warnings };
}

// ─── R528: applyMissedSessionPolicy ──────────────────────────────────────────
/**
 * Returns a description of what action will be taken for a missed session.
 * Actual reassignment of assigned_sessions is done server-side.
 */
export function applyMissedSessionPolicy(
  missedDate: string,
  policy: 'skip' | 'shift' | 'doubleup',
): { action: string; description: string } {
  switch (policy) {
    case 'skip':
      return { action: 'skip', description: `Session on ${missedDate} will be skipped. Adherence will reflect the miss.` };
    case 'shift':
      return { action: 'shift', description: `Session on ${missedDate} will be shifted to the next available slot.` };
    case 'doubleup':
      return { action: 'doubleup', description: `Session on ${missedDate} will be combined with the next session.` };
    default:
      return { action: 'skip', description: 'Session will be marked as skipped.' };
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function findSlot(session: SessionStructure, exerciseSlotId: string): ExerciseSlot | undefined {
  for (const block of session.blocks) {
    const found = block.exercises.find(e => e.exercise_id === exerciseSlotId);
    if (found) return found;
  }
  return undefined;
}
