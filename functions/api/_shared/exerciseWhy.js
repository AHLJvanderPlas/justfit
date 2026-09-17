/**
 * Why am I doing this exercise? — C-F3.
 *
 * `deriveExerciseWhy()` in WorkoutView answered this from category and tags alone,
 * which produced three problems:
 *
 *   1. Generic — every dumbbell movement got "Builds strength · resistance
 *      training", so a curl and a Romanian deadlift read identically.
 *   2. Wrong — anything tagged `bodyweight` returned "...· upper body", so a
 *      bodyweight squat claimed to train your upper body.
 *   3. Untranslated — it returned raw English literals without passing through
 *      `t()`, so Dutch users saw English regardless of their language setting.
 *
 * The roadmap framed the fix as writing a `why` string for all 478 exercises by
 * hand. That is a lot of writing to produce something inconsistent, and the data to
 * derive it accurately already exists: `primary_muscles_json`, now normalised
 * through `muscles.js`. So this derives from anatomy and returns *parts* rather than
 * a sentence, letting the client translate and assemble.
 *
 * A stored `instructions_json.why` still wins when present — that was the roadmap's
 * real intent, so a trainer can override with a better rationale.
 */

import { musclesFromJson, normaliseMuscles } from './muscles.js';

/**
 * Purpose keys. These are English so they double as `t()` lookup keys, matching how
 * the rest of the app translates (English key → NL dictionary).
 */
export const WHY_PURPOSE = {
  recovery:    'Recovery',
  breathing:   'Breathwork',
  pelvicFloor: 'Pelvic floor',
  mobility:    'Mobility',
  running:     'Running fitness',
  cardio:      'Conditioning',
  carry:       'Loaded carry',
  core:        'Core stability',
  loaded:      'Strength',
  bodyweight:  'Functional strength',
};

function parseTags(ex) {
  try {
    const t = ex?.tags_json ? JSON.parse(ex.tags_json) : (ex?.tags ?? []);
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}

function supportsWeight(ex) {
  if (ex?.supports_weight) return true;
  try {
    const m = ex?.metrics_json ? JSON.parse(ex.metrics_json) : null;
    return !!m && (m.supports ?? []).includes('weight');
  } catch { return false; }
}

/**
 * Decide what this exercise is *for*, in priority order. Ordering matters: a
 * pelvic-floor exercise that also happens to be tagged `core` must read as pelvic
 * floor, and a weighted carry is more usefully described as a carry than as
 * "strength".
 */
export function whyPurpose(ex) {
  const tags = parseTags(ex);
  const cat = ex?.category;

  // Breathing is checked before the recovery category: a breathing drill filed
  // under recovery is still breathwork, and "Recovery" tells the athlete nothing
  // about what they are being asked to do.
  if (tags.includes('breathing')) return WHY_PURPOSE.breathing;
  if (cat === 'recovery') return WHY_PURPOSE.recovery;
  if (tags.includes('pelvic_floor') || tags.includes('kegel')) return WHY_PURPOSE.pelvicFloor;
  if (cat === 'mobility' || tags.includes('mobility')) return WHY_PURPOSE.mobility;
  if (cat === 'cardio' || tags.includes('cardio')) {
    return tags.includes('run_interval') || tags.includes('running')
      ? WHY_PURPOSE.running : WHY_PURPOSE.cardio;
  }
  if (tags.includes('carry') || /carry|march|farmer/i.test(ex?.slug ?? '')) return WHY_PURPOSE.carry;
  if (tags.includes('core') && !supportsWeight(ex)) return WHY_PURPOSE.core;
  return supportsWeight(ex) ? WHY_PURPOSE.loaded : WHY_PURPOSE.bodyweight;
}

/**
 * The muscles worth naming. Two is the useful number: one reads as incomplete for a
 * compound movement, and four is a list nobody reads mid-set.
 *
 * Accepts either a raw exercise row or an already-built plan step, since the step
 * now carries `primary_muscles_json` too.
 */
export function whyRegions(ex, max = 2) {
  // Some purposes are not about a muscle. Breathwork routed through the diaphragm
  // would read "Recovery · abs", which is both odd and unhelpful; the purpose is
  // the whole answer for these.
  const purpose = whyPurpose(ex);
  if (purpose === WHY_PURPOSE.breathing || purpose === WHY_PURPOSE.recovery
      || purpose === WHY_PURPOSE.pelvicFloor || purpose === WHY_PURPOSE.running) {
    return [];
  }
  let regions = musclesFromJson(ex?.primary_muscles_json);
  if (regions.size === 0 && Array.isArray(ex?.primary_muscles)) {
    regions = normaliseMuscles(ex.primary_muscles);
  }
  if (regions.size === 0) return [];
  return [...regions].slice(0, max);
}

/**
 * Full result: a purpose key to translate, the regions to name, and any stored
 * override. The client assembles these — it owns the language and the separator.
 */
export function whyParts(ex) {
  let stored = null;
  try {
    const ins = ex?.instructions_json ? JSON.parse(ex.instructions_json) : null;
    const w = ins?.why;
    if (typeof w === 'string' && w.trim()) stored = w.trim();
  } catch { /* fall through to derived */ }

  return { stored, purpose: whyPurpose(ex), regions: whyRegions(ex) };
}
