// Media 1 — the client's photo helpers: which step carries a usable image pair, and the
// per-device "Foto's verbergen" choice with its short-screen default.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stepImages, photosHidden, setPhotosHidden, SHORT_SCREEN } from '../src/mediaUi.js';

const PAIR = ['/exercise-media/plank/0.jpg', '/exercise-media/plank/1.jpg'];

describe('stepImages', () => {
  it('passes a same-origin pair through', () => expect(stepImages({ images: PAIR })).toEqual(PAIR));
  it.each([
    ['no step', null], ['no images', {}], ['null', { images: null }], ['one', { images: [PAIR[0]] }],
    ['not strings', { images: [1, 2] }], ['absolute URL', { images: ['https://x.example/a.jpg', PAIR[1]] }],
    ['protocol-relative', { images: ['//x.example/a.jpg', PAIR[1]] }],
  ])('%s → null', (_, ex) => expect(stepImages(ex)).toBeNull());
});

describe('photosHidden — per device, short screens start folded', () => {
  let store;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  });
  it('defaults: hidden under 640 px tall (an SE is 568), shown on taller screens', () => {
    expect(SHORT_SCREEN).toBe(640);
    expect(photosHidden(568)).toBe(true);
    expect(photosHidden(844)).toBe(false);
  });
  it('the user choice wins over the default, both ways', () => {
    setPhotosHidden(false);
    expect(photosHidden(568)).toBe(false);
    setPhotosHidden(true);
    expect(photosHidden(844)).toBe(true);
  });
  it('blocked storage falls back to the default and never throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(() => setPhotosHidden(true)).not.toThrow();
    expect(photosHidden(568)).toBe(true);
    expect(photosHidden(900)).toBe(false);
  });
});
