// Media 1 — exercises.media_json → the client's `images` (two same-origin photo paths) and
// `gif_url`. A malformed row must never throw: it shows no media instead of failing a plan.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseMedia, exerciseImages, exerciseGifUrl } from '../../../functions/api/_shared/exerciseMedia.js';
import { makePlanStep, prescribedStep } from '../../../functions/api/_shared/planStep.js';

const PAIR = ['/exercise-media/push-up/0.jpg', '/exercise-media/push-up/1.jpg'];
const MIGRATED = JSON.stringify({ images: PAIR, source: 'free-exercise-db' });

describe('parseMedia', () => {
  it('reads a JSON object, string or already parsed', () => {
    expect(parseMedia(MIGRATED)).toEqual({ images: PAIR, source: 'free-exercise-db' });
    expect(parseMedia({ gif_url: '/a.gif' })).toEqual({ gif_url: '/a.gif' });
  });
  it.each([
    ['null', null], ['undefined', undefined], ['empty string', ''], ['broken JSON', '{"images": ['],
    ['a JSON array', '["/a.jpg","/b.jpg"]'], ['a JSON string', '"x"'], ['a JSON number', '42'], ['JSON null', 'null'],
    ['plain text', 'not json at all'], ['an array object', ['/a.jpg']],
  ])('%s → {} without throwing', (_, v) => {
    expect(() => parseMedia(v)).not.toThrow();
    expect(parseMedia(v)).toEqual({});
  });
});

describe('exerciseImages', () => {
  it('returns the start and end path from a migrated row', () => {
    expect(exerciseImages(MIGRATED)).toEqual(PAIR);
  });
  it('keeps only the first two', () => {
    expect(exerciseImages(JSON.stringify({ images: [...PAIR, '/exercise-media/push-up/2.jpg'] }))).toEqual(PAIR);
  });
  it.each([
    ['no media_json', null],
    ['malformed JSON', '{images:'],
    ['no images key', JSON.stringify({ gif_url: '/x.gif' })],
    ['images not an array', JSON.stringify({ images: '/a.jpg' })],
    ['one image', JSON.stringify({ images: ['/a.jpg'] })],
    ['a non-string', JSON.stringify({ images: ['/a.jpg', 7] })],
    ['an empty string', JSON.stringify({ images: ['/a.jpg', ''] })],
    ['an absolute URL (third-party origin)', JSON.stringify({ images: ['https://evil.example/a.jpg', '/b.jpg'] })],
    ['a protocol-relative URL', JSON.stringify({ images: ['//evil.example/a.jpg', '/b.jpg'] })],
    ['a javascript: URL', JSON.stringify({ images: ['javascript:alert(1)', '/b.jpg'] })],
    ['a relative path without a slash', JSON.stringify({ images: ['a.jpg', 'b.jpg'] })],
    ['a path with a quote', JSON.stringify({ images: ['/a".jpg', '/b.jpg'] })],
  ])('%s → null', (_, v) => {
    expect(() => exerciseImages(v)).not.toThrow();
    expect(exerciseImages(v)).toBeNull();
  });
});

describe('exerciseGifUrl', () => {
  it('reads gif_url, null otherwise, never throws', () => {
    expect(exerciseGifUrl(JSON.stringify({ gif_url: '/g.gif' }))).toBe('/g.gif');
    expect(exerciseGifUrl(MIGRATED)).toBeNull();
    expect(exerciseGifUrl('{oops')).toBeNull();
    expect(exerciseGifUrl(JSON.stringify({ gif_url: 3 }))).toBeNull();
  });
});

describe('plan steps carry images next to gif_url', () => {
  const ex = { id: 'e1', slug: 'push-up', name: 'Push-up', category: 'strength', media_json: MIGRATED };
  it('makePlanStep and prescribedStep', () => {
    expect(makePlanStep(ex).images).toEqual(PAIR);
    expect(makePlanStep(ex).gif_url).toBeNull();
    expect(prescribedStep(ex, { sets: 3, target_reps: 10, rest_sec: 45 }).images).toEqual(PAIR);
  });
  it('a row without media or with malformed media builds a step with images null (it used to throw on bad JSON)', () => {
    expect(makePlanStep({ ...ex, media_json: null }).images).toBeNull();
    expect(() => makePlanStep({ ...ex, media_json: '{broken' })).not.toThrow();
    expect(makePlanStep({ ...ex, media_json: '{broken' })).toMatchObject({ images: null, gif_url: null });
  });
});

describe('the fixture behind migration 0127', () => {
  const fx = JSON.parse(readFileSync(fileURLToPath(new URL('../../../scripts/fixtures/exercise-photos.json', import.meta.url)), 'utf8'));
  it('every accepted slug yields a valid image pair through the same reader', () => {
    const slugs = Object.keys(fx.exercises);
    expect(slugs.length).toBeGreaterThanOrEqual(80);
    for (const slug of slugs) {
      const media = JSON.stringify({ images: [`/exercise-media/${slug}/0.jpg`, `/exercise-media/${slug}/1.jpg`], source: 'free-exercise-db' });
      expect(exerciseImages(media), slug).toEqual([`/exercise-media/${slug}/0.jpg`, `/exercise-media/${slug}/1.jpg`]);
    }
  });
});
