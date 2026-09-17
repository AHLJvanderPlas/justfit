/**
 * Canonical muscle vocabulary.
 *
 * The exercise library grew an uncontrolled vocabulary: 100 distinct values across
 * `primary_muscles_json` / `secondary_muscles_json`, including synonyms (`quads` 65
 * AND `quadriceps` 50), anatomical sub-parts (`soleus`, `gastrocnemius`), group
 * terms (`legs`, `back`, `core`) and non-muscular entries (`cardiovascular_system`,
 * `nervous_system`, `eyes`, `jaw`).
 *
 * `MuscleMap.jsx` renders exactly 16 regions. Its own ALIASES table targeted six
 * names that match no rendered region at all — `delts_front`, `delts_rear`, `abs`,
 * `lower_back`, `forearms_front`, `forearms_back` — so `shoulders` (48 exercises),
 * `quadriceps` (50), `lower_back` (23), `upper_back` (23) and `rhomboids` (17) all
 * rendered blank. This module is the single place that reconciles the three
 * vocabularies, and it is imported by both the Worker and the client.
 *
 * Imported by: functions/api/_shared/recovery.js, packages/client-app/src/MuscleMap.jsx
 * Kept honest by: the muscle-vocabulary guards in scripts/smoke.sh
 */

/** The 16 regions MuscleMap actually draws. Order is stable for display. */
export const MUSCLE_REGIONS = [
  'chest', 'front-shoulders', 'rear-shoulders', 'biceps', 'triceps', 'forearms',
  'abdominals', 'obliques', 'lats', 'traps', 'traps-middle', 'lowerback',
  'quads', 'hamstrings', 'glutes', 'calves',
];

/** Human labels (NL) for the regions, used in recovery copy. */
export const REGION_LABELS_NL = {
  'chest': 'Borst',
  'front-shoulders': 'Voorste schouders',
  'rear-shoulders': 'Achterste schouders',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'forearms': 'Onderarmen',
  'abdominals': 'Buikspieren',
  'obliques': 'Schuine buikspieren',
  'lats': 'Latissimus',
  'traps': 'Nek en trapezius',
  'traps-middle': 'Bovenrug',
  'lowerback': 'Onderrug',
  'quads': 'Quadriceps',
  'hamstrings': 'Hamstrings',
  'glutes': 'Bilspieren',
  'calves': 'Kuiten',
};

/** English labels, parallel to REGION_LABELS_NL. Both must cover every region. */
export const REGION_LABELS_EN = {
  'chest': 'chest',
  'front-shoulders': 'front shoulders',
  'rear-shoulders': 'rear shoulders',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'forearms': 'forearms',
  'abdominals': 'abs',
  'obliques': 'obliques',
  'lats': 'lats',
  'traps': 'neck and traps',
  'traps-middle': 'upper back',
  'lowerback': 'lower back',
  'quads': 'quads',
  'hamstrings': 'hamstrings',
  'glutes': 'glutes',
  'calves': 'calves',
};

/**
 * Every value observed in the live library, mapped to the regions it belongs to.
 * A value may map to several regions (group terms like `legs`), or to none
 * (systemic entries — they are real training effects but have no anatomy to tint).
 */
