// ── Exercise media (release media 1) ─────────────────────────────────────────
//
// One reader for exercises.media_json, used by every place that hands an exercise to the
// client: plan steps (planStep.js), the library (/api/exercises) and /api/exercises/search.
// Migration 0127 writes {"images": ["/exercise-media/<slug>/0.jpg", ".../1.jpg"],
// "source": "free-exercise-db"}; older rows may carry gif_url; most carry NULL.
//
// Never throws: a row with malformed media_json shows no media instead of failing a plan.
// `images` is exactly two same-origin paths (start, end) or null — a protocol-relative
// "//host/…" or an absolute URL is refused, so the photos can never pull in a third-party
// origin through data.

const SAME_ORIGIN = /^\/(?!\/)[A-Za-z0-9/_.,()-]+$/;

export function parseMedia(mediaJson) {
  if (mediaJson == null || mediaJson === '') return {};
  if (typeof mediaJson === 'object') return Array.isArray(mediaJson) ? {} : mediaJson;
  try {
    const m = JSON.parse(String(mediaJson));
    return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
  } catch {
    return {};
  }
}

/** [start, end] — two same-origin image paths — or null. */
export function exerciseImages(mediaJson) {
  const imgs = parseMedia(mediaJson).images;
  if (!Array.isArray(imgs) || imgs.length < 2) return null;
  const pair = imgs.slice(0, 2);
  return pair.every((p) => typeof p === 'string' && SAME_ORIGIN.test(p)) ? pair : null;
}

export function exerciseGifUrl(mediaJson) {
  const g = parseMedia(mediaJson).gif_url;
  return typeof g === 'string' && g ? g : null;
}
