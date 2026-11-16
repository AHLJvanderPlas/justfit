import { describe, it, expect } from 'vitest';
import {
  loadAreas, loadsAny, explainLoadAreas, injuryAreasFor, planLoadsAny, INJURY_AREAS,
} from '../../../functions/api/_shared/injuryLoad.js';

// Rows verbatim from migrations/baseline/1020_seed_exercises.sql (before migration 0125).
const ROW = {
  'plyo-push-up': { slug: 'plyo-push-up', name: 'Plyo Push-Up', name_nl: 'Opdrukken explosief (plyo)', category: 'strength',
    primary_muscles_json: '["chest"]', secondary_muscles_json: '["delts_front", "triceps"]',
    tags_json: '["upper-body", "push", "bodyweight", "plyometric", "high_impact", "prone", "military"]',
    equipment_required_json: '["none"]' },
  'box-breathing': { slug: 'box-breathing', name: 'Box Breathing', category: 'recovery',
    primary_muscles_json: '["diaphragm"]', secondary_muscles_json: null,
    tags_json: '["bodyweight","no_floor","low_impact","no_sweat","quiet"]', equipment_required_json: '["none"]' },
  '360-breathing': { slug: '360-breathing', name: '360 Breathing', category: 'mobility',
    primary_muscles_json: '["diaphragm","pelvic_floor","intercostals"]', secondary_muscles_json: null,
    tags_json: '["pelvic_floor","breathing","no_floor","low_impact","no_sweat","quiet","pregnancy_safe","postnatal_safe"]',
    equipment_required_json: '["none"]' },
  squat: { slug: 'squat', name: 'Squat', category: 'strength', primary_muscles_json: '["quads","hamstrings","glutes"]',
    secondary_muscles_json: null, tags_json: '["bodyweight","no_floor","high_impact","military"]', equipment_required_json: '["none"]' },
  deadlift: { slug: 'deadlift', name: 'Deadlift', category: 'strength', primary_muscles_json: '["glutes", "hamstrings"]',
    secondary_muscles_json: '["lats", "abs", "traps"]', tags_json: '["lower-body", "compound", "military"]',
    equipment_required_json: '["barbell"]' },
  'squat-jump': { slug: 'squat-jump', name: 'Squat Jump', category: 'strength', primary_muscles_json: '["quads", "glutes"]',
    secondary_muscles_json: '["calves", "abs"]', tags_json: '["plyometric", "power", "lower-body", "bodyweight", "high_impact", "military"]',
    equipment_required_json: '["none"]' },
  'cross-body-shoulder-stretch': { slug: 'cross-body-shoulder-stretch', name: 'Cross-Body Shoulder Stretch', category: 'mobility',
    primary_muscles_json: '["rear_deltoids","rotator_cuff"]', secondary_muscles_json: null,
    tags_json: '["bodyweight","no_floor","low_impact","no_sweat","quiet"]', equipment_required_json: '["none"]' },
  'standing-quad-stretch': { slug: 'standing-quad-stretch', name: 'Standing Quad Stretch', category: 'mobility',
    primary_muscles_json: '["quadriceps","hip_flexors"]', secondary_muscles_json: null,
    tags_json: '["bodyweight","no_floor","low_impact","no_sweat","quiet"]', equipment_required_json: '["none"]' },
  'dead-bug': { slug: 'dead-bug', name: 'Dead Bug', category: 'strength', primary_muscles_json: '["core","transverse_abdominis"]',
    secondary_muscles_json: null, tags_json: '["bodyweight","floor","low_impact","quiet","supine"]', equipment_required_json: '["none"]' },
  'sit-up': { slug: 'sit-up', name: 'Sit-Up', category: 'strength', primary_muscles_json: '["rectus_abdominis","hip_flexors"]',
    secondary_muscles_json: '["obliques"]', tags_json: '["bodyweight","floor","low_impact","core","military","dcp","measurable"]',
    equipment_required_json: '["none"]' },
  'dumbbell-bicep-curl': { slug: 'dumbbell-bicep-curl', name: 'Dumbbell Bicep Curl', category: 'strength',
    primary_muscles_json: '["biceps","forearms"]', secondary_muscles_json: null,
    tags_json: '["dumbbell","no_floor","low_impact","no_sweat","quiet"]', equipment_required_json: '["dumbbell"]' },
};
const areas = (ex) => [...loadAreas(ex)].sort();

