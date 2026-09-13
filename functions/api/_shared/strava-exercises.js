/**
 * JustFit exercise → Strava `exercise_type` mapping for JSON activity uploads.
 *
 * Strava added a JSON upload format on 2026-05-21, limited to WeightTraining,
 * HighIntensityIntervalTraining, Workout and Crossfit activities. Each set
 * carries an `exercise_type` drawn from a fixed enum (the FIT exercise-name
 * vocabulary). Identifiers below were checked against the published enum; keys
 * are JustFit exercise slugs, not ids, because slugs are the stable identifier.
 *
 * Anything unmapped falls back by category — the generics are part of the enum,
 * so an unmapped exercise degrades to a valid upload rather than a rejected one.
 */

export const EXERCISE_TYPE_BY_SLUG = {
  // ── Strength · push ────────────────────────────────────────────────────────
  'push-up':                     'PUSH_UP_GENERIC',
  'hand-release-push-up':        'PUSH_UP_GENERIC',
  'knee-push-up':                'MODIFIED_PUSH_UP',
  'wall-push-up':                'WALL_PUSH_UP',
  'incline-push-up':             'INCLINE_PUSH_UP',
  'diamond-push-up':             'DIAMOND_PUSH_UP',
  'pike-push-up':                'PIKE_PUSH_UP',
  'plyometric-push-up':          'CLAP_PUSH_UPS',
  'tricep-chair-dip':            'CHAIR_DIPS',
  'dumbbell-shoulder-press':     'OVERHEAD_DUMBBELL_PRESS',
  'dumbbell-seated-overhead-press': 'SEATED_DUMBBELL_SHOULDER_PRESS',
  'dumbbell-incline-chest-press':'INCLINE_DUMBBELL_BENCH_PRESS',
  'dumbbell-lateral-raise':      'LATERAL_RAISE_GENERIC',
  'dumbbell-front-raise':        'FRONT_RAISE',
  'dumbbell-rear-delt-fly':      'DUMBBELL_REAR_DELT_FLY',
  'dumbbell-overhead-tricep-ext':'OVERHEAD_DUMBBELL_TRICEPS_EXTENSION',
  'dumbbell-tricep-kickback':    'DUMBBELL_KICKBACK',

  // ── Strength · pull ────────────────────────────────────────────────────────
  'dumbbell-bicep-curl':         'STANDING_DUMBBELL_BICEPS_CURL',
  'dumbbell-hammer-curl':        'DUMBBELL_HAMMER_CURL',
  'dumbbell-shrug':              'DUMBBELL_SHRUG',
  'high-pull':                   'BARBELL_HIGH_PULL',
  'clean-pull':                  'OLYMPIC_LIFT_GENERIC',


  // ── Pull (library batch 1, roadmap X-38) ──────────────────────────────────
  'band-lat-pulldown':             'LAT_PULLDOWN',
  'band-bent-over-row':            'BENT_OVER_ROW',
  'band-seated-row':               'ROW_GENERIC',
  'band-single-arm-row':           'ROW_GENERIC',
  'doorway-isometric-row':         'ROW_GENERIC',
  'towel-door-row':                'INVERTED_ROW',
  'inverted-row-feet-elevated':    'INVERTED_ROW',
  'inverted-row-table':            'INVERTED_ROW',
  'scapular-pull-up':              'SCAPULAR_RETRACTION',
  'negative-pull-up':              'NEGATIVE_PULL_UP',
  'assisted-pull-up-band':         'PULL_UP_GENERIC',
  'chin-up':                       'CLOSE_GRIP_CHIN_UP',
  'dead-hang':                     'DEAD_HANG',
  'band-pull-apart':               'BAND_PULLAPARTS',
  'band-face-pull':                'FACE_PULL',
  'lat-pulldown':                  'LAT_PULLDOWN',
  'seated-cable-row':              'SEATED_CABLE_ROW',
  'assisted-pull-up-machine':      'MACHINE_ASSISTED_PULL_UP',
  'straight-arm-pulldown':         'STRAIGHT_ARM_PULLDOWN',

  // ── Gym: barbell, machines, home kit (library batches 2-4, roadmap X-38) ──
  'barbell-back-squat':              'BARBELL_BACK_SQUAT',
  'barbell-front-squat':             'BARBELL_FRONT_SQUAT',
  'barbell-bench-press':             'BARBELL_BENCH_PRESS',
  'barbell-overhead-press':          'OVERHEAD_BARBELL_PRESS',
  'barbell-deadlift':                'BARBELL_DEADLIFT',
  'barbell-romanian-deadlift':       'BARBELL_ROMANIAN_DEADLIFT',
  'barbell-bent-over-row':           'BENT_OVER_BARBELL_ROW',
  'barbell-hip-thrust':              'BARBELL_HIP_THRUST',
  'barbell-reverse-lunge':           'BARBELL_REVERSE_LUNGE',
  'ez-bar-biceps-curl':              'BARBELL_BICEPS_CURL',
  'barbell-calf-raise':              'CALF_RAISE_GENERIC',
  'barbell-good-morning':            'BARBELL_GOOD_MORNING',
  'leg-press':                       'MACHINE_LEG_PRESS',
  'leg-curl-machine':                'MACHINE_LEG_CURL_SEATED',
  'leg-extension-machine':           'MACHINE_LEG_EXTENSION',
  'chest-press-machine':             'MACHINE_CHEST_PRESS',
  'pec-deck-fly':                    'PEC_DECK_BUTTERFLY',
  'cable-biceps-curl':               'CABLE_BICEPS_CURL',
  'cable-triceps-pushdown':          'CABLE_TRICEPS_PUSHDOWN',
  'machine-calf-press':              'MACHINE_CALF_PRESS',
  'cable-woodchop':                  'CABLE_WOODCHOP',
  'dip-station-dip':                 'BODY_WEIGHT_DIP',
  'machine-shoulder-press':          'MACHINE_SEATED_SHOULDER_PRESS',
  'machine-hack-squat':              'MACHINE_HACK_SQUAT',
  'jump-rope-basic':                 'JUMP_ROPE',
  'jump-rope-intervals':             'JUMP_ROPE',
  'stability-ball-plank':            'PLANK_ON_SWISSBALL',
  'stability-ball-hamstring-curl':   'SLIDING_LEG_CURL',
  'stability-ball-dead-bug':         'CORE_GENERIC',
  'bench-step-up':                   'STEP_UP',
  'bench-hip-thrust-bodyweight':     'HIP_THRUST',
  'mat-hip-bridge-march':            'SINGLE_LEG_GLUTE_BRIDGE',
  'mat-supine-spinal-twist':         'LYING_SPINAL_TWIST',
  'mat-prone-swimmer':               'SUPERMAN_FROM_FLOOR',
  'trail-hike-steady':               'CARDIO_GENERIC',
  'trail-hill-repeats':              'CARDIO_GENERIC',

  // ── Core, calf and kettlebell (library batch 5, roadmap X-37) ─────────────
  'band-pallof-press':               'PALLOF_PRESS',
  'cable-pallof-press':              'PALLOF_PRESS',
  'side-plank-hip-dip':              'SIDE_PLANK_HIP_FLEXION',
  'suitcase-carry':                  'SUITCASE_CARRY',
  'reverse-crunch':                  'REVERSE_CRUNCH',
  'band-dead-bug':                   'BANDED_DEADBUG',
  'copenhagen-plank':                'LL_COPENHAGEN_PLANK',
  'stability-ball-stir-the-pot':     'SWISSBALL_STIR_POT',
  'hanging-knee-raise':              'HANGING_KNEE_RAISE',
  'plank-pull-through':              'PLANK_PULL_THROUGH',
  'bear-crawl-hold':                 'BEAR_CRAWL',
  'band-wood-chop':                  'CABLE_WOODCHOP',
  'seated-calf-raise':               'SEATED_CALF_RAISE',
  'eccentric-calf-raise-step':       'DOUBLE_LEG_CALF_RAISE_ON_STEP',
  'bent-knee-calf-raise':            'BENT_KNEE_CALF_RAISE',
  'soleus-wall-sit':                 'WALL_SIT',
  'tibialis-raise':                  'TIBIALIS_RAISE',
  'toe-walk':                        'TOE_WALKS',
  'heel-walk':                       'HEEL_WALKS',
  'pogo-hops':                       'POGO_JUMPS',
  'dumbbell-calf-raise':             'BENT_KNEE_DUMBBELL_CALF_RAISE',
  'kettlebell-turkish-get-up':       'TURKISH_GET_UP',
  'kettlebell-clean':                'KETTLEBELL_CLEAN',
  'kettlebell-clean-and-press':      'SINGLE_ARM_CLEAN_AND_PRESS',
  'kettlebell-snatch':               'SINGLE_ARM_KETTLEBELL_SNATCH',
  'kettlebell-windmill':             'KETTLEBELL_WINDMILL',
  'kettlebell-row':                  'KETTLEBELL_ROW',
  'kettlebell-front-rack-squat':     'KB_FRONT_RACKED_SQUAT',
  'kettlebell-farmers-carry':        'FARMERS_CARRY',
  'kettlebell-high-pull':            'KETTLEBELL_UPRIGHT_ROW',
  'kettlebell-strict-press':         'STANDING_SINGLE_ARM_SHOULDER_PRESS',
  'kettlebell-swing':                'KETTLEBELL_SWING',
  'kettlebell-goblet-squat':         'KETTLEBELL_SQUAT',
  'kettlebell-deadlift':             'KETTLEBELL_DEADLIFT',
  'kettlebell-halo':                 'KETTLEBELL_HALO',
  'kettlebell-single-arm-press':     'STANDING_SINGLE_ARM_SHOULDER_PRESS',
  'kettlebell-single-leg-rdl':       'SINGLE_LEG_ROMANIAN_DEADLIFTS',
  'hollow-body-hold':                'HOLLOW_ROCK',
  'v-up':                            'SIT_UP_GENERIC',
  'hanging-leg-raise':               'HANGING_LEG_RAISE',
  'bear-crawl':                      'BEAR_CRAWL',
  'shoulder-tap':                    'PLANK_SHOULDER_TAP',
  'squat-calf-raise':                'SQUAT_TO_CALF_RAISE',
  // ── Strength · legs / hinge ────────────────────────────────────────────────
  'squat':                       'SQUAT_GENERIC',
  'back-squat':                  'BARBELL_BACK_SQUAT',
  'front-squat':                 'BARBELL_FRONT_SQUAT',
  'sumo-squat':                  'SUMO_SQUAT',
  'wall-sit':                    'WALL_SIT',
  'supported-wall-squat':        'WALL_SIT',
  'lunge':                       'LUNGE_GENERIC',
  'dumbbell-lunge':              'LUNGE_GENERIC',
  'reverse-lunge':               'REVERSE_LUNGE',
  'lateral-lunge':               'LATERAL_LUNGE',
  'curtsy-lunge':                'CURTSY_LUNGE',
  'dumbbell-deadlift':           'DUMBBELL_DEADLIFT',
  'dumbbell-romanian-deadlift':  'DUMBBELL_ROMANIAN_DEADLIFTS',
  'dumbbell-sumo-deadlift':      'SUMO_DEADLIFT',
  'single-leg-deadlift':         'SINGLE_LEG_ROMANIAN_DEADLIFTS',
  'good-morning-bodyweight':     'GOOD_MORNING',
  'calf-raise':                  'CALF_RAISE_GENERIC',
  'single-leg-calf-raise':       'SINGLE_LEG_STANDING_CALF_RAISE',
  'standing-hip-abduction':      'STANDING_HIP_ABDUCTION',
  'side-lying-hip-abduction':    'SIDE_LYING_LEG_RAISE',
  'donkey-kick':                 'DONKEY_KICKS',
  'prone-hip-extension':         'DONKEY_KICKS',
  'fire-hydrant':                'FIRE_HYDRANTS',
  'clamshell':                   'BANDED_CLAMS',
  'single-leg-glute-bridge':     'SINGLE_LEG_GLUTE_BRIDGE',
  'supported-glute-bridge':      'GLUTE_BRIDGE',

  // ── Strength · core ────────────────────────────────────────────────────────
  'plank':                       'PLANK_GENERIC',
  'modified-plank':              'PLANK_GENERIC',
  'side-plank':                  'SIDE_PLANK',
  'plank-shoulder-tap':          'PLANK_SHOULDER_TAP',
  'bicycle-crunch':              'BICYCLE_CRUNCH',
  'flutter-kicks':               'FLUTTER_KICKS',
  'dead-bug':                    'CORE_GENERIC',
  'deep-core-activation':        'CORE_GENERIC',
  'sphinx-hold':                 'CORE_GENERIC',
  'bird-dog':                    'BIRD_DOG',
  'superman-hold':               'SUPERMAN_FROM_FLOOR',
  'cobra-press-up':              'HYPEREXTENSION_GENERIC',
  'dumbbell-wood-chop':          'CHOP_GENERIC',
  'mountain-climber':            'MOUNTAIN_CLIMBER',

  // ── Strength · carry / power ───────────────────────────────────────────────
  'dumbbell-farmers-walk':       'FARMERS_WALK',
  'weighted-march':              'CARRY_GENERIC',
  'counter-movement-jump':       'BODY_WEIGHT_JUMP_SQUAT',
  'jump-squat':                  'BODY_WEIGHT_JUMP_SQUAT',
  'squat-pulse':                 'SQUAT_GENERIC',
  'scissor-jump':                'ALTERNATING_JUMP_LUNGE',
  'skater-hop':                  'SKATER_LUNGE',
  'tuck-jump':                   'PLYO_GENERIC',

  // ── Cardio ─────────────────────────────────────────────────────────────────
  'box-step-up':                 'STEP_UP',
  'jump-rope-simulation':        'JUMP_ROPE',
  'low-impact-jumping-jacks':    'JUMPING_JACKS',
  'march-in-place':              'STANDING_MARCH',
  'sprint-in-place':             'HIGH_KNEES',
  'lateral-knee-raise':          'HIGH_KNEES',
  'rowing-intervals':            'ROWING_MACHINE',
  'rowing-steady-state':         'ROWING_MACHINE',

  // ── Mobility · genuine matches in the enum ─────────────────────────────────
  'cat-cow-pregnancy':           'CAT_COW',
  'pigeon-pose':                 'PIGEON_POSE',
  'standing-figure-four':        'STANDING_PIGEON_POSE',
  'standing-quad-stretch':       'STANDING_QUAD_STRETCH',
  'side-lying-quad-stretch':     'SIDE_LYING_QUAD_STRETCH',
  'seated-hamstring-stretch':    'SEATED_HAMSTRING_STRETCH',
  'standing-hamstring-stretch':  'STANDING_HAMSTRING_STRETCH',
  'hip-flexor-stretch':          'KNEELING_HIP_FLEXOR_STRETCH',
  'half-kneeling-hip-opener':    'KNEELING_HIP_FLEXOR_STRETCH',
  'glute-piriformis-stretch':    'LYING_PIRIFORMIS_STRETCH',
  'seated-spinal-twist':         'LYING_SPINAL_TWIST',
  'cross-body-shoulder-stretch': 'CROSS_BODY_SHOULDER_STRETCH',
  'wall-chest-stretch':          'WALL_CHEST_STRETCH',
  'chest-opener-arms':           'WALL_CHEST_STRETCH',
  'thread-the-needle':           'THREAD_THE_NEEDLE_STRETCH',
  'seated-thoracic-rotation':    'THORACIC_ROTATION',
  'thoracic-extension-chair':    'THORACIC_ROTATION',
  'neck-stretch':                'NECK_TILTS',
  'shoulder-roll-stretch':       'SHOULDER_ROTATIONS',
  'ankle-mobility-circles':      'ANKLE_CIRCLES',
  'wrist-ankle-circles':         'ANKLE_CIRCLES',
  'gentle-hip-circles':          'STANDING_HIP_CIRCLES',
};

