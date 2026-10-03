-- 0115 — make the substitution graph symmetric (W5.2).
--
-- After 0113 removed the dangling targets, alternatives_json.substitutions held
-- 380 links of which only 86 (23%) were reciprocated: if A offered B as a swap, B rarely
-- offered A back. From the user's side that is a dead end — pick "Show
-- alternatives" on one exercise, swap to the alternative, and the alternative's
-- own sheet does not list the exercise you came from.
--
-- For every remaining link A -> B where B did not list A, A is appended to B's
-- list (rows that had no alternatives at all get a new list). Constraints:
--   * a list never exceeds 5 entries; existing entries are always kept, so when B
--     is already full the mirror link is skipped, not made by evicting anything
--   * targets are only slugs that exist and are active in the library
--   * the Cooper test keeps no alternatives (see 0113): nothing links to it, so
--     the mirror cannot add any
--   * a Defence protocol exercise is never mirrored into a civilian exercise's list
--     (see 0116): R596 keeps protocol work out of civilian sessions, and the swap
--     sheet must not offer it back. Only weighted-march has alternatives, so this
--     withholds 2 links: weighted-march -> march-in-place, weighted-march -> heel-dig-march
-- Result: 650 links, 626 reciprocated (96%). 24 links stay one-way: 22 because the
-- target list was already full, 2 withheld as above. Rows written: 155.
--
-- Skipped (A -> B, B full):
--   alternating-front-kick -> high-knees
--   stair-climb-simulation -> high-knees
--   stride-outs -> run-intervals-outdoor
--   treadmill-intervals -> run-intervals-outdoor
--   treadmill-hill-run -> treadmill-run-steady
--   rowing-zone2 -> rowing-steady-state
--   rowing-zone2 -> cycling-zone2-ride
--   cycling-outdoor-easy -> cycling-zone2-ride
--   cycling-outdoor-easy -> cycling-tempo-effort
--   trail-run-easy -> easy-run-outdoor
--   trail-run-easy -> zone2-easy-run
--   trail-run-easy -> fartlek-run
--   foam-roll-it-band -> band-lateral-walk
--   happy-baby-pose -> ninety-ninety-hip-switch
--   inverted-row-table -> band-row-seated
--   reverse-plank -> hollow-body-hold
--   lunge -> reverse-lunge
--   bicycle-crunch -> dead-bug
--   flutter-kicks -> dead-bug
--   flutter-kicks -> hollow-body-hold
--   scissor-jump -> reverse-lunge
--   front-squat -> dumbbell-goblet-squat

