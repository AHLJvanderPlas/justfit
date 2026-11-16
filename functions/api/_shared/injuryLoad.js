// ── Injury load model (finding 0, 2026-11-16) ─────────────────────────────────
//
// Which of the four injury areas — shoulder, knee, lower_back, ankle — does an
// exercise load? Until now the only answer was a `loads_<area>` tag, added by
// migration 0021 to the library as it was then. Every row added after 0021 (284
// of 480 active rows, among them `plyo-push-up`) and every trainer/gym custom
// exercise carried no tag, so R563 let them through: a user with a chronic
// shoulder complaint who reported shoulder pain was prescribed explosive
// push-ups.
//
// loadAreas(ex) = explicit `loads_*` tags ∪ what the row itself shows. Every
// place that filters on injury calls this one function (scripts/smoke.sh fails
// if a file under functions/ tests a `loads_` tag anywhere else).
//
// Direction of error: when unsure, an exercise LOADS the area. A wrongly
// excluded exercise costs variety; a wrongly included one can hurt someone.
// Two limits keep a session possible: mobility/recovery rows only count what
// sits AT the joint (a quad stretch is not knee work for a shoulder), and
// breathing/relaxation rows load nothing.
//
// Inference table (union of every line that matches):
//
//   source                         shoulder             knee                    lower_back             ankle
//   ─────────────────────────────  ───────────────────  ──────────────────────  ─────────────────────  ─────────────────────
//   explicit tag                   loads_shoulder       loads_knee              loads_lower_back       loads_ankle
//   joint muscle, primary or       deltoids, shoulders, quads, rectus femoris,  lower back, erector    calves, soleus,
//     secondary (every category)   rotator cuff, chest, vastus, IT band         spinae, spine, back    achilles, tibialis,
//                                  lats, serratus                                                      shins, ankles, feet
//   working muscle, primary        triceps, biceps,     hamstrings (except hip  rectus abdominis WITH  —
//     (not mobility/recovery)      upper back, traps,   hinges: bridge, thrust, hip flexors (sit-up,
//                                  rhomboids, arms      RDL, kick …), legs,     leg raise, v-up,
//                                                       full body               hollow); full body
//   tag                            push, pull, upper    squat, lunge, jump,     hinge, carry, crunch,  running, jump_rope,
//                                  body, carry,         running, march, impact  weighted, olympic,     calf, shin, agility,
//                                  pull_up_bar          (plyometric, high_      valsalva, loaded       march, impact (lower
//                                                       impact, power) when     rotation, prone        body), standing
//                                                       lower body              (not a push-up)        single-leg/balance
//   equipment                      pull-up bar, dip     squat rack, leg press   barbell (not benched), rucksack, treadmill,
//                                  station, cable,      / extension / curl,     rucksack, rowing       running/trail shoes,
//                                  bench rack, chest/   rowing machine,         machine                jump rope
//                                  pec/lat/row machine, rucksack, treadmill,
//                                  rowing machine,      running shoes, jump
//                                  rucksack             rope, bikes
//   slug / name keyword            push-up, press, pull squat, lunge, step-up,  deadlift, RDL, good    calf, heel, toe, jump,
//     (EN + NL, word match)        -up, chin-up, row,   jump, hop, run, jog,    morning, swing, clean, hop, run, jog, skip,
//                                  dip, plank, crawl,   sprint, skip, burpee,   snatch, bent-over,     sprint, skater, march,
//                                  burpee, hang, fly,   pistol, wall-sit,       superman, sit-up,      walk, hike, stair,
//                                  lateral/front raise, nordic, kneel, pigeon,  crunch, leg raise,     shuffle; hardlopen,
//                                  boxing, punch, swim, skater, stair, march,   carry, woodchop;       marsen, sprong, kuit,
//                                  turkish get-up;      hike; hurken, uitval,   rugzak, tillen, draag, enkel
//                                  opdrukken, optrekken sprong, hardlopen,      graaf, onderrug
//                                  roeien, drukken,     marsen, fietsen,
//                                  schouder             beendrukken
//   quadruped on the hands         bird-dog, donkey kick, fire hydrant, bear crawl (not mobility/recovery)
//   nothing recognisable           a strength/cardio/mixed/skill row with no muscles, no tag and no keyword
//                                  that tells us anything loads ALL FOUR areas (a trainer's custom exercise
//                                  we cannot read is not offered to an injured user)
//
// The upper-body exception: a push-up with `plyometric`/`high_impact` lands on
// the hands, not the legs, so impact counts for knee/ankle only when the row
// shows lower-body work (a lower-body muscle, or no push/pull/upper-body tag).
//
// Exactly the same table produced migration 0125 (explicit tags for every
// active global row, reviewed in docs/injury-load-tags.md), so after it is
// applied the data and the code agree; before it, the code is the safety net.

