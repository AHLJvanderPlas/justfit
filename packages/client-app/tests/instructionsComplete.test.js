// Text 1 — every active global exercise carries a complete instruction in English and Dutch.
// Reads the baseline seeds (the library as production has it after the last applied migration),
// so a new exercise seeded without Dutch steps, or an English edit that leaves the Dutch behind,
// fails here and not in front of a user.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { textErrors } from '../../../scripts/generate-instructions-migration.mjs';

const ROOT = new URL('../../../', import.meta.url);
function library() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) db.exec(readFileSync(new URL(`migrations/baseline/${f}`, ROOT), 'utf8'));
  return db.prepare('SELECT slug, instructions_json FROM exercises WHERE is_active = 1 AND gym_id IS NULL').all();
}

describe('exercise instructions are complete in both languages', () => {
  const rows = library();
  it('covers the whole library', () => {
    expect(rows.length).toBeGreaterThanOrEqual(480);
  });
  it('every exercise has steps and cues, and Dutch lists as long as the English', () => {
    const errs = rows.flatMap((r) => { const j = JSON.parse(r.instructions_json); return textErrors(r.slug, j, j); });
    expect(errs).toEqual([]);
  });
  it('a pregnancy note has its Dutch version', () => {
    const missing = rows.filter((r) => { const j = JSON.parse(r.instructions_json); return j.pregnancy_note && !j.pregnancy_note_nl; }).map((r) => r.slug);
    expect(missing).toEqual([]);
  });
  it('the check itself fails on a row without Dutch, a short Dutch list and a lost 💡', () => {
    expect(textErrors('x', { steps: ['Go'], cues: ['Tip'] }, {})).not.toEqual([]);
    expect(textErrors('x', { steps: ['Go', 'Back'], cues: ['Tip'] }, { steps_nl: ['Ga'], cues_nl: ['Tip'] })).not.toEqual([]);
    expect(textErrors('x', { steps: ['Go'], cues: ['💡 Tip'] }, { steps_nl: ['Ga'], cues_nl: ['Tip'] })).not.toEqual([]);
    expect(textErrors('x', { steps: ['Go'], cues: ['💡 Tip'] }, { steps_nl: ['Ga'], cues_nl: ['💡 Tip'] })).toEqual([]);
  });
});
