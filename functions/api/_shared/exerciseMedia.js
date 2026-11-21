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

import { VOICE_CLIPS } from './voiceClips.js';

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

/**
 * Recorded coach voice (release voice 1): { nl?: path, en?: path } — same-origin paths only —
 * or null when the row has no usable clip. Migration 0128 writes {"audio": {"nl": "/exercise-audio/<slug>/nl.mp3", ...}}.
 */
export function exerciseAudio(mediaJson, slug) {
  const a = parseMedia(mediaJson).audio;
  const out = {};
  for (const lang of ['nl', 'en']) {
    const p = a && typeof a === 'object' && !Array.isArray(a) ? a[lang] : null;
    if (typeof p === 'string' && SAME_ORIGIN.test(p)) out[lang] = p;
    // Voice 2 — a clip that is deployed with the app (voiceClips.js, generated from the audio
    // manifest) needs no database row: the file being there is what makes it playable.
    else if (slug && VOICE_CLIPS[slug]?.includes(lang)) out[lang] = `/exercise-audio/${slug}/${lang}.mp3`;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Voice 2 — a stored plan keeps the media its steps had on the day it was made. Refresh every
 * step's `images` and `audio` from the library as it is now, so photos and clips added later
 * show up without regenerating the plan. One query; any failure returns the plan untouched.
 */
export async function refreshPlanMedia(env, plan) {
  try {
    const steps = [];
    const walk = (o) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') { if (typeof o.exercise_slug === 'string') steps.push(o); Object.values(o).forEach(walk); }
    };
    walk(plan);
    const slugs = [...new Set(steps.map((s) => s.exercise_slug))].slice(0, 90);
    if (!slugs.length) return plan;
    const { results } = await env.DB.prepare(
      `SELECT slug, media_json FROM exercises WHERE gym_id IS NULL AND is_active = 1 AND slug IN (${slugs.map(() => '?').join(',')})`
    ).bind(...slugs).all();
    const media = new Map((results ?? []).map((r) => [r.slug, r.media_json]));
    for (const s of steps) {
      if (!media.has(s.exercise_slug)) continue;
      s.images = exerciseImages(media.get(s.exercise_slug));
      s.audio = exerciseAudio(media.get(s.exercise_slug), s.exercise_slug);
    }
  } catch { /* the plan as stored is still a good plan */ }
  return plan;
}

/** The same for a day_plans row as GET /api/plan returns it (plan_json is a string). */
export async function refreshPlanRowMedia(env, row) {
  if (!row || typeof row.plan_json !== 'string') return row;
  try { return { ...row, plan_json: JSON.stringify(await refreshPlanMedia(env, JSON.parse(row.plan_json))) }; } catch { return row; }
}

export function exerciseGifUrl(mediaJson) {
  const g = parseMedia(mediaJson).gif_url;
  return typeof g === 'string' && g ? g : null;
}