export const INJURY_AREAS = ['shoulder', 'knee', 'lower_back', 'ankle'];
const AREA_SET = new Set(INJURY_AREAS);

const arr = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string' || !v) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
};
const norm = (s) => String(s ?? '').toLowerCase().trim().replace(/[\s-]+/g, '_');

// ── muscles ──
const JOINT_MUSCLES = {
  shoulder: ['shoulders', 'shoulder', 'deltoids', 'deltoid', 'delts', 'anterior_deltoid', 'anterior_deltoids',
    'medial_deltoid', 'rear_deltoid', 'rear_deltoids', 'rear_delts', 'front_delts', 'delts_front', 'rotator_cuff',
    'shoulder_girdle', 'chest', 'pectorals', 'pecs', 'upper_chest', 'lats', 'latissimus_dorsi', 'teres_major',
    'serratus_anterior'],
  knee: ['quads', 'quadriceps', 'quad', 'rectus_femoris', 'vastus_lateralis', 'vastus_medialis', 'iliotibial_band',
    'knee', 'knees'],
  lower_back: ['lower_back', 'erector_spinae', 'spine', 'back', 'lumbar'],
  ankle: ['calves', 'calf', 'gastrocnemius', 'soleus', 'achilles', 'achilles_tendon', 'ankles', 'ankle',
    'tibialis', 'tibialis_anterior', 'shins', 'shin', 'feet', 'foot', 'plantar_fascia'],
};
const WORKING_MUSCLES = {
  shoulder: ['triceps', 'biceps', 'biceps_brachii', 'brachialis', 'brachioradialis', 'upper_back', 'traps',
    'trapezius', 'upper_traps', 'upper_trapezius', 'mid_traps', 'lower_traps', 'rhomboids', 'arms'],
  knee: ['legs', 'full_body', 'whole_body', 'adductors', 'inner_thighs'],
  lower_back: ['full_body', 'whole_body'],
  ankle: [],
};
const LOWER_BODY = new Set([...JOINT_MUSCLES.knee, ...JOINT_MUSCLES.ankle, 'hamstrings', 'biceps_femoris',
  'glutes', 'gluteus_maximus', 'glute_medius', 'legs', 'adductors', 'hip_flexors', 'full_body']);
const HINGE_WORDS = ['bridge', 'thrust', 'rdl', 'romanian', 'good_morning', 'kick', 'hydrant', 'superman',
  'swimmer', 'bird_dog', 'hip_extension'];

// ── tags / equipment / words ──
const TAGS = {
  shoulder: ['push', 'pull', 'upper_body', 'upper-body', 'overhead', 'carry', 'pull_up_bar'],
  knee: ['squat', 'lunge', 'jump', 'running', 'run_continuous', 'run_interval', 'march', 'walking', 'hiking'],
  lower_back: ['hinge', 'carry', 'crunch', 'weighted', 'olympic', 'valsalva'],
  ankle: ['running', 'run_continuous', 'run_interval', 'jump_rope', 'calf', 'shin', 'agility', 'march', 'walking'],
};
const IMPACT_TAGS = ['plyometric', 'high_impact', 'medium_impact', 'jump'];
const EQUIPMENT = {
  shoulder: ['pull_up_bar', 'dip_station', 'cable', 'bench_press_rack', 'chest_press_machine', 'pec_deck',
    'lat_pulldown', 'seated_row_machine', 'rowing_machine', 'rucksack'],
  knee: ['squat_rack', 'leg_press', 'leg_extension_machine', 'leg_curl_machine', 'rowing_machine', 'rucksack',
    'treadmill', 'running_shoes', 'trail_shoes', 'jump_rope', 'exercise_bike', 'indoor_bike', 'road_bike', 'mountain_bike'],
  lower_back: ['rucksack', 'rowing_machine'],
  ankle: ['rucksack', 'treadmill', 'running_shoes', 'trail_shoes', 'jump_rope'],
};
// Whole words of the slug and the names; multi-word phrases match on `_`-joined text.
const WORDS = {
  shoulder: ['push_up', 'pushup', 'press_up', 'press', 'pull_up', 'pullup', 'chin_up', 'pulldown', 'row', 'rows',
    'dip', 'dips', 'plank', 'crawl', 'burpee', 'hang', 'fly', 'flye', 'lateral_raise', 'front_raise', 'boxing',
    'punch', 'jab', 'swim', 'swimming', 'get_up', 'snatch', 'jerk', 'handstand', 'opdrukken', 'optrekken',
    'roeien', 'drukken', 'schouder', 'kruipen', 'hangen', 'graaftest', 'draagtest'],
  knee: ['squat', 'squats', 'lunge', 'lunges', 'step_up', 'jump', 'jumps', 'hop', 'hops', 'bound', 'run', 'running',
    'jog', 'sprint', 'skip', 'burpee', 'pistol', 'wall_sit', 'nordic', 'kneeling', 'pigeon', 'skater', 'stair',
    'march', 'hike', 'hurken', 'uitvalspas', 'uitval', 'sprong', 'sprongen', 'springen', 'hardlopen', 'rennen',
    'marsen', 'fietsen', 'beendrukken', 'optillen', 'draagtest'],
  lower_back: ['deadlift', 'rdl', 'romanian', 'good_morning', 'swing', 'clean', 'snatch', 'bent_over', 'superman',
    'back_extension', 'hyperextension', 'sit_up', 'situp', 'crunch', 'v_up', 'leg_raise', 'flutter', 'carry',
    'woodchop', 'wood_chop', 'farmers', 'thrust', 'rugzak', 'tillen', 'optillen', 'draagtest', 'graaftest', 'onderrug'],
  ankle: ['calf', 'heel', 'toe', 'jump', 'jumps', 'hop', 'hops', 'run', 'running', 'jog', 'skip', 'sprint',
    'skater', 'march', 'walk', 'hike', 'stair', 'shuffle', 'hardlopen', 'rennen', 'marsen', 'sprong', 'sprongen',
    'springen', 'kuit', 'enkel'],
};
const QUADRUPED = ['bird_dog', 'donkey_kick', 'fire_hydrant', 'bear'];
// Rows that say nothing about load because there is none.
const UNLOADED_TAGS = ['breathing', 'recovery', 'kegel', 'pelvic_floor', 'stretch', 'stretching', 'mobility'];

