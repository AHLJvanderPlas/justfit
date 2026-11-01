// coach-dcp R1 review — the step body saveExecution sends (logSession.executionStepPayload).
import { describe, it, expect } from 'vitest';
import { executionStepPayload, loggedStep } from '../src/logSession.js';

describe('executionStepPayload', () => {
  it('keeps the prescription a WorkoutView step carries (stepsActualRef shape)', () => {
    const wv = { exercise_id: 'ex1', prescribed: { sets: 3, reps: 10, duration_sec: undefined, rest_sec: 45 },
      actual: { sets_completed: 3, reps_per_set: [10, 9, 8] } };
    const out = executionStepPayload(wv);
    expect(out.prescribed).toEqual({ sets: 3, reps: 10, duration_sec: undefined, rest_sec: 45 });
    expect(JSON.parse(JSON.stringify(out)).prescribed).toEqual({ sets: 3, reps: 10, rest_sec: 45 });
    expect(out.actual.reps_per_set).toEqual([10, 9, 8]);
    expect(out).not.toHaveProperty('measures');
  });
  it('keeps a timed WorkoutView prescription and the R598 measurement tag', () => {
    const wv = { exercise_id: 'ex2', measures: 'dcp_pushups',
      prescribed: { sets: 1, reps: undefined, duration_sec: 120, rest_sec: 60, measures: 'dcp_pushups' },
      actual: { reps_per_set: [12] } };
    const out = executionStepPayload(wv);
    expect(out.prescribed).toMatchObject({ sets: 1, duration_sec: 120, rest_sec: 60 });
    expect(out.measures).toBe('dcp_pushups');
    expect(executionStepPayload({ ...wv, measures: undefined }).measures).toBe('dcp_pushups');   // from prescribed
  });
  it('a logged step keeps prescribed: {} — nothing was prescribed', () => {
    const out = executionStepPayload(loggedStep({ exerciseId: 'ex3', setsText: '3, 3, 3' }));
    expect(out.prescribed).toEqual({});
  });
  it('a bare plan step is built from its plan fields', () => {
    const out = executionStepPayload({ exercise_id: 'ex4', sets: 2, target_reps: 8, target_duration_sec: undefined, rest_sec: 30 });
    expect(out.prescribed).toEqual({ sets: 2, reps: 8, duration_sec: undefined, rest_sec: 30 });
    expect(out.actual).toEqual({ completed: true });
  });
});