UPDATE exercises SET alternatives_json = '{"substitutions": ["march-in-place", "jumping-jacks", "heel-dig-march", "mountain-climbers", "jumping-jack"]}', updated_at_ms = 1791032562000 WHERE slug = 'high-knees';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees", "burpee"]}', updated_at_ms = 1791032562000 WHERE slug = 'mountain-climbers';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees", "jumping-jack"]}', updated_at_ms = 1791032562000 WHERE slug = 'march-in-place';
UPDATE exercises SET alternatives_json = '{"substitutions": ["speed-skater"]}', updated_at_ms = 1791032562000 WHERE slug = 'skater-hop';
UPDATE exercises SET alternatives_json = '{"substitutions": ["stair-climb-simulation", "power-step-up-jump"]}', updated_at_ms = 1791032562000 WHERE slug = 'box-step-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["speed-bag-simulation", "boxing-combination"]}', updated_at_ms = 1791032562000 WHERE slug = 'shadow-boxing';
UPDATE exercises SET alternatives_json = '{"substitutions": ["jumping-jack"]}', updated_at_ms = 1791032562000 WHERE slug = 'low-impact-jumping-jacks';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees"]}', updated_at_ms = 1791032562000 WHERE slug = 'heel-dig-march';
UPDATE exercises SET alternatives_json = '{"substitutions": ["speed-skater", "cross-country-ski-step", "lateral-shuffle-drill"]}', updated_at_ms = 1791032562000 WHERE slug = 'grapevine-step';
UPDATE exercises SET alternatives_json = '{"substitutions": ["alternating-front-kick", "speed-bag-simulation", "bicycle-crunch"]}', updated_at_ms = 1791032562000 WHERE slug = 'standing-bicycle';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cross-country-ski-step", "lateral-shuffle-drill"]}', updated_at_ms = 1791032562000 WHERE slug = 'shuffle-tap';
UPDATE exercises SET alternatives_json = '{"substitutions": ["speed-bag-simulation", "boxing-combination"]}', updated_at_ms = 1791032562000 WHERE slug = 'seated-cardio-punch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["broad-jump", "power-step-up-jump", "squat", "scissor-jump", "counter-movement-jump"]}', updated_at_ms = 1791032562000 WHERE slug = 'jump-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["broad-jump", "counter-movement-jump"]}', updated_at_ms = 1791032562000 WHERE slug = 'tuck-jump';
UPDATE exercises SET alternatives_json = '{"substitutions": ["alternating-front-kick", "reverse-lunge-kick"]}', updated_at_ms = 1791032562000 WHERE slug = 'lateral-knee-raise';
UPDATE exercises SET alternatives_json = '{"substitutions": ["stationary-bike-steady", "cycling-intervals-indoor", "rowing-steady-state", "cycling-zone2-ride"]}', updated_at_ms = 1791032562000 WHERE slug = 'steady-indoor-cycle';
UPDATE exercises SET alternatives_json = '{"substitutions": ["steady-indoor-cycle", "stationary-bike-steady", "cycling-tempo-effort", "cycling-sprint-intervals", "cycling-pyramid-effort"]}', updated_at_ms = 1791032562000 WHERE slug = 'cycling-intervals-indoor';
UPDATE exercises SET alternatives_json = '{"substitutions": ["steady-indoor-cycle", "cycling-intervals-indoor", "cycling-zone2-ride"]}', updated_at_ms = 1791032562000 WHERE slug = 'stationary-bike-steady';
UPDATE exercises SET alternatives_json = '{"substitutions": ["rowing-intervals", "steady-indoor-cycle", "rowing-2k-time-trial", "rowing-pyramid-intervals", "rowing-technique-drill"]}', updated_at_ms = 1791032562000 WHERE slug = 'rowing-steady-state';
UPDATE exercises SET alternatives_json = '{"substitutions": ["rowing-steady-state", "rowing-2k-time-trial", "rowing-pyramid-intervals", "rowing-power-strokes"]}', updated_at_ms = 1791032562000 WHERE slug = 'rowing-intervals';
UPDATE exercises SET alternatives_json = '{"substitutions": ["tempo-run-outdoor", "run-intervals-outdoor", "treadmill-run-steady", "zone2-easy-run", "brisk-walk"]}', updated_at_ms = 1791032562000 WHERE slug = 'easy-run-outdoor';
UPDATE exercises SET alternatives_json = '{"substitutions": ["easy-run-outdoor", "run-intervals-outdoor", "treadmill-run-steady", "fartlek-run"]}', updated_at_ms = 1791032562000 WHERE slug = 'tempo-run-outdoor';
UPDATE exercises SET alternatives_json = '{"substitutions": ["easy-run-outdoor", "tempo-run-outdoor", "treadmill-run-steady", "fartlek-run", "hill-repeats-running"]}', updated_at_ms = 1791032562000 WHERE slug = 'run-intervals-outdoor';
UPDATE exercises SET alternatives_json = '{"substitutions": ["easy-run-outdoor", "tempo-run-outdoor", "run-intervals-outdoor", "zone2-easy-run", "treadmill-intervals"]}', updated_at_ms = 1791032562000 WHERE slug = 'treadmill-run-steady';
UPDATE exercises SET alternatives_json = '{"substitutions": ["jump-squat", "tuck-jump", "power-step-up-jump", "counter-movement-jump"]}', updated_at_ms = 1791032562000 WHERE slug = 'broad-jump';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees", "lateral-knee-raise", "standing-bicycle", "reverse-lunge-kick"]}', updated_at_ms = 1791032562000 WHERE slug = 'alternating-front-kick';
UPDATE exercises SET alternatives_json = '{"substitutions": ["shadow-boxing", "standing-bicycle", "seated-cardio-punch", "boxing-combination"]}', updated_at_ms = 1791032562000 WHERE slug = 'speed-bag-simulation';
UPDATE exercises SET alternatives_json = '{"substitutions": ["shuffle-tap", "grapevine-step", "band-lateral-walk", "speed-skater", "cross-country-ski-step"]}', updated_at_ms = 1791032562000 WHERE slug = 'lateral-shuffle-drill';
UPDATE exercises SET alternatives_json = '{"substitutions": ["box-step-up", "jump-squat", "broad-jump", "stair-climb-simulation", "hill-repeats-running"]}', updated_at_ms = 1791032562000 WHERE slug = 'power-step-up-jump';
UPDATE exercises SET alternatives_json = '{"substitutions": ["reverse-lunge", "dumbbell-lunge", "dumbbell-bulgarian-split-squat", "lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'walking-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["easy-run-outdoor", "treadmill-run-steady", "brisk-walk", "fartlek-run", "stride-outs"]}', updated_at_ms = 1791032562000 WHERE slug = 'zone2-easy-run';
UPDATE exercises SET alternatives_json = '{"substitutions": ["run-intervals-outdoor", "tempo-run-outdoor", "zone2-easy-run", "hill-repeats-running", "stride-outs"]}', updated_at_ms = 1791032562000 WHERE slug = 'fartlek-run';
UPDATE exercises SET alternatives_json = '{"substitutions": ["run-intervals-outdoor", "fartlek-run", "power-step-up-jump", "treadmill-hill-run"]}', updated_at_ms = 1791032562000 WHERE slug = 'hill-repeats-running';
UPDATE exercises SET alternatives_json = '{"substitutions": ["zone2-easy-run", "easy-run-outdoor", "cycling-outdoor-easy"]}', updated_at_ms = 1791032562000 WHERE slug = 'brisk-walk';
UPDATE exercises SET alternatives_json = '{"substitutions": ["steady-indoor-cycle", "stationary-bike-steady", "cycling-tempo-effort", "cycling-hill-climb", "cycling-sweet-spot"]}', updated_at_ms = 1791032562000 WHERE slug = 'cycling-zone2-ride';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cycling-zone2-ride", "cycling-sweet-spot", "cycling-intervals-indoor", "cycling-hill-climb", "cycling-sprint-intervals"]}', updated_at_ms = 1791032562000 WHERE slug = 'cycling-tempo-effort';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cycling-tempo-effort", "cycling-hill-climb", "cycling-zone2-ride", "cycling-pyramid-effort"]}', updated_at_ms = 1791032562000 WHERE slug = 'cycling-sweet-spot';
UPDATE exercises SET alternatives_json = '{"substitutions": ["rowing-intervals", "rowing-pyramid-intervals", "rowing-steady-state", "rowing-power-strokes"]}', updated_at_ms = 1791032562000 WHERE slug = 'rowing-2k-time-trial';
UPDATE exercises SET alternatives_json = '{"substitutions": ["rowing-intervals", "rowing-2k-time-trial", "rowing-steady-state", "rowing-technique-drill", "rowing-power-strokes"]}', updated_at_ms = 1791032562000 WHERE slug = 'rowing-pyramid-intervals';
UPDATE exercises SET alternatives_json = '{"substitutions": ["rowing-steady-state", "rowing-pyramid-intervals", "rowing-zone2"]}', updated_at_ms = 1791032562000 WHERE slug = 'rowing-technique-drill';
UPDATE exercises SET alternatives_json = '{"substitutions": ["plank", "dead-bug", "bird-dog", "bear-crawl"]}', updated_at_ms = 1791032562000 WHERE slug = 'mountain-climber';
UPDATE exercises SET alternatives_json = '{"substitutions": ["thread-the-needle", "childs-pose"]}', updated_at_ms = 1791032562000 WHERE slug = 'cat-cow';
UPDATE exercises SET alternatives_json = '{"substitutions": ["90-90-stretch", "couch-stretch", "leg-swings-front-back", "foam-roll-hip-flexors"]}', updated_at_ms = 1791032562000 WHERE slug = 'hip-flexor-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["shoulder-circles-active", "neck-half-circles"]}', updated_at_ms = 1791032562000 WHERE slug = 'shoulder-roll-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["neck-half-circles"]}', updated_at_ms = 1791032562000 WHERE slug = 'neck-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["lying-hamstring-stretch"]}', updated_at_ms = 1791032562000 WHERE slug = 'standing-forward-fold';
UPDATE exercises SET alternatives_json = '{"substitutions": ["90-90-stretch", "ninety-ninety-hip-switch", "supine-figure-four", "supine-knee-to-chest"]}', updated_at_ms = 1791032562000 WHERE slug = 'pigeon-pose';
UPDATE exercises SET alternatives_json = '{"substitutions": ["active-thoracic-rotation", "seated-straddle-stretch"]}', updated_at_ms = 1791032562000 WHERE slug = 'seated-spinal-twist';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cat-cow"]}', updated_at_ms = 1791032562000 WHERE slug = 'thread-the-needle';
UPDATE exercises SET alternatives_json = '{"substitutions": ["flutter-kicks"]}', updated_at_ms = 1791032562000 WHERE slug = 'heel-slides';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-lateral-walk", "band-hip-abduction-standing"]}', updated_at_ms = 1791032562000 WHERE slug = 'side-lying-hip-abduction';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-hip-thrust", "reverse-plank"]}', updated_at_ms = 1791032562000 WHERE slug = 'supported-glute-bridge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["glute-bridge", "dumbbell-hip-thrust"]}', updated_at_ms = 1791032562000 WHERE slug = 'single-leg-glute-bridge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["calf-stretch-wall", "foam-roll-calves"]}', updated_at_ms = 1791032562000 WHERE slug = 'ankle-mobility-circles';
UPDATE exercises SET alternatives_json = '{"substitutions": ["foam-roll-upper-back"]}', updated_at_ms = 1791032562000 WHERE slug = 'thoracic-extension-chair';
UPDATE exercises SET alternatives_json = '{"substitutions": ["shoulder-circles-active", "foam-roll-lats"]}', updated_at_ms = 1791032562000 WHERE slug = 'chest-opener-arms';
UPDATE exercises SET alternatives_json = '{"substitutions": ["lunge-thoracic-rotation"]}', updated_at_ms = 1791032562000 WHERE slug = 'world-greatest-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["supine-figure-four"]}', updated_at_ms = 1791032562000 WHERE slug = 'standing-figure-four';
UPDATE exercises SET alternatives_json = '{"substitutions": ["ninety-ninety-hip-switch", "couch-stretch", "deep-squat-hold"]}', updated_at_ms = 1791032562000 WHERE slug = 'half-kneeling-hip-opener';
UPDATE exercises SET alternatives_json = '{"substitutions": ["foam-roll-quads"]}', updated_at_ms = 1791032562000 WHERE slug = 'side-lying-quad-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["deep-squat-hold", "seated-straddle-stretch", "happy-baby-pose"]}', updated_at_ms = 1791032562000 WHERE slug = 'seated-butterfly';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cat-cow-flow", "active-thoracic-rotation"]}', updated_at_ms = 1791032562000 WHERE slug = 'seated-thoracic-rotation';
UPDATE exercises SET alternatives_json = '{"substitutions": ["lying-hamstring-stretch", "seated-straddle-stretch", "foam-roll-hamstrings"]}', updated_at_ms = 1791032562000 WHERE slug = 'seated-hamstring-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["lying-hamstring-stretch"]}', updated_at_ms = 1791032562000 WHERE slug = 'standing-hamstring-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'supported-wall-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["wrist-flexor-stretch"]}', updated_at_ms = 1791032562000 WHERE slug = 'forearm-wrist-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["supine-figure-four", "foam-roll-it-band", "foam-roll-glutes"]}', updated_at_ms = 1791032562000 WHERE slug = 'glute-piriformis-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cat-cow-flow"]}', updated_at_ms = 1791032562000 WHERE slug = 'cat-cow-pregnancy';
UPDATE exercises SET alternatives_json = '{"substitutions": ["half-kneeling-hip-opener", "pigeon-pose", "couch-stretch", "leg-swings-lateral", "deep-squat-hold"]}', updated_at_ms = 1791032562000 WHERE slug = 'ninety-ninety-hip-switch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["hip-flexor-stretch", "half-kneeling-hip-opener", "ninety-ninety-hip-switch", "leg-swings-front-back", "foam-roll-hip-flexors"]}', updated_at_ms = 1791032562000 WHERE slug = 'couch-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["seated-thoracic-rotation", "active-thoracic-rotation", "cat-cow-pregnancy", "lunge-thoracic-rotation", "foam-roll-upper-back"]}', updated_at_ms = 1791032562000 WHERE slug = 'cat-cow-flow';
UPDATE exercises SET alternatives_json = '{"substitutions": ["ankle-mobility-circles", "single-leg-calf-raise", "ankle-pumps", "foam-roll-calves"]}', updated_at_ms = 1791032562000 WHERE slug = 'calf-stretch-wall';
UPDATE exercises SET alternatives_json = '{"substitutions": ["seated-thoracic-rotation", "cat-cow-flow", "seated-spinal-twist", "lunge-thoracic-rotation", "foam-roll-upper-back"]}', updated_at_ms = 1791032562000 WHERE slug = 'active-thoracic-rotation';
UPDATE exercises SET alternatives_json = '{"substitutions": ["pigeon-pose", "glute-piriformis-stretch", "standing-figure-four", "foam-roll-glutes", "supine-knee-to-chest"]}', updated_at_ms = 1791032562000 WHERE slug = 'supine-figure-four';
UPDATE exercises SET alternatives_json = '{"substitutions": ["seated-hamstring-stretch", "standing-hamstring-stretch", "standing-forward-fold", "foam-roll-hamstrings"]}', updated_at_ms = 1791032562000 WHERE slug = 'lying-hamstring-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["478-breathing"]}', updated_at_ms = 1791032562000 WHERE slug = 'box-breathing';
UPDATE exercises SET alternatives_json = '{"substitutions": ["progressive-relaxation-body"]}', updated_at_ms = 1791032562000 WHERE slug = 'body-scan-meditation';
UPDATE exercises SET alternatives_json = '{"substitutions": ["wrist-flexor-stretch"]}', updated_at_ms = 1791032562000 WHERE slug = 'wrist-ankle-circles';
UPDATE exercises SET alternatives_json = '{"substitutions": ["478-breathing"]}', updated_at_ms = 1791032562000 WHERE slug = 'alternate-nostril-breathing';
UPDATE exercises SET alternatives_json = '{"substitutions": ["478-breathing"]}', updated_at_ms = 1791032562000 WHERE slug = 'pursed-lip-breathing';
UPDATE exercises SET alternatives_json = '{"substitutions": ["progressive-relaxation-body"]}', updated_at_ms = 1791032562000 WHERE slug = 'tension-release-visualization';
UPDATE exercises SET alternatives_json = '{"substitutions": ["supine-knee-to-chest"]}', updated_at_ms = 1791032562000 WHERE slug = 'legs-up-wall';
UPDATE exercises SET alternatives_json = '{"substitutions": ["progressive-relaxation-body"]}', updated_at_ms = 1791032562000 WHERE slug = 'mindful-body-check';
UPDATE exercises SET alternatives_json = '{"substitutions": ["calf-stretch-wall"]}', updated_at_ms = 1791032562000 WHERE slug = 'ankle-pumps';
UPDATE exercises SET alternatives_json = '{"substitutions": ["foam-roll-it-band", "side-lying-quad-stretch", "foam-roll-hip-flexors", "foam-roll-calves"]}', updated_at_ms = 1791032562000 WHERE slug = 'foam-roll-quads';
UPDATE exercises SET alternatives_json = '{"substitutions": ["foam-roll-quads", "glute-piriformis-stretch", "band-lateral-walk", "foam-roll-glutes"]}', updated_at_ms = 1791032562000 WHERE slug = 'foam-roll-it-band';
UPDATE exercises SET alternatives_json = '{"substitutions": ["thoracic-extension-chair", "active-thoracic-rotation", "cat-cow-flow", "foam-roll-lats"]}', updated_at_ms = 1791032562000 WHERE slug = 'foam-roll-upper-back';
UPDATE exercises SET alternatives_json = '{"substitutions": ["calf-stretch-wall", "ankle-mobility-circles", "foam-roll-quads", "foam-roll-hamstrings"]}', updated_at_ms = 1791032562000 WHERE slug = 'foam-roll-calves';
UPDATE exercises SET alternatives_json = '{"substitutions": ["pigeon-pose", "supine-figure-four", "legs-up-wall", "childs-pose", "happy-baby-pose"]}', updated_at_ms = 1791032562000 WHERE slug = 'supine-knee-to-chest';
UPDATE exercises SET alternatives_json = '{"substitutions": ["supine-knee-to-chest", "seated-butterfly", "ninety-ninety-hip-switch", "childs-pose"]}', updated_at_ms = 1791032562000 WHERE slug = 'happy-baby-pose';
UPDATE exercises SET alternatives_json = '{"substitutions": ["incline-push-up", "knee-push-up", "dumbbell-floor-press", "hand-release-push-up", "plyometric-push-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'push-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["side-plank", "dead-bug", "bird-dog", "mountain-climber"]}', updated_at_ms = 1791032562000 WHERE slug = 'plank';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'wall-sit';
UPDATE exercises SET alternatives_json = '{"substitutions": ["mountain-climber", "plank", "single-leg-deadlift"]}', updated_at_ms = 1791032562000 WHERE slug = 'bird-dog';
UPDATE exercises SET alternatives_json = '{"substitutions": ["mountain-climber", "plank", "hanging-leg-raise", "hollow-body-hold", "v-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'dead-bug';
UPDATE exercises SET alternatives_json = '{"substitutions": ["reverse-lunge-kick", "walking-lunge", "forward-lunge", "dumbbell-bulgarian-split-squat", "pistol-squat-assist"]}', updated_at_ms = 1791032562000 WHERE slug = 'reverse-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["push-up", "dumbbell-floor-press", "hand-release-push-up", "plyometric-push-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'incline-push-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-concentration-curl", "dumbbell-reverse-curl", "band-bicep-curl"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-bicep-curl';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-arnold-press", "band-overhead-press", "kettlebell-single-arm-press"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-shoulder-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-upright-row"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-lateral-raise';
UPDATE exercises SET alternatives_json = '{"substitutions": ["kettlebell-deadlift"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-deadlift';
UPDATE exercises SET alternatives_json = '{"substitutions": ["plank"]}', updated_at_ms = 1791032562000 WHERE slug = 'side-plank';
UPDATE exercises SET alternatives_json = '{"substitutions": ["push-up", "hand-release-push-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'knee-push-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-goblet-squat", "band-squat", "kettlebell-goblet-squat", "squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'sumo-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-side-lunge", "pistol-squat-assist", "lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'lateral-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-side-lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'curtsy-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-lateral-walk", "band-hip-abduction-standing"]}', updated_at_ms = 1791032562000 WHERE slug = 'standing-hip-abduction';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-single-leg-rdl", "kettlebell-swing", "nordic-hamstring-curl"]}', updated_at_ms = 1791032562000 WHERE slug = 'good-morning-bodyweight';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-renegade-row", "bear-crawl"]}', updated_at_ms = 1791032562000 WHERE slug = 'plank-shoulder-tap';
UPDATE exercises SET alternatives_json = '{"substitutions": ["hollow-body-hold"]}', updated_at_ms = 1791032562000 WHERE slug = 'modified-plank';
UPDATE exercises SET alternatives_json = '{"substitutions": ["calf-stretch-wall"]}', updated_at_ms = 1791032562000 WHERE slug = 'single-leg-calf-raise';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-single-leg-rdl", "kettlebell-swing", "kettlebell-single-leg-rdl", "kettlebell-deadlift", "nordic-hamstring-curl"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-romanian-deadlift';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-concentration-curl", "dumbbell-reverse-curl", "band-bicep-curl"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-hammer-curl';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-pull-apart", "band-face-pull"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-rear-delt-fly';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-goblet-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-sumo-deadlift';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-suitcase-carry"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-farmers-walk';
UPDATE exercises SET alternatives_json = '{"substitutions": ["walking-lunge", "dumbbell-bulgarian-split-squat", "dumbbell-side-lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-upright-row", "high-pull"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-shrug';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-suitcase-carry"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-wood-chop';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-arnold-press", "band-overhead-press"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-seated-overhead-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-floor-chest-fly", "dumbbell-chest-press-floor"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-incline-chest-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-bent-over-row", "band-row-seated", "dumbbell-renegade-row", "chin-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-single-arm-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-single-arm-row", "band-row-seated", "inverted-row-table"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-bent-over-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-shoulder-press", "dumbbell-seated-overhead-press", "band-overhead-press", "kettlebell-single-arm-press", "kettlebell-halo"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-arnold-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-sumo-deadlift", "sumo-squat", "kettlebell-goblet-squat", "band-squat", "back-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-goblet-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-lunge", "reverse-lunge", "dumbbell-side-lunge", "walking-lunge", "pistol-squat-assist"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-bulgarian-split-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["supported-glute-bridge", "single-leg-glute-bridge", "kettlebell-swing", "reverse-plank"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-hip-thrust';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-romanian-deadlift", "kettlebell-single-leg-rdl", "good-morning-bodyweight", "nordic-hamstring-curl"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-single-leg-rdl';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-lateral-raise", "dumbbell-shrug", "clean-pull", "high-pull"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-upright-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["lateral-lunge", "dumbbell-lunge", "curtsy-lunge", "dumbbell-bulgarian-split-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'dumbbell-side-lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-single-arm-row", "dumbbell-bent-over-row", "band-face-pull", "dumbbell-row", "pull-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-row-seated';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-pull-apart", "dumbbell-rear-delt-fly", "band-row-seated"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-face-pull';
UPDATE exercises SET alternatives_json = '{"substitutions": ["standing-hip-abduction", "side-lying-hip-abduction", "band-hip-abduction-standing", "lateral-shuffle-drill", "leg-swings-lateral"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-lateral-walk';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-shoulder-press", "dumbbell-seated-overhead-press", "dumbbell-arnold-press", "kettlebell-single-arm-press"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-overhead-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["sumo-squat", "dumbbell-goblet-squat", "wall-sit", "kettlebell-goblet-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-romanian-deadlift", "good-morning-bodyweight", "dumbbell-hip-thrust", "kettlebell-deadlift", "clean-pull"]}', updated_at_ms = 1791032562000 WHERE slug = 'kettlebell-swing';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-arnold-press", "shoulder-circles-active"]}', updated_at_ms = 1791032562000 WHERE slug = 'kettlebell-halo';
UPDATE exercises SET alternatives_json = '{"substitutions": ["chin-up", "inverted-row-table", "band-row-seated", "dead-hang", "scapular-retraction-hang"]}', updated_at_ms = 1791032562000 WHERE slug = 'pull-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["scapular-retraction-hang", "pull-up", "foam-roll-lats"]}', updated_at_ms = 1791032562000 WHERE slug = 'dead-hang';
UPDATE exercises SET alternatives_json = '{"substitutions": ["v-up", "dead-bug", "modified-plank", "hanging-leg-raise", "bear-crawl"]}', updated_at_ms = 1791032562000 WHERE slug = 'hollow-body-hold';
UPDATE exercises SET alternatives_json = '{"substitutions": ["hollow-body-hold", "hanging-leg-raise", "dead-bug", "bicycle-crunch"]}', updated_at_ms = 1791032562000 WHERE slug = 'v-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["pull-up", "band-row-seated", "dumbbell-bent-over-row", "chin-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'inverted-row-table';
UPDATE exercises SET alternatives_json = '{"substitutions": ["jump-squat", "sumo-squat", "supported-wall-squat", "back-squat", "front-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["reverse-lunge", "walking-lunge", "lateral-lunge", "scissor-jump"]}', updated_at_ms = 1791032562000 WHERE slug = 'lunge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dead-bug", "standing-bicycle", "v-up", "sit-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'bicycle-crunch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["push-up", "incline-push-up", "knee-push-up", "plyometric-push-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'hand-release-push-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["back-squat", "squat", "dumbbell-goblet-squat", "goblet-squat"]}', updated_at_ms = 1791032562000 WHERE slug = 'front-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["forward-lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'split-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["forward-lunge"]}', updated_at_ms = 1791032562000 WHERE slug = 'step-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-row"]}', updated_at_ms = 1791032562000 WHERE slug = 'band-bent-over-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-row"]}', updated_at_ms = 1791032562000 WHERE slug = 'doorway-isometric-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["bent-knee-sit-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'reverse-crunch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["bent-knee-sit-up", "anchored-sit-up", "bicycle-crunch", "weighted-sit-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'sit-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["sit-up", "bent-knee-sit-up", "weighted-sit-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'anchored-sit-up';
UPDATE exercises SET alternatives_json = '{"substitutions": ["sit-up", "reverse-crunch", "anchored-sit-up"]}', updated_at_ms = 1791032562000 WHERE slug = 'bent-knee-sit-up';