function _hasWord(text, w) {
  return text === w || text.startsWith(w + '_') || text.endsWith('_' + w) || text.includes('_' + w + '_');
}

/**
 * The areas an exercise loads, with the reasons — the generator writes these
 * into docs/injury-load-tags.md, the planner only needs loadAreas().
 * Accepts a library row or a plan step (both carry tags_json, category,
 * slug/exercise_slug, name, *_muscles_json, equipment_required_json).
 */
export function explainLoadAreas(ex) {
  const why = new Map();
  const add = (area, reason) => { if (!why.has(area)) why.set(area, []); why.get(area).push(reason); };
  if (!ex) return why;
  const tags  = arr(ex.tags_json).map(norm);
  const prim  = arr(ex.primary_muscles_json).map(norm);
  const sec   = arr(ex.secondary_muscles_json).map(norm);
  const equip = arr(ex.equipment_required_json).map(norm);
  const cat   = norm(ex.category);
  const gentle = cat === 'mobility' || cat === 'recovery';
  const texts = [ex.slug ?? ex.exercise_slug, ex.name, ex.name_nl].filter(Boolean).map(norm)
    .map(s => s.replace(/[^a-z0-9_]+/g, '_'));
  const word = (w) => texts.some(t => _hasWord(t, w) || (w.length >= 6 && t.includes(w)));

  for (const t of tags) if (t.startsWith('loads_') && AREA_SET.has(t.slice(6))) add(t.slice(6), `tag ${t}`);

  for (const area of INJURY_AREAS) {
    for (const m of prim) if (JOINT_MUSCLES[area].includes(m)) add(area, `muscle ${m}`);
    for (const m of sec)  if (JOINT_MUSCLES[area].includes(m)) add(area, `muscle ${m} (secondary)`);
  }

  // Breathing and relaxation load nothing beyond what an explicit tag says.
  if (gentle && tags.includes('breathing')) return why;

  const lowerBody = prim.some(m => LOWER_BODY.has(m)) || sec.some(m => LOWER_BODY.has(m));
  const upperOnly = !lowerBody && (tags.some(t => ['push', 'pull', 'upper_body', 'upper-body'].includes(t))
    || prim.some(m => JOINT_MUSCLES.shoulder.includes(m) || WORKING_MUSCLES.shoulder.includes(m)));
  const hinge = tags.includes('hinge') || tags.includes('posterior_chain') || HINGE_WORDS.some(word);

  if (!gentle) {
    for (const area of INJURY_AREAS) for (const m of prim) if (WORKING_MUSCLES[area].includes(m)) add(area, `muscle ${m}`);
    if (prim.includes('hamstrings') && (!hinge || word('curl') || word('deadlift'))) add('knee', 'muscle hamstrings');
    if (prim.includes('rectus_abdominis') && prim.includes('hip_flexors')) add('lower_back', 'trunk flexion (rectus abdominis + hip flexors)');
    for (const area of INJURY_AREAS) {
      for (const t of TAGS[area]) if (tags.includes(t)) add(area, `tag ${t}`);
      for (const e of EQUIPMENT[area]) if (equip.includes(e)) add(area, `equipment ${e}`);
    }
    if (tags.includes('rotation') && tags.some(t => ['resistance_bands', 'machine', 'dumbbell', 'kettlebell'].includes(t) || equip.some(e => e !== 'none'))) add('lower_back', 'loaded rotation');
    if (tags.includes('prone') && !tags.includes('push')) add('lower_back', 'tag prone (back extension)');
    if (equip.includes('barbell') && !equip.includes('bench') && !tags.includes('supine')) add('lower_back', 'equipment barbell');
    const impact = tags.filter(t => IMPACT_TAGS.includes(t));
    if (impact.length) {
      if (upperOnly) add('shoulder', `impact on the hands (${impact[0]})`);
      else { add('knee', `impact (${impact[0]})`); add('ankle', `impact (${impact[0]})`); }
    }
    const standing = tags.includes('no_floor') || !tags.includes('floor');
    if (standing && lowerBody && (tags.includes('unilateral') || tags.includes('balance'))) {
      add('knee', 'standing single-leg work'); add('ankle', 'standing single-leg work');
    }
    if (QUADRUPED.some(word)) add('shoulder', 'weight on the hands (quadruped)');
    for (const area of INJURY_AREAS) for (const w of WORDS[area]) {
      if (word(w)) {
        if (w === 'press' && (word('leg_press') || word('calf_press') || word('pallof'))) continue;
        if (w === 'row' && word('rowing')) continue;
        if ((w === 'march' || w === 'walk') && tags.includes('floor')) continue;
        add(area, `word "${w}"`);
      }
    }
    // A row we cannot read at all: assume the worst (see header).
    const informative = prim.length || sec.length || tags.some(t => !['strength', 'cardio', 'bodyweight', 'military', 'gym', 'dynamic', 'low_impact', 'no_floor', 'quiet', 'no_sweat'].includes(t));
    if (!why.size && !informative && !tags.some(t => UNLOADED_TAGS.includes(t))) {
      for (const area of INJURY_AREAS) add(area, 'unreadable row — assumed to load every area');
    }
  } else {
    // Mobility/recovery: only what sits at the joint, plus a few positions.
    if (word('kneeling') || word('pigeon') || word('couch') || word('deep_squat') || word('lunge')) add('knee', 'knee-loaded position');
    if (tags.includes('prone') && !tags.includes('push')) add('lower_back', 'tag prone (back extension)');
    if (tags.includes('running') || tags.includes('run_warmup')) { add('knee', 'run warm-up'); add('ankle', 'run warm-up'); }
  }
  return why;
}

