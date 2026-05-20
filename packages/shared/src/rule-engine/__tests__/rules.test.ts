import { describe, it, expect } from 'vitest';
import {
  getPhaseTargets, canSubstituteExercise, validateContraindications,
  getAllowedSubstitutionPool, validateWeeklyDistribution, applyMissedSessionPolicy,
} from '../rules.js';
import type { SessionStructure, ClientIntake, PhaseStructureEntry } from '../types.js';

// ─── R521 ─────────────────────────────────────────────────────────────────────
describe('R521 getPhaseTargets', () => {
  it('returns default linear targets when no phase structure', () => {
    const result = getPhaseTargets(null, 1);
    expect(result.volume_target).toBe(1.0);
    expect(result.intensity_range).toHaveLength(2);
  });

  it('returns matching phase for week in range', () => {
    const phases: PhaseStructureEntry[] = [
      { week_start: 1, week_end: 4, name: 'Base', intensity_range: [5, 7], volume_target: 0.8 },
      { week_start: 5, week_end: 8, name: 'Build', intensity_range: [7, 9], volume_target: 1.1 },
    ];
    expect(getPhaseTargets(phases, 3).phase_name).toBe('Base');
    expect(getPhaseTargets(phases, 6).phase_name).toBe('Build');
    expect(getPhaseTargets(phases, 6).volume_target).toBe(1.1);
  });

  it('returns last phase when week exceeds all ranges', () => {
    const phases: PhaseStructureEntry[] = [
      { week_start: 1, week_end: 4, name: 'Base', intensity_range: [5, 7], volume_target: 0.8 },
    ];
    expect(getPhaseTargets(phases, 99).phase_name).toBe('Base');
  });
});

// ─── R523 ─────────────────────────────────────────────────────────────────────
describe('R523 canSubstituteExercise', () => {
  const session: SessionStructure = {
    blocks: [{
      type: 'main',
      exercises: [
        { exercise_id: 'ex-1', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'locked' },
        { exercise_id: 'ex-2', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'pool', sub_pool_ids: ['ex-3'] },
        { exercise_id: 'ex-4', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open' },
      ],
    }],
  };

  it('returns false for locked slot', () => {
    expect(canSubstituteExercise(session, 'ex-1')).toBe(false);
  });

  it('returns true for pool slot', () => {
    expect(canSubstituteExercise(session, 'ex-2')).toBe(true);
  });

  it('returns true for open slot', () => {
    expect(canSubstituteExercise(session, 'ex-4')).toBe(true);
  });

  it('returns false for unknown slot', () => {
    expect(canSubstituteExercise(session, 'unknown')).toBe(false);
  });
});

// ─── R524 ─────────────────────────────────────────────────────────────────────
describe('R524 validateContraindications', () => {
  const session: SessionStructure = {
    blocks: [{
      type: 'main',
      exercises: [
        { exercise_id: 'squat', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open',
          contraindications: ['knee_pain', 'knee_replacement'], primary_muscles: ['quads'] },
        { exercise_id: 'bench', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open',
          contraindications: ['shoulder_impingement'] },
      ],
    }],
  };

  it('flags hard fail when client has matching contraindication', () => {
    const intake: ClientIntake = {
      contraindications_json: [{ tag: 'knee_pain', notes: '' }],
    };
    const { hardFail } = validateContraindications(session, intake);
    expect(hardFail).toHaveLength(1);
    expect(hardFail[0].exercise_id).toBe('squat');
    expect(hardFail[0].contraindication).toBe('knee_pain');
  });

  it('flags hard fail for active injury', () => {
    const intake: ClientIntake = {
      injuries_json: [{ area: 'knee_pain', severity: 'moderate', active: true }],
    };
    const { hardFail } = validateContraindications(session, intake);
    expect(hardFail.length).toBeGreaterThan(0);
  });

  it('does not flag inactive injuries', () => {
    const intake: ClientIntake = {
      injuries_json: [{ area: 'knee_pain', severity: 'mild', active: false }],
    };
    const { hardFail } = validateContraindications(session, intake);
    expect(hardFail).toHaveLength(0);
  });

  it('returns empty when no conflicts', () => {
    const intake: ClientIntake = {
      contraindications_json: [{ tag: 'lumbar_disc', notes: '' }],
    };
    const { hardFail, softWarn } = validateContraindications(session, intake);
    expect(hardFail).toHaveLength(0);
    expect(softWarn).toHaveLength(0);
  });
});

// ─── R526 ─────────────────────────────────────────────────────────────────────
describe('R526 getAllowedSubstitutionPool', () => {
  const session: SessionStructure = {
    blocks: [{
      type: 'main',
      exercises: [
        { exercise_id: 'locked-ex', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'locked' },
        { exercise_id: 'pool-ex', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'pool', sub_pool_ids: ['alt-1', 'alt-2'] },
        { exercise_id: 'open-ex', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open' },
      ],
    }],
  };

  it('returns empty for locked exercise', () => {
    expect(getAllowedSubstitutionPool(session, 'locked-ex')).toHaveLength(0);
  });

  it('returns pool IDs for pool exercise', () => {
    const pool = getAllowedSubstitutionPool(session, 'pool-ex');
    expect(pool).toEqual(['alt-1', 'alt-2']);
  });

  it('returns open signal for open exercise', () => {
    expect(getAllowedSubstitutionPool(session, 'open-ex')).toEqual(['__open__']);
  });
});

// ─── R527 ─────────────────────────────────────────────────────────────────────
describe('R527 validateWeeklyDistribution', () => {
  it('warns on push/pull imbalance', () => {
    const pushHeavy: SessionStructure = {
      blocks: [{ type: 'main', exercises: [
        { exercise_id: 'bench', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open', primary_muscles: ['chest'] },
        { exercise_id: 'ohp', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open', primary_muscles: ['front_delt'] },
        { exercise_id: 'pushup', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open', primary_muscles: ['chest', 'triceps'] },
      ]}],
    };
    const { warnings } = validateWeeklyDistribution([pushHeavy], {
      substitution_policy: 'open', missed_session_policy: 'skip',
      weekly_checks: { push_pull_balance: true },
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('R527');
  });

  it('no warnings when balanced', () => {
    const balanced: SessionStructure = {
      blocks: [{ type: 'main', exercises: [
        { exercise_id: 'bench', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open', primary_muscles: ['chest'] },
        { exercise_id: 'row', exercise_source: 'global', sets: 3, rest_sec: 60, lock_flag: 'open', primary_muscles: ['lats'] },
      ]}],
    };
    const { warnings } = validateWeeklyDistribution([balanced], {
      substitution_policy: 'open', missed_session_policy: 'skip',
      weekly_checks: { push_pull_balance: true },
    });
    expect(warnings).toHaveLength(0);
  });
});

// ─── R528 ─────────────────────────────────────────────────────────────────────
describe('R528 applyMissedSessionPolicy', () => {
  it('returns skip description', () => {
    const r = applyMissedSessionPolicy('2026-06-01', 'skip');
    expect(r.action).toBe('skip');
    expect(r.description).toContain('2026-06-01');
  });

  it('returns shift description', () => {
    const r = applyMissedSessionPolicy('2026-06-01', 'shift');
    expect(r.action).toBe('shift');
  });

  it('returns doubleup description', () => {
    const r = applyMissedSessionPolicy('2026-06-01', 'doubleup');
    expect(r.action).toBe('doubleup');
  });
});
