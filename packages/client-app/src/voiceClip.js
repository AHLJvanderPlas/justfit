// Voice 1 — the recorded coach voice: one mp3 per exercise and language (public/exercise-audio),
// played through ONE shared Audio element so two clips can never overlap. The device voice
// (speech.js) stays the fallback for every exercise or language without a clip.
//
//   clipFor(step, lang)   → the clip path for exactly this language, or null (a Dutch user is never
//                           handed an English clip)
//   play(url, { onended }) → Promise<'ended' | 'stopped' | 'failed'>; starting a clip stops the
//                           one before it; a rejected play() (autoplay policy) or a load error
//                           resolves 'failed' and leaves nothing playing (the button resets)
//   stop()                → pauses and settles the current promise with 'stopped'
//
// The element has preload="none": nothing is fetched until the user taps Voorlezen (or the
// auto-read setting starts it). The service worker never precaches clips.

const SAME_ORIGIN = /^\/(?!\/)[A-Za-z0-9/_.,()-]+$/;

export function clipFor(step, lang) {
  const p = step?.audio?.[lang === "en" ? "en" : "nl"];
  return typeof p === "string" && SAME_ORIGIN.test(p) ? p : null;
}

export function clipSupported() {
  return typeof Audio === "function";
}

let el = null;
let settle = null;   // settles the promise of the clip now playing

function element() {
  if (!el) {
    el = new Audio();
    el.preload = "none";
  }
  return el;
}

export function stop() {
  const done = settle;
  settle = null;
  if (el) {
    el.onended = null;
    el.onerror = null;
    try { el.pause(); } catch { /* ignore */ }
  }
  done?.("stopped");
}

export function play(url, { onended } = {}) {
  if (!clipSupported()) return Promise.resolve("failed");
  stop();
  return new Promise((resolve) => {
    const a = element();
    let finished = false;
    const finish = (how) => {
      if (finished) return;
      finished = true;
      if (settle === finish) settle = null;
      a.onended = null;
      a.onerror = null;
      resolve(how);
      if (how === "ended") onended?.();
    };
    settle = finish;
    a.onended = () => finish("ended");
    a.onerror = () => finish("failed");
    try {
      a.src = url;
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => { if (settle === finish) finish("failed"); });
    } catch {
      finish("failed");
    }
  });
}
