import { describe, it, expect } from 'vitest';
import { stepRow } from '../../../functions/api/_shared/stepRefs.js';

describe('stepRow — execution_steps.exercise_id must reference a library row', () => {
  const known = new Set(['ex_push_up']);
  it('keeps a library id', () => {
    const r = stepRow({ exercise_id: 'ex_push_up', prescribed: { sets: 3 } }, known);
    expect(r.exercise_id).toBe('ex_push_up');
    expect(JSON.parse(r.prescribed_json)).toEqual({ sets: 3 });
  });
  it('moves a synthetic cycling id into prescribed.ref and stores NULL', () => {
    const r = stepRow({ exercise_id: 'cycling_coach_z2_60', prescribed: { duration_sec: 3600 } }, known);
    expect(r.exercise_id).toBe(null);
    expect(JSON.parse(r.prescribed_json)).toEqual({ duration_sec: 3600, ref: 'cycling_coach_z2_60' });
  });
  it('handles a step without an id', () => {
    expect(stepRow({}, known)).toEqual({ exercise_id: null, prescribed_json: '{}' });
  });
});