/** Enum generics, used when a slug has no specific match. */
const FALLBACK_BY_CATEGORY = {
  strength: 'TOTAL_BODY_GENERIC',
  cardio:   'CARDIO_GENERIC',
  mixed:    'TOTAL_BODY_GENERIC',
  mobility: 'WARM_UP_GENERIC',
  skill:    'TOTAL_BODY_GENERIC',
  recovery: 'WARM_UP_GENERIC',
};

export function exerciseTypeFor(exercise) {
  if (!exercise) return 'TOTAL_BODY_GENERIC';
  return EXERCISE_TYPE_BY_SLUG[exercise.slug]
      ?? FALLBACK_BY_CATEGORY[exercise.category]
      ?? 'TOTAL_BODY_GENERIC';
}

/**
 * Breathwork and meditation are not activities anyone wants on a Strava feed,
 * and a session made only of them has nothing meaningful to upload.
 */
export function isUploadableCategory(category) {
  return category === 'strength' || category === 'cardio'
      || category === 'mixed'    || category === 'skill'
      || category === 'mobility';
}

// ── Muscle summary ────────────────────────────────────────────────────────────
// Strava has no public media-upload endpoint (photos are partner-only), so the
// JustFit muscle map cannot be posted as an image. This renders the same
// information as text for the activity description instead.