const _memo = new WeakMap();

/** The set of injury areas this exercise (library row or plan step) loads. */
export function loadAreas(ex) {
  if (!ex || typeof ex !== 'object') return new Set();
  const hit = _memo.get(ex);
  if (hit && hit.tags === ex.tags_json && hit.prim === ex.primary_muscles_json) return hit.areas;
  const areas = new Set(explainLoadAreas(ex).keys());
  _memo.set(ex, { tags: ex.tags_json, prim: ex.primary_muscles_json, areas });
  return areas;
}

/** True when the exercise loads at least one of `areas`. */
export function loadsAny(ex, areas) {
  if (!areas || !areas.length) return false;
  const l = loadAreas(ex);
  return areas.some(a => l.has(a));
}

/**
 * Today's injury areas: the check-in's specific pain areas plus the profile's
 * chronic ones (R562). The only place the two are combined.
 */
export function injuryAreasFor(checkIn, prefs) {
  const scope = checkIn?.pain_scope ?? checkIn?.checkin_json?.pain_scope ?? null;
  const pain  = checkIn?.pain_areas ?? checkIn?.checkin_json?.pain_areas ?? [];
  const specific = scope === 'specific' && Array.isArray(pain) && pain.length > 0;
  const chronic = prefs?.preferences?.chronic_injury_areas ?? [];
  return [...new Set([...(specific ? pain : []), ...(Array.isArray(chronic) ? chronic : [])])];
}

/** True when any step of a stored plan loads one of `areas` (adapt path guard). */
export function planLoadsAny(plan, areas) {
  return !!areas?.length && (plan?.steps ?? []).some(s => loadsAny(s, areas));
}
