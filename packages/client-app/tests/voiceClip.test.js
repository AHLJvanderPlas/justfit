// Voice 1 — the shared clip player: one Audio element, never two clips at once, a rejected
// play() resets, and a clip is only chosen for exactly the app language.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let made, rejectPlay, clipFor, clipSupported, play, stop;
class FakeAudio {
  constructor() { made.push(this); this.preload = 'auto'; this.src = ''; this.paused = true; this.pauses = 0; this.onended = null; this.onerror = null; }
  play() { this.paused = false; return rejectPlay ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); }
  pause() { this.paused = true; this.pauses += 1; }
}
beforeEach(async () => {
  made = []; rejectPlay = false; vi.stubGlobal('Audio', FakeAudio);
  vi.resetModules();   // a fresh module = a fresh shared element per test
  ({ clipFor, clipSupported, play, stop } = await import('../src/voiceClip.js'));
});
afterEach(() => { stop(); vi.unstubAllGlobals(); });
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('clipFor', () => {
  const step = { audio: { nl: '/exercise-audio/push-up/nl.mp3', en: '/exercise-audio/push-up/en.mp3' } };
  it('picks exactly the app language', () => {
    expect(clipFor(step, 'nl')).toBe('/exercise-audio/push-up/nl.mp3');
    expect(clipFor(step, 'en')).toBe('/exercise-audio/push-up/en.mp3');
  });
  it('never hands a Dutch user the English clip (or the reverse)', () => {
    expect(clipFor({ audio: { en: '/exercise-audio/x/en.mp3' } }, 'nl')).toBeNull();
    expect(clipFor({ audio: { nl: '/exercise-audio/x/nl.mp3' } }, 'en')).toBeNull();
  });
  it.each([[null], [undefined], [{}], [{ audio: null }], [{ audio: { nl: 5 } }], [{ audio: { nl: 'https://evil.example/a.mp3' } }], [{ audio: { nl: '//evil.example/a.mp3' } }]])('%j → null', (s) => {
    expect(clipFor(s, 'nl')).toBeNull();
  });
});

describe('play / stop', () => {
  it('uses one shared element with preload none, and resolves "ended" with onended', async () => {
    expect(clipSupported()).toBe(true);
    const onended = vi.fn();
    const p = play('/exercise-audio/a/nl.mp3', { onended });
    await flush();
    expect(made).toHaveLength(1);
    expect(made[0].preload).toBe('none');
    expect(made[0].src).toBe('/exercise-audio/a/nl.mp3');
    expect(made[0].paused).toBe(false);
    made[0].onended();
    expect(await p).toBe('ended');
    expect(onended).toHaveBeenCalledTimes(1);
    play('/exercise-audio/b/nl.mp3');
    expect(made).toHaveLength(1);   // the same element again
  });
  it('a second clip stops the first: never two at once', async () => {
    const onendedA = vi.fn();
    const a = play('/exercise-audio/a/nl.mp3', { onended: onendedA });
    const b = play('/exercise-audio/b/nl.mp3');
    expect(await a).toBe('stopped');
    expect(onendedA).not.toHaveBeenCalled();
    expect(made[0].src).toBe('/exercise-audio/b/nl.mp3');
    expect(made[0].pauses).toBeGreaterThanOrEqual(1);
    made[0].onended();
    expect(await b).toBe('ended');
  });
  it('stop() pauses, settles "stopped" and never fires onended', async () => {
    const onended = vi.fn();
    const p = play('/exercise-audio/a/nl.mp3', { onended });
    stop();
    expect(await p).toBe('stopped');
    expect(made[0].paused).toBe(true);
    expect(made[0].onended).toBeNull();
    expect(onended).not.toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
  });
  it('a rejected play() (autoplay policy) resolves "failed" and leaves nothing playing', async () => {
    rejectPlay = true;
    expect(await play('/exercise-audio/a/nl.mp3')).toBe('failed');
  });
  it('a stale rejection of the old clip does not kill the new one', async () => {
    rejectPlay = true;
    const a = play('/exercise-audio/a/nl.mp3');
    rejectPlay = false;
    const b = play('/exercise-audio/b/nl.mp3');
    expect(await a).toBe('stopped');
    await flush();
    made[0].onended();
    expect(await b).toBe('ended');
  });
  it('a load error resolves "failed"', async () => {
    const p = play('/exercise-audio/a/nl.mp3');
    made[0].onerror();
    expect(await p).toBe('failed');
  });
  it('without Audio it fails quietly', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('Audio', undefined);
    expect(clipSupported()).toBe(false);
    expect(await play('/exercise-audio/a/nl.mp3')).toBe('failed');
  });
});