const MUSCLE_LABELS = {
  chest: 'Chest', lats: 'Lats', traps: 'Traps', lower_back: 'Lower back',
  back: 'Back', delts_front: 'Front delts', delts_rear: 'Rear delts',
  shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Forearms', forearms_front: 'Forearms', forearms_back: 'Forearms',
  abs: 'Abs', abdominals: 'Abs', obliques: 'Obliques', core: 'Core',
  quads: 'Quads', quadriceps: 'Quads', hamstrings: 'Hamstrings',
  glutes: 'Glutes', calves: 'Calves', adductors: 'Adductors',
  abductors: 'Abductors', hip_flexors: 'Hip flexors', legs: 'Legs',
  arms: 'Arms', neck: 'Neck', pelvic_floor: 'Pelvic floor',
};

export function muscleLabel(key) {
  return MUSCLE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Rank muscles by how much work they took in this session, so the description
 * leads with what was actually trained.
 * `entries` is [{ muscles: string[], sets: number }].
 */
export function rankMuscles(entries, limit = 6) {
  const tally = new Map();
  for (const { muscles, sets } of entries) {
    for (const m of muscles ?? []) {
      const label = muscleLabel(m);
      tally.set(label, (tally.get(label) ?? 0) + (sets || 1));
    }
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, score]) => ({ label, score }));
}