export const MUSCLE_SYNONYMS = {
  // ── Chest ────────────────────────────────────────────────────────────────
  chest: ['chest'], pectorals: ['chest'], upper_chest: ['chest'],
  serratus_anterior: ['chest'],

  // ── Shoulders ────────────────────────────────────────────────────────────
  shoulders: ['front-shoulders', 'rear-shoulders'],
  deltoids: ['front-shoulders', 'rear-shoulders'],
  shoulder_girdle: ['front-shoulders', 'rear-shoulders'],
  rotator_cuff: ['rear-shoulders'],
  anterior_deltoid: ['front-shoulders'], anterior_deltoids: ['front-shoulders'],
  medial_deltoid: ['front-shoulders'],
  rear_deltoid: ['rear-shoulders'], rear_deltoids: ['rear-shoulders'],
  rear_delts: ['rear-shoulders'],

  // ── Arms ─────────────────────────────────────────────────────────────────
  arms: ['biceps', 'triceps', 'forearms'],
  biceps: ['biceps'], biceps_brachii: ['biceps'], brachialis: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'], brachioradialis: ['forearms'],
  forearm_flexors: ['forearms'], grip: ['forearms'],
  wrist: ['forearms'], wrists: ['forearms'],

  // ── Core ─────────────────────────────────────────────────────────────────
  core: ['abdominals', 'obliques'],
  abs: ['abdominals'], rectus_abdominis: ['abdominals'], lower_abs: ['abdominals'],
  transverse_abdominis: ['abdominals'], diaphragm: ['abdominals'],
  obliques: ['obliques'], intercostals: ['obliques'],

  // ── Back ─────────────────────────────────────────────────────────────────
  back: ['lats', 'traps-middle', 'lowerback'],
  lats: ['lats'], latissimus_dorsi: ['lats'], teres_major: ['lats'],
  upper_back: ['traps-middle'], rhomboids: ['traps-middle'],
  mid_traps: ['traps-middle'], lower_traps: ['traps-middle'],
  traps: ['traps'], trapezius: ['traps'],
  upper_traps: ['traps'], upper_trapezius: ['traps'],
  neck: ['traps'], cervical_spine: ['traps'], sternocleidomastoid: ['traps'],
  lower_back: ['lowerback'], erector_spinae: ['lowerback'],
  spine: ['lowerback'], thoracic_spine: ['lowerback'],

  // ── Legs ─────────────────────────────────────────────────────────────────
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  quads: ['quads'], quadriceps: ['quads'],
  rectus_femoris: ['quads'], vastus_lateralis: ['quads'],
  // Hip flexors and adductors have no region of their own; the quad panel is the
  // closest anatomy the map draws. Imprecise and deliberately so — better than
  // dropping 58 exercises' worth of stimulus on the floor.
  hip_flexors: ['quads'], psoas: ['quads'], iliacus: ['quads'],
  adductors: ['quads'], inner_thighs: ['quads'], groin: ['quads'],
  hamstrings: ['hamstrings'], biceps_femoris: ['hamstrings'],
  glutes: ['glutes'], gluteus_maximus: ['glutes'], glute_medius: ['glutes'],
  hips: ['glutes'], hip_abductors: ['glutes'], piriformis: ['glutes'],
  hip_external_rotators: ['glutes'], hip_internal_rotators: ['glutes'],
  tensor_fasciae_latae: ['glutes'],
  calves: ['calves'], soleus: ['calves'], gastrocnemius: ['calves'],
  achilles_tendon: ['calves'], tibialis: ['calves'], tibialis_anterior: ['calves'],
  shins: ['calves'], plantar_fascia: ['calves'], feet: ['calves'], ankles: ['calves'],

  // ── Whole body ───────────────────────────────────────────────────────────
  // Spread across the major movers rather than all 16, so a single full-body
  // entry cannot dominate the map.
  full_body: ['chest', 'lats', 'quads', 'glutes', 'abdominals', 'front-shoulders'],
  whole_body: ['chest', 'lats', 'quads', 'glutes', 'abdominals', 'front-shoulders'],
  muscles: ['chest', 'lats', 'quads', 'glutes', 'abdominals', 'front-shoulders'],

  // ── Systemic and non-muscular ────────────────────────────────────────────
  // Real training effects with no anatomy to tint. Mapped to nothing on purpose:
  // silently dropping them would look identical to a missing synonym.
  cardiovascular_system: [], cardiovascular: [], conditioning: [],
  nervous_system: [], neuromuscular_system: [], proprioception: [],
  lungs: [], vocal_cords: [], throat: [], jaw: [], eyes: [],
  iliotibial_band: [],
  // Pelvic floor is a genuine muscle group driving the pregnancy and postpartum
  // programmes. The anatomical figures do not draw it; excluded from the map
  // rather than misattributed to the abdominals.
  pelvic_floor: [],
};

/**
 * Recovery tiers. Larger muscles hold fatigue longer; core recovers fastest
 * because it is trained at lower relative intensity and very high frequency.
 * Consumed by recovery.js — kept here so the anatomy and its decay live together.
 */
export const REGION_TIER = {
  'chest': 'large', 'lats': 'large', 'quads': 'large',
  'hamstrings': 'large', 'glutes': 'large', 'lowerback': 'large',
  'front-shoulders': 'small', 'rear-shoulders': 'small', 'biceps': 'small',
  'triceps': 'small', 'forearms': 'small', 'calves': 'small',
  'traps': 'small', 'traps-middle': 'small',
  'abdominals': 'core', 'obliques': 'core',
};

const REGION_SET = new Set(MUSCLE_REGIONS);

/** Normalise one raw library value to zero or more render regions. */
export function normaliseMuscle(raw) {
  if (!raw) return [];
  const key = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (Object.prototype.hasOwnProperty.call(MUSCLE_SYNONYMS, key)) {
    return MUSCLE_SYNONYMS[key];
  }
  // A value that is already a region name (hyphenated form) passes through.
  const hyphen = key.replace(/_/g, '-');
  if (REGION_SET.has(hyphen)) return [hyphen];
  return [];
}

/** Normalise a list of raw values to a Set of render regions. */
export function normaliseMuscles(list = []) {
  const out = new Set();
  for (const raw of list) for (const r of normaliseMuscle(raw)) out.add(r);
  return out;
}

/** Parse a `*_muscles_json` column and normalise it in one step. */
export function musclesFromJson(json) {
  if (!json) return new Set();
  try {
    const parsed = JSON.parse(json);
    return normaliseMuscles(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}
