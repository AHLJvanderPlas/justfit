import { describe, it, expect } from 'vitest';
import { injuryAreasOf, safeAlternatives } from '../src/safeAlternatives.js';
import { t } from '../src/i18n.js';

// Finding 0 — the WorkoutView alternatives sheet.
describe('safeAlternatives', () => {
  const pushUp = { slug: 'push-up', load_areas: ['shoulder'] };
  const deadBug = { slug: 'dead-bug', load_areas: [] };
  const lunge = { slug: 'reverse-lunge', load_areas: ['knee'] };

  it('takes the plan areas and the chronic profile areas together', () => {
    expect(injuryAreasOf({ injury_areas: ['shoulder'] }, { preferences: { chronic_injury_areas: ['knee'] } }).sort()).toEqual(['knee', 'shoulder']);
    expect(injuryAreasOf(null, null)).toEqual([]);
    expect(injuryAreasOf({ injury_areas: 'shoulder' }, {})).toEqual([]);
  });

  it('drops every alternative that loads a sore area', () => {
    expect(safeAlternatives([pushUp, deadBug, lunge], ['shoulder']).map(a => a.slug)).toEqual(['dead-bug', 'reverse-lunge']);
    expect(safeAlternatives([pushUp, lunge], ['shoulder', 'knee'])).toEqual([]);
  });

  it('keeps everything without an injury', () => {
    expect(safeAlternatives([pushUp, lunge], [])).toHaveLength(2);
    expect(safeAlternatives(undefined, ['knee'])).toEqual([]);
  });

  it('asks the planner model when a cached row has no load_areas', () => {
    const cachedPlyo = { slug: 'plyo-push-up', category: 'strength', tags_json: '["upper-body","push","plyometric"]', primary_muscles_json: '["chest"]' };
    expect(safeAlternatives([cachedPlyo], ['shoulder'])).toEqual([]);
    expect(safeAlternatives([cachedPlyo], ['knee'])).toHaveLength(1);
  });

  it('the empty sheet speaks Dutch first', () => {
    expect(t('Skip this exercise')).toBe('Deze oefening overslaan');
    expect(t("There is no suitable alternative right now. It's fine to skip this exercise — the rest of your session still counts.")).toMatch(/^Er is nu geen passend alternatief/);
  });
});