describe('loadAreas — the derived injury load model (finding 0)', () => {
  it('plyo-push-up, untagged by 0021, loads the shoulder — and only the shoulder', () => {
    expect(areas(ROW['plyo-push-up'])).toEqual(['shoulder']);
    // plyometric/high_impact land on the hands here, not on the knees or ankles
    expect(loadsAny(ROW['plyo-push-up'], ['knee', 'ankle'])).toBe(false);
  });

  it('a plan step of plyo-push-up (no muscles carried) still loads the shoulder', () => {
    const step = { ...ROW['plyo-push-up'], primary_muscles_json: undefined, secondary_muscles_json: undefined };
    expect(loadsAny({ ...step, exercise_slug: step.slug, slug: undefined }, ['shoulder'])).toBe(true);
  });

  it('breathing and relaxation rows load nothing', () => {
    expect(areas(ROW['box-breathing'])).toEqual([]);
    expect(areas(ROW['360-breathing'])).toEqual([]);
  });

  it('a squat loads the knee (bodyweight squat carries no loads_* tag)', () => {
    expect(loadAreas(ROW.squat).has('knee')).toBe(true);
    expect(loadsAny(ROW.squat, ['shoulder'])).toBe(false);
  });

  it('a deadlift / hinge loads the lower back', () => {
    expect(loadAreas(ROW.deadlift).has('lower_back')).toBe(true);
    expect(loadAreas({ slug: 'kb-rdl', category: 'strength', tags_json: '["hinge"]', primary_muscles_json: '["glutes"]' }).has('lower_back')).toBe(true);
  });

  it('a jump loads knee and ankle', () => {
    expect(loadAreas(ROW['squat-jump']).has('knee')).toBe(true);
    expect(loadAreas(ROW['squat-jump']).has('ankle')).toBe(true);
  });

  it('mobility counts only what sits at the joint', () => {
    expect(areas(ROW['cross-body-shoulder-stretch'])).toEqual(['shoulder']);
    expect(areas(ROW['standing-quad-stretch'])).toEqual(['knee']);   // a quad stretch is not shoulder work
  });

  it('floor core work stays available to a knee/ankle injury; trunk flexion is lower-back work', () => {
    expect(areas(ROW['dead-bug'])).toEqual([]);
    expect(loadsAny(ROW['sit-up'], ['knee', 'ankle'])).toBe(false);
    expect(loadAreas(ROW['sit-up']).has('lower_back')).toBe(true);
  });

  it('arm work loads the shoulder (when unsure, it loads)', () => {
    expect(areas(ROW['dumbbell-bicep-curl'])).toEqual(['shoulder']);
  });

  it('explicit loads_* tags always count', () => {
    expect(areas({ slug: 'x', category: 'mobility', tags_json: '["loads_ankle"]' })).toEqual(['ankle']);
  });

  it('a trainer custom exercise with a Dutch name is read too', () => {
    expect(loadAreas({ slug: 'custom-1', name: 'Bankdrukken', category: 'strength', tags_json: '[]' }).has('shoulder')).toBe(true);
    expect(loadAreas({ slug: 'custom-2', name: 'Uitvalspas achterwaarts', category: 'strength', tags_json: '[]' }).has('knee')).toBe(true);
  });

  it('a row we cannot read at all loads every area', () => {
    expect(areas({ slug: 'custom-3', name: 'Trainer special', category: 'strength', tags_json: '[]' })).toEqual([...INJURY_AREAS].sort());
    expect(areas({ slug: 'custom-4', name: 'Rust', category: 'recovery', tags_json: '[]' })).toEqual([]);
  });

  it('says why', () => {
    const why = explainLoadAreas(ROW['plyo-push-up']).get('shoulder');
    expect(why.some(r => r.includes('chest'))).toBe(true);
  });

  it('accepts parsed arrays as well as JSON strings and ignores garbage', () => {
    expect(loadAreas({ slug: 'x', category: 'strength', tags_json: ['push'], primary_muscles_json: ['chest'] }).has('shoulder')).toBe(true);
    expect(areas({ slug: 'x', category: 'mobility', tags_json: '{not json' })).toEqual([]);
    expect(areas(null)).toEqual([]);
  });
});

describe('injuryAreasFor / loadsAny / planLoadsAny', () => {
  const prefs = { preferences: { chronic_injury_areas: ['shoulder'] } };
  it('combines the check-in specific pain areas with the chronic ones', () => {
    expect(injuryAreasFor({ pain_scope: 'specific', pain_areas: ['knee'] }, prefs).sort()).toEqual(['knee', 'shoulder']);
    expect(injuryAreasFor({ checkin_json: { pain_scope: 'specific', pain_areas: ['ankle'] } }, null)).toEqual(['ankle']);
    expect(injuryAreasFor({ pain_scope: 'general', pain_areas: ['knee'] }, prefs)).toEqual(['shoulder']);
    expect(injuryAreasFor(null, null)).toEqual([]);
  });
  it('no areas → nothing is excluded', () => {
    expect(loadsAny(ROW['plyo-push-up'], [])).toBe(false);
    expect(loadsAny(ROW['plyo-push-up'], undefined)).toBe(false);
  });
  it('a stored plan with plyo-push-up loads a sore shoulder', () => {
    const plan = { steps: [ROW['dead-bug'], ROW['plyo-push-up']] };
    expect(planLoadsAny(plan, ['shoulder'])).toBe(true);
    expect(planLoadsAny(plan, ['ankle'])).toBe(false);
    expect(planLoadsAny(plan, [])).toBe(false);
  });
});

describe('military run days ask the same model (R563)', async () => {
  const { computeMilitaryPhase } = await import('../../../functions/api/_shared/military.js');
  const coach = { active: true, track: 'keuring', mode: 'open', cluster_current: 3, block_number: 2, last_cooper_distance_m: 2400 };
  const RUN = ['duurloop', 'interval', 'cooper_test'];
  it('knee or ankle: no run day; shoulder: the schedule is unchanged', () => {
    let sawRun = false;
    for (let i = 0; i < 4; i++) {
      const plain = computeMilitaryPhase({ ...coach, block_session_index: i }, {}, '2026-11-16');
      if (RUN.includes(plain.sessionType)) sawRun = true;
      for (const area of ['knee', 'ankle']) {
        const hurt = computeMilitaryPhase({ ...coach, block_session_index: i }, {}, '2026-11-16', [area]);
        expect(RUN.includes(hurt.sessionType)).toBe(false);
        if (RUN.includes(plain.sessionType)) expect(hurt.checkInOverride).toBe('injury');
      }
      expect(computeMilitaryPhase({ ...coach, block_session_index: i }, {}, '2026-11-16', ['shoulder']).sessionType).toBe(plain.sessionType);
    }
    expect(sawRun).toBe(true);   // the block really contains a run day, or this tests nothing
  });
});
