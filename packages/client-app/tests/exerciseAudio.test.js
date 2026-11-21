// Voice 1 — exercises.media_json.audio → the client's `audio` ({ nl?, en? } same-origin clip paths).
// Never throws; a third-party or malformed path is refused, as for photos.
import { describe, it, expect } from 'vitest';
import { exerciseAudio, exerciseImages } from '../../../functions/api/_shared/exerciseMedia.js';
import { makePlanStep, prescribedStep } from '../../../functions/api/_shared/planStep.js';

const NL = '/exercise-audio/push-up/nl.mp3';
const EN = '/exercise-audio/push-up/en.mp3';
const row = (audio) => JSON.stringify({ images: ['/exercise-media/push-up/0.jpg', '/exercise-media/push-up/1.jpg'], audio });

describe('exerciseAudio', () => {
  it('reads both languages, or one', () => {
    expect(exerciseAudio(row({ nl: NL, en: EN }))).toEqual({ nl: NL, en: EN });
    expect(exerciseAudio(row({ en: EN }))).toEqual({ en: EN });
    expect(exerciseAudio({ audio: { nl: NL } })).toEqual({ nl: NL });
  });
  it('keeps the photos reader unaffected', () => {
    expect(exerciseImages(row({ nl: NL }))).toHaveLength(2);
  });
  it('drops an unusable language but keeps the good one', () => {
    expect(exerciseAudio(row({ nl: 'https://evil.example/a.mp3', en: EN }))).toEqual({ en: EN });
  });
  it.each([
    ['null', null], ['broken JSON', '{"audio": {'], ['no audio key', JSON.stringify({ images: [] })],
    ['audio a string', JSON.stringify({ audio: NL })], ['audio an array', JSON.stringify({ audio: [NL] })],
    ['empty object', JSON.stringify({ audio: {} })],
    ['an absolute URL', row({ nl: 'https://evil.example/a.mp3' })],
    ['a protocol-relative URL', row({ nl: '//evil.example/a.mp3' })],
    ['a javascript: URL', row({ nl: 'javascript:alert(1)' })],
    ['a data: URL', row({ nl: 'data:audio/mpeg;base64,AAAA' })],
    ['a path without a slash', row({ nl: 'exercise-audio/x/nl.mp3' })],
    ['a path with a quote', row({ nl: '/a".mp3' })],
    ['a non-string', row({ nl: 5 })],
    ['an unknown language only', row({ de: '/exercise-audio/x/de.mp3' })],
  ])('%s → null', (_, v) => {
    expect(() => exerciseAudio(v)).not.toThrow();
    expect(exerciseAudio(v)).toBeNull();
  });
});

describe('plan steps carry audio next to images', () => {
  const ex = { id: 'e1', slug: 'push-up', name: 'Push-up', category: 'strength', media_json: row({ nl: NL, en: EN }) };
  it('makePlanStep and prescribedStep', () => {
    expect(makePlanStep(ex).audio).toEqual({ nl: NL, en: EN });
    expect(prescribedStep(ex, { sets: 3, target_reps: 10, rest_sec: 45 }).audio).toEqual({ nl: NL, en: EN });
  });
  it('a row without audio, or with malformed media, builds a step with audio null', () => {
    const bare = { ...ex, slug: 'no-clip-exercise' };   // push-up itself ships a clip with the app (voiceClips.js)
    expect(makePlanStep({ ...bare, media_json: null }).audio).toBeNull();
    expect(() => makePlanStep({ ...bare, media_json: '{broken' })).not.toThrow();
    expect(makePlanStep({ ...bare, media_json: '{broken' }).audio).toBeNull();
  });
});
