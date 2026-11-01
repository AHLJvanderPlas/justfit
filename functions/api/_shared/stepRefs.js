// execution_steps.exercise_id has a foreign key to exercises(id). Cycling coach steps carry
// synthetic ids ('cycling_coach_…') that are not library rows, so their INSERT failed the
// constraint and every cycling session save returned 500 — production held zero cycling
// executions (found by the UAT replay, 2026-11-01). Library ids are stored as-is; any other
// id is kept in prescribed_json.ref and exercise_id is NULL.

export async function knownExerciseIds(env, steps) {
  const ids = [...new Set((steps ?? []).map((s) => s?.exercise_id).filter((x) => typeof x === 'string' && x))];
  if (!ids.length) return new Set();
  const { results } = await env.DB.prepare(
    'SELECT id FROM exercises WHERE id IN (SELECT value FROM json_each(?))'
  ).bind(JSON.stringify(ids)).all();
  return new Set((results ?? []).map((r) => r.id));
}

export function stepRow(step, known) {
  const raw = step?.exercise_id ?? null;
  const isLibrary = raw != null && known.has(raw);
  const prescribed = { ...(step?.prescribed ?? {}) };
  if (raw != null && !isLibrary) prescribed.ref = raw;
  return { exercise_id: isLibrary ? raw : null, prescribed_json: JSON.stringify(prescribed) };
}
