// Voice 2 — clips that ship with the app need no database row, and a stored plan picks up the
// library's current photos and clips when it is read.
import { describe, it, expect } from 'vitest';
import { exerciseAudio, refreshPlanMedia, refreshPlanRowMedia } from '../../../functions/api/_shared/exerciseMedia.js';
import { VOICE_CLIPS } from '../../../functions/api/_shared/voiceClips.js';

const fakeEnv = (rows, onQuery = () => {}) => ({ DB: { prepare: (sql) => ({ bind: (...args) => ({ all: async () => { onQuery(sql, args); return { results: rows.filter((r) => args.includes(r.slug)) }; } }) }) } });
const IMG = JSON.stringify({ images: ['/exercise-media/push-up/0.jpg', '/exercise-media/push-up/1.jpg'] });

describe('exerciseAudio with a deployed clip', () => {
  const slug = Object.keys(VOICE_CLIPS)[0];
  it('a slug in the generated list has its clips without any media_json', () => {
    expect(slug).toBeTruthy();
    const a = exerciseAudio(null, slug);
    for (const l of VOICE_CLIPS[slug]) expect(a[l]).toBe(`/exercise-audio/${slug}/${l}.mp3`);
  });
  it('no slug, or an unknown one, gives nothing', () => {
    expect(exerciseAudio(null)).toBeNull();
    expect(exerciseAudio(null, 'no-such-exercise')).toBeNull();
    expect(exerciseAudio('{not json', 'no-such-exercise')).toBeNull();
  });
  it('a database path still counts and a foreign origin is refused', () => {
    expect(exerciseAudio('{"audio":{"nl":"/exercise-audio/x/nl.mp3"}}', 'no-such-exercise')).toEqual({ nl: '/exercise-audio/x/nl.mp3' });
    expect(exerciseAudio('{"audio":{"nl":"//evil.example/a.mp3"}}', 'no-such-exercise')).toBeNull();
  });
});

describe('refreshPlanMedia', () => {
  const slug = Object.keys(VOICE_CLIPS)[0];
  it('gives a stored step the current photos and clips, in one query', async () => {
    const queries = [];
    const plan = { steps: [{ exercise_slug: 'push-up', sets: 3 }, { exercise_slug: 'push-up' }, { exercise_slug: slug }], blocks: [{ steps: [{ exercise_slug: 'gone' }] }] };
    const out = await refreshPlanMedia(fakeEnv([{ slug: 'push-up', media_json: IMG }, { slug, media_json: null }], (sql, args) => queries.push(args)), plan);
    expect(queries).toHaveLength(1);
    expect(out.steps[0].images).toEqual(['/exercise-media/push-up/0.jpg', '/exercise-media/push-up/1.jpg']);
    expect(out.steps[0].sets).toBe(3);
    expect(out.steps[2].audio).toEqual(exerciseAudio(null, slug));
    expect(out.blocks[0].steps[0]).toEqual({ exercise_slug: 'gone' });   // not in the library: left as stored
  });
  it('removes media the library no longer has', async () => {
    const out = await refreshPlanMedia(fakeEnv([{ slug: 'no-such-exercise', media_json: null }]), { steps: [{ exercise_slug: 'no-such-exercise', images: ['/a', '/b'], audio: { nl: '/x' } }] });
    expect(out.steps[0].images).toBeNull();
    expect(out.steps[0].audio).toBeNull();
  });
  it('a failing database leaves the plan as stored', async () => {
    const plan = { steps: [{ exercise_slug: 'push-up', images: null }] };
    const env = { DB: { prepare: () => { throw new Error('down'); } } };
    expect(await refreshPlanMedia(env, plan)).toEqual({ steps: [{ exercise_slug: 'push-up', images: null }] });
  });
  it('a plan without steps makes no query', async () => {
    let n = 0;
    await refreshPlanMedia(fakeEnv([], () => n++), { slot_type: 'rest' });
    await refreshPlanMedia(fakeEnv([], () => n++), null);
    expect(n).toBe(0);
  });
  it('the row form keeps the row and rewrites plan_json; a broken plan_json comes back untouched', async () => {
    const row = { id: 'p1', date: '2026-11-21', plan_json: JSON.stringify({ steps: [{ exercise_slug: 'push-up' }] }) };
    const out = await refreshPlanRowMedia(fakeEnv([{ slug: 'push-up', media_json: IMG }]), row);
    expect(out.id).toBe('p1');
    expect(JSON.parse(out.plan_json).steps[0].images).toHaveLength(2);
    const bad = { id: 'p2', plan_json: '{oops' };
    expect(await refreshPlanRowMedia(fakeEnv([]), bad)).toBe(bad);
    expect(await refreshPlanRowMedia(fakeEnv([]), null)).toBeNull();
  });
});
