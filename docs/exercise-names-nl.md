# JustFit — Nederlandse oefeningnamen (voorstel)

Review table for the Dutch exercise names of all 480 active global exercises (`is_active = 1 AND gym_id IS NULL`) in `migrations/baseline/1020_seed_exercises.sql`. Generated from `exercise-names-nl.json`, so the two cannot disagree.

**Conventions**

- Training science terms stay English where Dutch gyms use them (Plank, Burpee, Dead bug, Deadlift, Kettlebell swing, Zone 2, curl, fly, press, row, pulldown). Dutch where Dutch is what people say: Opdrukken, Optrekken, Uitvalspas, Heupbrug, Kuitheffen, Opstap, Muurzit, Berenkruip, Kindhouding, Kat-koe, Roeien (rowing machine), Hardlopen, Wandelen, Fietsen, Foamrollen, ademhaling.
- Dutch capitalisation: first word capitalised, rest lower-case except proper nouns (Arnold, Romanian, Bulgarian, Turkish, Pallof, Cooper, IT-band, HIIT).
- Qualifiers follow the base name ("Opdrukken op de knieën", "Hamstring stretch zittend", "… met weerstandsband") so variants sort together in the picker.
- Max 40 characters; every name unique (case-insensitive). Near-identical exercises are told apart by equipment or variant in parentheses.
- Military imports that were already Dutch are kept; the march names ("Marsen (5,5 km/u) - 10 minuten (rugzak 35 kg)") were over 40 characters and are shortened to "Rugzakmars 5,5 km/u · 10 min (35 kg)". "Til/draagtest: Gewicht plaatsen naar heupen" is shortened the same way.
- `note`: **kept English** = same words as the English name (only capitalisation/punctuation differs), **translated** = Dutch wording, **already Dutch** = the source name was Dutch.

## Kracht (197)

| slug | English | Dutch (proposed) | note |
|---|---|---|---|
| `air-squat` | Air Squat | Squat zonder gewicht | translated |
| `anchored-sit-up` | Anchored Sit-Up | Sit-up met voeten vast | translated |
| `assisted-pull-up-band` | Band-Assisted Pull-Up | Optrekken met weerstandsband | translated |
| `assisted-pull-up-machine` | Assisted Pull-Up (Machine) | Optrekken ondersteund (machine) | translated |
| `back-squat` | Back Squat | Back squat | kept English |
| `band-bent-over-row` | Band Bent-Over Row | Bent-over row met weerstandsband | translated |
| `band-bicep-curl` | Resistance Band Bicep Curl | Biceps curl met weerstandsband | translated |
| `band-dead-bug` | Band Dead Bug | Dead bug met weerstandsband | translated |
| `band-face-pull` | Resistance Band Face Pull | Face pull met weerstandsband | translated |
| `band-hip-abduction-standing` | Band Standing Hip Abduction | Heupabductie staand met weerstandsband | translated |
| `band-lat-pulldown` | Band Lat Pulldown | Lat pulldown met weerstandsband | translated |
| `band-lateral-walk` | Resistance Band Lateral Walk | Zijwaarts lopen met weerstandsband | translated |
| `band-overhead-press` | Resistance Band Overhead Press | Overhead press met weerstandsband | translated |
| `band-pallof-press` | Band Pallof Press | Pallof press met weerstandsband | translated |
| `band-pull-apart` | Resistance Band Pull-Apart | Pull-apart met weerstandsband | translated |
| `band-row-seated` | Resistance Band Seated Row | Zittende row met band (voet of anker) | translated |
| `band-seated-row` | Band Seated Row | Zittende row met weerstandsband | translated |
| `band-single-arm-row` | Band Single-Arm Row | Eenarmige row met weerstandsband | translated |
| `band-squat` | Resistance Band Squat | Squat met weerstandsband | translated |
| `band-wood-chop` | Band Wood Chop | Wood chop met weerstandsband | translated |
| `barbell-back-squat` | Barbell Back Squat | Barbell back squat | kept English |
| `barbell-bench-press` | Barbell Bench Press | Barbell bankdrukken | translated |
| `barbell-bent-over-row` | Barbell Bent-Over Row | Barbell bent-over row | kept English |
| `barbell-calf-raise` | Barbell Calf Raise | Barbell kuitheffen | translated |
| `barbell-deadlift` | Barbell Deadlift | Barbell deadlift | kept English |
| `barbell-front-squat` | Barbell Front Squat | Barbell front squat | kept English |
| `barbell-good-morning` | Barbell Good Morning | Barbell good morning | kept English |
| `barbell-hip-thrust` | Barbell Hip Thrust | Barbell hip thrust | kept English |
| `barbell-overhead-press` | Barbell Overhead Press | Barbell overhead press | kept English |
| `barbell-reverse-lunge` | Barbell Reverse Lunge | Barbell achterwaartse uitvalspas | translated |
| `barbell-romanian-deadlift` | Barbell Romanian Deadlift | Barbell Romanian deadlift | kept English |
| `bear-crawl` | Bear Crawl | Berenkruip | translated |
| `bear-crawl-hold` | Bear Crawl Hold | Berenkruip houden | translated |
| `bench-hip-thrust-bodyweight` | Bench Hip Thrust (Bodyweight) | Hip thrust op bank zonder gewicht | translated |
| `bench-step-up` | Bench Step-Up | Opstap op bank | translated |
| `bent-knee-calf-raise` | Bent-Knee Calf Raise | Kuitheffen met gebogen knie | translated |
| `bent-knee-sit-up` | Bent-Knee Sit-Up | Sit-up met gebogen knieën | translated |
| `bicycle-crunch` | Bicycle Crunch | Bicycle crunch | kept English |
| `bird-dog` | Bird Dog | Bird dog | kept English |
| `cable-biceps-curl` | Cable Biceps Curl | Kabel biceps curl | translated |
| `cable-pallof-press` | Cable Pallof Press | Kabel Pallof press | translated |
| `cable-triceps-pushdown` | Cable Triceps Pushdown | Kabel triceps pushdown | translated |
| `cable-woodchop` | Cable Woodchop | Kabel wood chop | translated |
| `calf-raise` | Calf Raise | Kuitheffen | translated |
| `chest-press-machine` | Chest Press (Machine) | Chest press (machine) | kept English |
| `chin-up` | Chin-Up | Optrekken onderhands (chin-up) | translated |
| `clean-pull` | Clean Pull | Clean pull | kept English |
| `cobra-press-up` | Cobra Press-up | Cobra | translated |
| `copenhagen-plank` | Copenhagen Plank | Copenhagen plank | kept English |
| `counter-movement-jump` | Counter Movement Jump | Countermovement jump | kept English |
| `curtsy-lunge` | Curtsy Lunge | Kruislingse uitvalspas (curtsy) | translated |
| `dead-bug` | Dead Bug | Dead bug | kept English |
| `dead-hang` | Dead Hang | Dead hang | kept English |
| `deadlift` | Deadlift | Deadlift | kept English |
| `diamond-push-up` | Diamond Push-up | Opdrukken diamant | translated |
| `dip-station-dip` | Dip (Parallel Bars) | Dip aan de brug | translated |
| `donkey-kick` | Donkey Kick | Donkey kick | kept English |
| `doorway-isometric-row` | Doorway Isometric Row | Isometrische row in deuropening | translated |
| `dumbbell-arnold-press` | Dumbbell Arnold Press | Dumbbell Arnold press | kept English |
| `dumbbell-bent-over-row` | Dumbbell Bent-Over Row | Dumbbell bent-over row | kept English |
| `dumbbell-bicep-curl` | Dumbbell Bicep Curl | Dumbbell biceps curl | translated |
| `dumbbell-bulgarian-split-squat` | Dumbbell Bulgarian Split Squat | Dumbbell Bulgarian split squat | kept English |
| `dumbbell-calf-raise` | Dumbbell Calf Raise | Dumbbell kuitheffen | translated |
| `dumbbell-chest-press-floor` | Dumbbell Floor Chest Press | Dumbbell chest press op de vloer | translated |
| `dumbbell-concentration-curl` | Dumbbell Concentration Curl | Dumbbell concentratie curl | translated |
| `dumbbell-deadlift` | Dumbbell Deadlift | Dumbbell deadlift | kept English |
| `dumbbell-farmers-walk` | Dumbbell Farmers Walk | Dumbbell farmer's walk | kept English |
| `dumbbell-floor-chest-fly` | Dumbbell Floor Chest Fly | Dumbbell chest fly op de vloer | translated |
| `dumbbell-floor-press` | Dumbbell Floor Press | Dumbbell floor press | kept English |
| `dumbbell-front-raise` | Dumbbell Front Raise | Dumbbell voorwaarts heffen | translated |
| `dumbbell-goblet-squat` | Dumbbell Goblet Squat | Dumbbell goblet squat | kept English |
| `dumbbell-hammer-curl` | Dumbbell Hammer Curl | Dumbbell hammer curl | kept English |
| `dumbbell-hip-thrust` | Dumbbell Hip Thrust | Dumbbell hip thrust | kept English |
| `dumbbell-incline-chest-press` | Dumbbell Incline Chest Press | Dumbbell chest press op schuine bank | translated |
| `dumbbell-lateral-raise` | Dumbbell Lateral Raise | Dumbbell zijwaarts heffen | translated |
| `dumbbell-lunge` | Dumbbell Lunge | Dumbbell uitvalspas | translated |
| `dumbbell-overhead-tricep-ext` | Dumbbell Overhead Tricep Extension | Dumbbell triceps extensie boven hoofd | translated |
| `dumbbell-rear-delt-fly` | Dumbbell Rear Delt Fly | Dumbbell rear delt fly | kept English |
| `dumbbell-renegade-row` | Dumbbell Renegade Row | Dumbbell renegade row | kept English |
| `dumbbell-reverse-curl` | Dumbbell Reverse Curl | Dumbbell reverse curl | kept English |
| `dumbbell-romanian-deadlift` | Dumbbell Romanian Deadlift | Dumbbell Romanian deadlift | kept English |
| `dumbbell-row` | Dumbbell Row | Dumbbell row (twee armen) | translated |
| `dumbbell-seated-overhead-press` | Dumbbell Seated Overhead Press | Dumbbell schouderpress zittend | translated |
| `dumbbell-shoulder-press` | Dumbbell Shoulder Press | Dumbbell schouderpress | translated |
| `dumbbell-shrug` | Dumbbell Shrug | Dumbbell shrug | kept English |
| `dumbbell-side-lunge` | Dumbbell Lateral Lunge | Dumbbell zijwaartse uitvalspas | translated |
| `dumbbell-single-arm-row` | Dumbbell Single-Arm Row | Dumbbell row eenarmig | translated |
| `dumbbell-single-leg-rdl` | Dumbbell Single-Leg Romanian Deadlift | Dumbbell Romanian deadlift op één been | translated |
| `dumbbell-suitcase-carry` | Dumbbell Suitcase Carry | Dumbbell suitcase carry | kept English |
| `dumbbell-sumo-deadlift` | Dumbbell Sumo Deadlift | Dumbbell sumo deadlift | kept English |
| `dumbbell-tricep-kickback` | Dumbbell Tricep Kickback | Dumbbell triceps kickback | translated |
| `dumbbell-upright-row` | Dumbbell Upright Row | Dumbbell upright row | kept English |
| `dumbbell-wood-chop` | Dumbbell Wood Chop | Dumbbell wood chop | kept English |
| `eccentric-calf-raise-step` | Eccentric Calf Raise (Step) | Kuitheffen excentrisch (trede) | translated |
| `ez-bar-biceps-curl` | EZ-Bar Biceps Curl | EZ-bar biceps curl | kept English |
| `fire-hydrant` | Fire Hydrant | Fire hydrant | kept English |
| `flutter-kicks` | Flutter Kicks | Flutter kicks | kept English |
| `forward-lunge` | Forward Lunge | Voorwaartse uitvalspas | translated |
| `front-squat` | Front Squat | Front squat | kept English |
| `glute-bridge` | Glute Bridge | Heupbrug | translated |
| `goblet-squat` | Goblet Squat | Goblet squat | kept English |
| `good-morning-bodyweight` | Good Morning | Good morning | kept English |
| `hand-release-push-up` | Hand Release Push-Up | Opdrukken met handen los | translated |
| `hanging-knee-raise` | Hanging Knee Raise | Hangend knieheffen | translated |
| `hanging-leg-raise` | Hanging Leg Raise | Hangend beenheffen | translated |
| `heel-walk` | Heel Walk | Lopen op de hakken | translated |
| `heup-brug` | Heup brug | Heupbrug (militair) | already Dutch |
| `high-pull` | High Pull | High pull | kept English |
| `hollow-body-hold` | Hollow Body Hold | Hollow hold | translated |
| `incline-push-up` | Incline Push-up | Opdrukken verhoogd | translated |
| `inverted-row-feet-elevated` | Inverted Row (Feet Elevated) | Inverted row voeten verhoogd | translated |
| `inverted-row-table` | Inverted Row (Under Table) | Inverted row onder tafel | translated |
| `kettlebell-clean` | Kettlebell Clean | Kettlebell clean | kept English |
| `kettlebell-clean-and-press` | Kettlebell Clean & Press | Kettlebell clean & press | kept English |
| `kettlebell-deadlift` | Kettlebell Deadlift | Kettlebell deadlift | kept English |
| `kettlebell-farmers-carry` | Kettlebell Farmer's Carry | Kettlebell farmer's carry | kept English |
| `kettlebell-front-rack-squat` | Kettlebell Front Rack Squat | Kettlebell front rack squat | kept English |
| `kettlebell-goblet-squat` | Kettlebell Goblet Squat | Kettlebell goblet squat | kept English |
| `kettlebell-halo` | Kettlebell Halo | Kettlebell halo | kept English |
| `kettlebell-high-pull` | Kettlebell High Pull | Kettlebell high pull | kept English |
| `kettlebell-row` | Kettlebell Row | Kettlebell row | kept English |
| `kettlebell-single-arm-press` | Kettlebell Single-Arm Press | Kettlebell press eenarmig | translated |
| `kettlebell-single-leg-rdl` | Kettlebell Single-Leg RDL | Kettlebell RDL op één been | translated |
| `kettlebell-snatch` | Kettlebell Snatch | Kettlebell snatch | kept English |
| `kettlebell-strict-press` | Kettlebell Strict Press | Kettlebell strict press | kept English |
| `kettlebell-swing` | Kettlebell Swing | Kettlebell swing | kept English |
| `kettlebell-turkish-get-up` | Kettlebell Turkish Get-Up | Kettlebell Turkish get-up | kept English |
| `kettlebell-windmill` | Kettlebell Windmill | Kettlebell windmill | kept English |
| `knee-push-up` | Knee Push-up | Opdrukken op de knieën | translated |
| `lat-pulldown` | Lat Pulldown | Lat pulldown | kept English |
| `lateral-lunge` | Lateral Lunge | Zijwaartse uitvalspas | translated |
| `leg-curl-machine` | Leg Curl (Machine) | Leg curl (machine) | kept English |
| `leg-extension-machine` | Leg Extension (Machine) | Leg extension (machine) | kept English |
| `leg-press` | Leg Press | Leg press | kept English |
| `lunge` | Lunge | Uitvalspas | translated |
| `machine-calf-press` | Calf Press (Machine) | Kuitpress (machine) | translated |
| `machine-hack-squat` | Hack Squat (Machine) | Hack squat (machine) | kept English |
| `machine-shoulder-press` | Shoulder Press (Machine) | Schouderpress (machine) | translated |
| `mat-hip-bridge-march` | Hip Bridge March | Heupbrug met marsbeweging | translated |
| `mat-prone-swimmer` | Prone Swimmer | Zwemmer op de buik | translated |
| `modified-plank` | Modified Plank (Knees) | Plank op de knieën | translated |
| `negative-pull-up` | Negative Pull-Up | Negatief optrekken | translated |
| `nordic-hamstring-curl` | Nordic Hamstring Curl | Nordic hamstring curl | kept English |
| `optillen-vanaf-de-grond` | Optillen vanaf de grond | Optillen vanaf de grond | already Dutch |
| `optillen-vanaf-de-grond-rugzak` | Optillen vanaf de grond (rugzak) | Optillen vanaf de grond (rugzak) | already Dutch |
| `pec-deck-fly` | Pec Deck Fly | Pec deck fly | kept English |
| `pike-push-up` | Pike Push-up | Opdrukken pike | translated |
| `pistol-squat-assist` | Assisted Pistol Squat | Pistol squat ondersteund | translated |
| `plank` | Plank | Plank | kept English |
| `plank-pull-through` | Plank Pull-Through | Plank pull-through | kept English |
| `plank-shoulder-tap` | Plank Shoulder Tap | Plank shoulder tap | kept English |
| `plyo-push-up` | Plyo Push Up | Opdrukken explosief (plyo) | translated |
| `plyometric-push-up` | Plyometric Push-Up | Opdrukken plyometrisch | translated |
| `pull-up` | Pull-Up | Optrekken | translated |
| `push-up` | Push-up | Opdrukken | translated |
| `reverse-crunch` | Reverse Crunch | Reverse crunch | kept English |
| `reverse-lunge` | Reverse Lunge | Achterwaartse uitvalspas | translated |
| `reverse-plank` | Reverse Plank | Omgekeerde plank | translated |
| `scapular-pull-up` | Scapular Pull-Up | Scapula pull-up | translated |
| `scapular-retraction-hang` | Scapular Pull (Bar Hang) | Scapula-activatie in hang | translated |
| `scissor-jump` | Scissor Jump | Schaarsprong | translated |
| `seated-cable-row` | Seated Cable Row | Kabel row zittend | translated |
| `seated-calf-raise` | Seated Calf Raise (Soleus) | Kuitheffen zittend (soleus) | translated |
| `shoulder-tap` | Shoulder tap | Shoulder tap | kept English |
| `side-plank` | Side Plank | Side plank | kept English |
| `side-plank-hip-dip` | Side Plank Hip Dip | Side plank met heupdip | translated |
| `single-leg-calf-raise` | Single Leg Calf Raise | Kuitheffen op één been | translated |
| `single-leg-deadlift` | Single-Leg Deadlift | Deadlift op één been | translated |
| `sit-up` | Sit-Up | Sit-up | kept English |
| `soleus-wall-sit` | Soleus Wall Sit | Soleus muurzit | translated |
| `sphinx-hold` | Sphinx Hold | Sfinx houden | translated |
| `split-squat` | Split Squat | Split squat | kept English |
| `squat` | Squat | Squat | kept English |
| `squat-calf-raise` | Squat Calf Raise | Squat met kuitheffen | translated |
| `squat-jump` | Squat Jump | Squat jump | kept English |
| `stability-ball-dead-bug` | Stability Ball Dead Bug | Dead bug met fitnessbal | translated |
| `stability-ball-hamstring-curl` | Stability Ball Hamstring Curl | Hamstring curl met fitnessbal | translated |
| `stability-ball-plank` | Stability Ball Plank | Plank op fitnessbal | translated |
| `stability-ball-stir-the-pot` | Stability Ball Stir the Pot | Stir the pot op fitnessbal | translated |
| `standing-hip-abduction` | Standing Hip Abduction | Heupabductie staand | translated |
| `step-up` | Step up | Opstap | translated |
| `straight-arm-pulldown` | Straight-Arm Pulldown | Straight-arm pulldown | kept English |
| `suitcase-carry` | Suitcase Carry | Suitcase carry | kept English |
| `sumo-squat` | Sumo Squat | Sumo squat | kept English |
| `superman-hold` | Superman Hold | Superman houden | translated |
| `tibialis-raise` | Tibialis Raise | Tibialis heffen | translated |
| `toe-walk` | Toe Walk | Lopen op de tenen | translated |
| `towel-door-row` | Towel Row (Door) | Row met handdoek aan deur | translated |
| `tricep-chair-dip` | Tricep Chair Dip | Triceps dip op stoel | translated |
| `v-up` | V-Up | V-up | kept English |
| `voorwaartse-plank` | Voorwaartse plank | Voorwaartse plank | already Dutch |
| `walking-lunges` | Walking Lunges | Wandelende uitvalspassen | translated |
| `wall-push-up` | Wall Push-up | Opdrukken tegen de muur | translated |
| `wall-sit` | Wall Sit | Muurzit | translated |
| `weighted-sit-up` | Weighted Sit-Up | Sit-up met gewicht | translated |
| `wissel-sprongen` | Wissel sprongen | Wisselsprongen | already Dutch |
| `zijwaartse-plank` | Zijwaartse plank | Zijwaartse plank | already Dutch |

## Cardio (171)

| slug | English | Dutch (proposed) | note |
|---|---|---|---|
| `12-minute-cooper-test` | 12-Minute Cooper Test | Cooper test (12 min) | translated |
| `12-minuten-loop` | 12 minuten loop (Cooper test) | 12 minuten loop (Cooper test) | already Dutch |
| `alternating-front-kick` | Alternating Front Kick | Afwisselende voorwaartse trap | translated |
| `box-step-up` | Step Up | Opstap op stoel | translated |
| `boxing-combination` | Boxing Combination | Bokscombinatie | translated |
| `brisk-walk` | Brisk Walking | Stevig wandelen | translated |
| `broad-jump` | Broad Jump | Verspringen uit stand | translated |
| `burpee` | Burpee | Burpee | kept English |
| `cooldown-walk` | Cool-down Walk | Uitwandelen (cooling-down) | translated |
| `cross-country-ski-step` | Cross-Country Ski Step | Langlaufpas | translated |
| `cycling-hill-climb` | Cycling Hill Climb Effort | Fietsen heuvelklim | translated |
| `cycling-intervals-indoor` | Cycling Intervals (Indoor) | Fietsen intervallen (binnen) | translated |
| `cycling-outdoor-easy` | Easy Outdoor Ride | Fietsen rustig (buiten) | translated |
| `cycling-pyramid-effort` | Cycling Pyramid Intervals | Fietsen piramide-intervallen | translated |
| `cycling-sprint-intervals` | Cycling Sprint Intervals | Fietsen sprintintervallen | translated |
| `cycling-sweet-spot` | Cycling Sweet Spot Training | Fietsen sweet spot | translated |
| `cycling-tempo-effort` | Cycling Tempo Effort | Fietsen tempo | translated |
| `cycling-zone2-ride` | Zone 2 Cycling Ride | Fietsen zone 2 | translated |
| `easy-jog-warmup` | Easy Jog Warm-up | Rustig inlopen | translated |
| `easy-run-outdoor` | Easy Run (Outdoor) | Hardlopen rustig (buiten) | translated |
| `fartlek-run` | Fartlek Run | Hardlopen fartlek | translated |
| `grapevine-step` | Grapevine Step | Grapevine | translated |
| `hardlopen-zone-1-10-minuten` | Hardlopen zone 1 - 10 minuten | Hardlopen zone 1 - 10 minuten | already Dutch |
| `hardlopen-zone-1-1x5-minuten` | Hardlopen zone 1 - 1x5 minuten | Hardlopen zone 1 - 1x5 minuten | already Dutch |
| `hardlopen-zone-1-2200-meter` | Hardlopen zone 1 - 2200 meter | Hardlopen zone 1 - 2200 meter | already Dutch |
| `hardlopen-zone-1-2700-meter` | Hardlopen zone 1 - 2700 meter | Hardlopen zone 1 - 2700 meter | already Dutch |
| `hardlopen-zone-1-5-minuten-warmup` | Hardlopen zone 1 - 5 minuten (inlopen) | Hardlopen zone 1 - 5 minuten (inlopen) | already Dutch |
| `hardlopen-zone-1-7-minuten` | Hardlopen zone 1 - 7 minuten | Hardlopen zone 1 - 7 minuten | already Dutch |
| `hardlopen-zone-2-10-minuten` | Hardlopen zone 2 - 10 minuten | Hardlopen zone 2 - 10 minuten | already Dutch |
| `hardlopen-zone-2-12-minuten` | Hardlopen zone 2 - 12 minuten | Hardlopen zone 2 - 12 minuten | already Dutch |
| `hardlopen-zone-2-2700-meter` | Hardlopen zone 2 - 2700 meter | Hardlopen zone 2 - 2700 meter | already Dutch |
| `hardlopen-zone-2-2x10-minuten` | Hardlopen zone 2 - 2x10 minuten | Hardlopen zone 2 - 2x10 minuten | already Dutch |
| `hardlopen-zone-2-2x8-minuten` | Hardlopen zone 2 - 2x8 minuten | Hardlopen zone 2 - 2x8 minuten | already Dutch |
| `hardlopen-zone-2-30-minuten` | Hardlopen zone 2 - 30 minuten | Hardlopen zone 2 - 30 minuten | already Dutch |
| `hardlopen-zone-2-35-minuten` | Hardlopen zone 2 - 35 minuten | Hardlopen zone 2 - 35 minuten | already Dutch |
| `hardlopen-zone-2-3x2-minuten` | Hardlopen zone 2 - 3x2 minuten | Hardlopen zone 2 - 3x2 minuten | already Dutch |
| `hardlopen-zone-2-40-minuten` | Hardlopen zone 2 - 40 minuten | Hardlopen zone 2 - 40 minuten | already Dutch |
| `hardlopen-zone-2-45-minuten` | Hardlopen zone 2 - 45 minuten | Hardlopen zone 2 - 45 minuten | already Dutch |
| `hardlopen-zone-2-50-minuten` | Hardlopen zone 2 - 50 minuten | Hardlopen zone 2 - 50 minuten | already Dutch |
| `hardlopen-zone-2-5x1-5-minuten` | Hardlopen zone 2 - 5x1.5 minuten | Hardlopen zone 2 - 5x1.5 minuten | already Dutch |
| `hardlopen-zone-2-6-minuten` | Hardlopen zone 2 - 6 minuten | Hardlopen zone 2 - 6 minuten | already Dutch |
| `hardlopen-zone-2-8-minuten` | Hardlopen zone 2 - 8 minuten | Hardlopen zone 2 - 8 minuten | already Dutch |
| `hardlopen-zone-3-12-minuten` | Hardlopen zone 3 - 12 minuten | Hardlopen zone 3 - 12 minuten | already Dutch |
| `hardlopen-zone-3-1x2-minuten` | Hardlopen zone 3 - 1x 2 minuten | Hardlopen zone 3 - 1x2 minuten | already Dutch |
| `hardlopen-zone-3-1x3-minuten` | Hardlopen zone 3 - 1x 3 minuten | Hardlopen zone 3 - 1x3 minuten | already Dutch |
| `hardlopen-zone-3-1x4-minuten` | Hardlopen zone 3 - 1x 4 minuten | Hardlopen zone 3 - 1x4 minuten | already Dutch |
| `hardlopen-zone-3-2-minuten` | Hardlopen zone 3 - 2 minuten | Hardlopen zone 3 - 2 minuten | already Dutch |
| `hardlopen-zone-3-2700-meter` | Hardlopen zone 3 - 2700 meter | Hardlopen zone 3 - 2700 meter | already Dutch |
| `hardlopen-zone-3-2x3-minuten` | Hardlopen zone 3 - 2x3 minuten | Hardlopen zone 3 - 2x3 minuten | already Dutch |
| `hardlopen-zone-3-2x5-minuten` | Hardlopen zone 3 - 2x 5 minuten | Hardlopen zone 3 - 2x5 minuten | already Dutch |
| `hardlopen-zone-3-2x6-minuten` | Hardlopen zone 3 - 2x 6 minuten | Hardlopen zone 3 - 2x6 minuten | already Dutch |
| `hardlopen-zone-3-3-minuten` | Hardlopen zone 3 - 3 minuten | Hardlopen zone 3 - 3 minuten | already Dutch |
| `hardlopen-zone-3-3x1-minuut` | Hardlopen zone 3 - 3x1 minuut | Hardlopen zone 3 - 3x1 minuut | already Dutch |
| `hardlopen-zone-3-3x2-minuten` | Hardlopen zone 3 - 3x2 minuten | Hardlopen zone 3 - 3x2 minuten | already Dutch |
| `hardlopen-zone-3-3x3-minuten` | Hardlopen zone 3 - 3x3 minuten | Hardlopen zone 3 - 3x3 minuten | already Dutch |
| `hardlopen-zone-3-3x6-minuten` | Hardlopen zone 3 - 3x 6 minuten | Hardlopen zone 3 - 3x6 minuten | already Dutch |
| `hardlopen-zone-3-3x8-minuten` | Hardlopen zone 3 - 3x 8 minuten | Hardlopen zone 3 - 3x8 minuten | already Dutch |
| `hardlopen-zone-3-4-minuten` | Hardlopen zone 3 - 4 minuten | Hardlopen zone 3 - 4 minuten | already Dutch |
| `hardlopen-zone-3-5-minuten` | Hardlopen zone 3 - 5 minuten | Hardlopen zone 3 - 5 minuten | already Dutch |
| `hardlopen-zone-3-8-minuten` | Hardlopen zone 3 - 8 minuten | Hardlopen zone 3 - 8 minuten | already Dutch |
| `hardlopen-zone-4-2700-meter` | Hardlopen zone 4 - 2700 meter | Hardlopen zone 4 - 2700 meter | already Dutch |
| `hardlopen-zone-4-3x2-minuten` | Hardlopen zone 4 - 3x2 minuten | Hardlopen zone 4 - 3x2 minuten | already Dutch |
| `hardlopen-zone-4-4x1-minuut` | Hardlopen zone 4 - 4x1 minuut | Hardlopen zone 4 - 4x1 minuut | already Dutch |
| `hardlopen-zone-4-4x45-seconden` | Hardlopen zone 4 - 4x45 seconden | Hardlopen zone 4 - 4x45 seconden | already Dutch |
| `hardlopen-zone-4-5x1-minuut` | Hardlopen zone 4 - 5x1 minuut | Hardlopen zone 4 - 5x1 minuut | already Dutch |
| `hardlopen-zone-4-6x1-minuten` | Hardlopen zone 4 - 6x 1 minuten | Hardlopen zone 4 - 6x1 minuten | already Dutch |
| `hardlopen-zone-5-2700-meter` | Hardlopen zone 5 - 2700 meter | Hardlopen zone 5 - 2700 meter | already Dutch |
| `hardlopen-zone-5-4x30-seconden` | Hardlopen zone 5 - 4x30 seconden | Hardlopen zone 5 - 4x30 seconden | already Dutch |
| `hardlopen-zone-5-6x30-seconden` | Hardlopen zone 5 - 6x30 seconden | Hardlopen zone 5 - 6x30 seconden | already Dutch |
| `hardlopen-zone-5-6x45-seconden` | Hardlopen zone 5 - 6x45 seconden | Hardlopen zone 5 - 6x45 seconden | already Dutch |
| `heel-dig-march` | Heel Dig March | Mars met hieltik | translated |
| `high-knees` | High Knees | Knieheffen | translated |
| `hill-repeats-running` | Hill Repeats | Hardlopen heuvelherhalingen | translated |
| `jump-rope-basic` | Jump Rope — Steady | Touwspringen constant | translated |
| `jump-rope-intervals` | Jump Rope — Intervals | Touwspringen intervallen | translated |
| `jump-rope-simulation` | Jump Rope (Simulated) | Touwspringen zonder touw | translated |
| `jump-squat` | Jump Squat | Jump squat | kept English |
| `jumping-jack` | Jumping Jack | Jumping jack | kept English |
| `jumping-jacks` | Jumping Jacks | Jumping jacks | kept English |
| `lateral-knee-raise` | Lateral Knee Raise | Knie zijwaarts heffen | translated |
| `lateral-shuffle-drill` | Lateral Shuffle Drill | Zijwaartse shuffle | translated |
| `low-impact-jumping-jacks` | Low Impact Jumping Jacks | Jumping jack zonder springen | translated |
| `march-in-place` | March in Place | Marcheren op de plaats | translated |
| `marsen-5-5-km-u-10-minuten-rugzak-35kg` | Marsen (5,5 km/u) - 10 minuten (rugzak 35 kg) | Rugzakmars 5,5 km/u · 10 min (35 kg) | already Dutch |
| `marsen-5-5-km-u-20-minuten-rugzak-25kg` | Marsen (5,5 km/u) - 20 minuten (rugzak 25 kg) | Rugzakmars 5,5 km/u · 20 min (25 kg) | already Dutch |
| `marsen-5-5-km-u-20-minuten-rugzak-35kg` | Marsen (5,5 km/u) - 20 minuten (rugzak 35 kg) | Rugzakmars 5,5 km/u · 20 min (35 kg) | already Dutch |
| `marsen-5-5-km-u-25-minuten` | Marsen (5,5 km/u) - 25 minuten | Mars 5,5 km/u · 25 min | already Dutch |
| `marsen-5-5-km-u-25-minuten-rugzak-25kg` | Marsen (5,5 km/u) - 25 minuten (rugzak 25 kg) | Rugzakmars 5,5 km/u · 25 min (25 kg) | already Dutch |
| `marsen-5-5-km-u-2x10-minuten-rugzak-25kg` | Marsen (5,5 km/u) - 2x10 minuten (rugzak 25 kg) | Rugzakmars 5,5 km/u · 2x10 min (25 kg) | already Dutch |
| `marsen-5-5-km-u-30-minuten-rugzak-25kg` | Marsen (5,5 km/u) - 30 minuten (rugzak 25 kg) | Rugzakmars 5,5 km/u · 30 min (25 kg) | already Dutch |
| `marsen-5-5-km-u-3x5-minuten-rugzak-35kg` | Marsen (5,5 km/u) - 3x5 minuten (rugzak 35 kg) | Rugzakmars 5,5 km/u · 3x5 min (35 kg) | already Dutch |
| `marsen-5-5-km-u-5-minuten-rugzak-35kg` | Marsen (5,5 km/u) - 5 minuten (rugzak 35 kg) | Rugzakmars 5,5 km/u · 5 min (35 kg) | already Dutch |
| `marsen-6-km-u-20-minuten-rugzak-10kg` | Marsen (6 km/u) - 20 minuten (rugzak 10 kg) | Rugzakmars 6 km/u · 20 min (10 kg) | already Dutch |
| `marsen-6-km-u-20-minuten-rugzak-25kg` | Marsen (6 km/u) - 20 minuten (rugzak 25 kg) | Rugzakmars 6 km/u · 20 min (25 kg) | already Dutch |
| `marsen-6-km-u-20-minuten-rugzak-35kg` | Marsen (6 km/u) - 20 minuten (rugzak 35 kg) | Rugzakmars 6 km/u · 20 min (35 kg) | already Dutch |
| `marsen-6-km-u-25-minuten-rugzak-10kg` | Marsen (6 km/u) - 25 minuten (rugzak 10 kg) | Rugzakmars 6 km/u · 25 min (10 kg) | already Dutch |
| `marsen-6-km-u-2x10-minuten-rugzak-25kg` | Marsen (6 km/u) - 2x10 minuten (rugzak 25 kg) | Rugzakmars 6 km/u · 2x10 min (25 kg) | already Dutch |
| `marsen-6-km-u-2x10-minuten-rugzak-35kg` | Marsen (6 km/u) - 2x10 minuten (rugzak 35 kg) | Rugzakmars 6 km/u · 2x10 min (35 kg) | already Dutch |
| `marsen-6-km-u-2x8-minuten-rugzak-35kg` | Marsen (6 km/u) - 2x8 minuten (rugzak 35 kg) | Rugzakmars 6 km/u · 2x8 min (35 kg) | already Dutch |
| `marsen-6-km-u-30-minuten` | Marsen (6 km/u) - 30 minuten | Mars 6 km/u · 30 min | already Dutch |
| `marsen-6-km-u-40-minuten` | Marsen (6 km/u) - 40 minuten | Mars 6 km/u · 40 min | already Dutch |
| `marsen-6-km-u-4x5-minuten-rugzak-10kg` | Marsen (6 km/u) - 4x5 minuten (rugzak 10 kg) | Rugzakmars 6 km/u · 4x5 min (10 kg) | already Dutch |
| `marsen-6-km-u-6-minuten-rugzak-45kg` | Marsen (6 km/u) - 6 minuten (rugzak 45 kg) | Rugzakmars 6 km/u · 6 min (45 kg) | already Dutch |
| `marsen-6-km-u-8-minuten-rugzak-45kg` | Marsen (6 km/u) - 8 minuten (rugzak 45 kg) | Rugzakmars 6 km/u · 8 min (45 kg) | already Dutch |
| `modified-burpee` | Modified Burpee (No Jump) | Burpee zonder sprong | translated |
| `mountain-climbers` | Mountain Climbers | Mountain climbers | kept English |
| `outdoor-bike-hiit` | Road Bike — HIIT Intervals | Fietsen HIIT (racefiets) | translated |
| `outdoor-bike-zone2` | Road Bike — Zone 2 Ride | Fietsen zone 2 (racefiets) | translated |
| `pogo-hops` | Pogo Hops | Pogosprongen | translated |
| `power-step-up-jump` | Power Step-Up (Explosive) | Explosieve opstap met sprong | translated |
| `reverse-lunge-kick` | Reverse Lunge to Front Kick | Achterwaartse uitvalspas met trap | translated |
| `rowing-2k-time-trial` | Rowing 2K Time Trial | Roeien 2 km tijdrit | translated |
| `rowing-intervals` | Rowing Intervals | Roeien intervallen | translated |
| `rowing-power-strokes` | Rowing Power Strokes | Roeien krachthalen | translated |
| `rowing-pyramid-intervals` | Rowing Pyramid Intervals | Roeien piramide-intervallen | translated |
| `rowing-steady-state` | Rowing — Steady State | Roeien constant tempo | translated |
| `rowing-technique-drill` | Rowing Technique Drill | Roeien techniekoefening | translated |
| `rowing-zone2` | Rowing Zone 2 Steady | Roeien zone 2 | translated |
| `run-continuous-level-10` | Continuous Run — 35 min | Hardlopen duurloop 35 min | translated |
| `run-continuous-level-11` | Continuous Run — 40 min | Hardlopen duurloop 40 min | translated |
| `run-continuous-level-12` | Continuous Run — 45 min | Hardlopen duurloop 45 min | translated |
| `run-continuous-level-13` | Continuous Run — 50 min | Hardlopen duurloop 50 min | translated |
| `run-continuous-level-14` | Continuous Run — 55 min | Hardlopen duurloop 55 min | translated |
| `run-continuous-level-15` | Continuous Run — 60 min | Hardlopen duurloop 60 min | translated |
| `run-continuous-level-16` | Long Run — 75 min | Hardlopen lange duurloop 75 min | translated |
| `run-continuous-level-17` | Long Run — 90 min | Hardlopen lange duurloop 90 min | translated |
| `run-continuous-level-18` | Long Run — 105 min | Hardlopen lange duurloop 105 min | translated |
| `run-continuous-level-19` | Long Run — 120 min | Hardlopen lange duurloop 120 min | translated |
| `run-continuous-level-20` | Long Run — 150 min | Hardlopen lange duurloop 150 min | translated |
| `run-continuous-level-21` | Long Run — 180 min | Hardlopen lange duurloop 180 min | translated |
| `run-continuous-level-7` | Continuous Run — 20 min | Hardlopen duurloop 20 min | translated |
| `run-continuous-level-8` | Continuous Run — 25 min | Hardlopen duurloop 25 min | translated |
| `run-continuous-level-9` | Continuous Run — 30 min | Hardlopen duurloop 30 min | translated |
| `run-interval-level-1` | Run/Walk — Gentle Start | Interval hardlopen niveau 1 | translated |
| `run-interval-level-2` | Run/Walk — 1 Min Intervals | Interval hardlopen niveau 2 | translated |
| `run-interval-level-3` | Run/Walk — Build 1 | Interval hardlopen niveau 3 | translated |
| `run-interval-level-4` | Run/Walk — Build 2 | Interval hardlopen niveau 4 | translated |
| `run-interval-level-5` | Run/Walk — Tempo Build | Interval hardlopen niveau 5 | translated |
| `run-interval-level-6` | Run/Walk — Extended Intervals | Interval hardlopen niveau 6 | translated |
| `run-intervals-outdoor` | Running Intervals (Outdoor) | Hardlopen intervallen (buiten) | translated |
| `seated-cardio-punch` | Seated Cardio Punches | Zittend stoten (cardio) | translated |
| `shadow-boxing` | Shadow Boxing | Schaduwboksen | translated |
| `shuffle-tap` | Shuffle Tap | Zijpas met tik | translated |
| `skater-hop` | Skater Hop | Schaatssprong | translated |
| `speed-bag-simulation` | Speed Bag Simulation | Speedbag-beweging (zonder zak) | translated |
| `speed-skater` | Speed Skater | Schaatssprong (snel) | translated |
| `sprint-in-place` | Sprint in Place | Sprinten op de plaats | translated |
| `squat-pulse` | Squat Pulse | Squat pulseren | translated |
| `stair-climb-simulation` | Stair Climb Simulation | Traplopen (simulatie) | translated |
| `standing-bicycle` | Standing Bicycle | Staande bicycle (knie naar elleboog) | translated |
| `standing-twist-march` | Standing Twist March | Staande mars met draai | translated |
| `static-bike-hiit` | Static Bike — HIIT Intervals | Fietsen HIIT (hometrainer) | translated |
| `static-bike-zone2` | Static Bike — Zone 2 | Fietsen zone 2 (hometrainer) | translated |
| `stationary-bike-steady` | Stationary Bike — Steady Ride | Fietsen constant (hometrainer) | translated |
| `steady-indoor-cycle` | Steady Indoor Cycling | Fietsen constant (indoorfiets) | translated |
| `step-touch` | Step Touch | Step touch | kept English |
| `stride-outs` | Stride Outs | Hardlopen versnellingen | translated |
| `tempo-run-outdoor` | Tempo Run (Outdoor) | Hardlopen tempoloop (buiten) | translated |
| `trail-hike-steady` | Trail Hike — Steady | Wandelen trail (constant tempo) | translated |
| `trail-hill-repeats` | Trail Hill Repeats | Hardlopen trail heuvelherhalingen | translated |
| `trail-run-easy` | Easy Trail Run | Hardlopen trail rustig | translated |
| `treadmill-hiit` | Treadmill — HIIT Intervals | Hardlopen loopband HIIT | translated |
| `treadmill-hill-run` | Treadmill Hill Run | Hardlopen loopband heuvel | translated |
| `treadmill-intervals` | Treadmill Speed Intervals | Hardlopen loopband snelheidsintervallen | translated |
| `treadmill-run-steady` | Treadmill Run — Steady Pace | Hardlopen loopband constant tempo | translated |
| `treadmill-zone2` | Treadmill — Zone 2 Run | Hardlopen loopband zone 2 | translated |
| `tuck-jump` | Tuck Jump | Tuck jump | kept English |
| `walking-lunge` | Walking Lunge | Wandelende uitvalspas | translated |
| `weighted-march` | Weighted March | Rugzakmars | translated |
| `wide-step-touch` | Wide Step Touch | Brede step touch | translated |
| `zone2-easy-run` | Zone 2 Easy Run | Hardlopen zone 2 rustig | translated |

## Mobiliteit (70)

| slug | English | Dutch (proposed) | note |
|---|---|---|---|
| `360-breathing` | 360 Breathing | 360 ademhaling | translated |
| `90-90-stretch` | 90-90 Stretch | Heup 90/90 stretch | translated |
| `active-thoracic-rotation` | Active Thoracic Rotation | Thoracale rotatie (actief) | translated |
| `ankle-mobility-circles` | Ankle Mobility Circles | Enkelcirkels | translated |
| `calf-stretch-wall` | Calf Stretch (Wall) | Kuitstretch tegen de muur | translated |
| `cat-cow` | Cat-Cow | Kat-koe | translated |
| `cat-cow-flow` | Cat-Cow Spinal Flow | Kat-koe met ademhaling | translated |
| `cat-cow-pregnancy` | Cat-Cow (Pregnancy-Friendly) | Kat-koe (zwangerschap) | translated |
| `chest-opener-arms` | Chest Opener | Borstopener | translated |
| `clamshell` | Clamshell | Clamshell | kept English |
| `couch-stretch` | Couch Stretch | Couch stretch | kept English |
| `cross-body-shoulder-stretch` | Cross-Body Shoulder Stretch | Schouderstretch (arm over borst) | translated |
| `deep-core-activation` | Deep Core Activation | Diepe core-activatie | translated |
| `deep-squat-hold` | Deep Squat Hold (Malasana) | Diepe squat houden (Malasana) | translated |
| `downward-dog` | Downward Dog | Neerwaartse hond | translated |
| `exhalation-core-engagement` | Exhalation Core Engagement | Core aanspannen bij uitademing | translated |
| `forearm-wrist-stretch` | Forearm & Wrist Stretch | Onderarm- en polsstretch | translated |
| `glute-piriformis-stretch` | Glute & Piriformis Stretch | Bil- en piriformisstretch | translated |
| `half-kneeling-hip-opener` | Half Kneeling Hip Opener | Heupopener halfknielend | translated |
| `heel-slides` | Heel Slides | Hielschuiven | translated |
| `hip-flexor-stretch` | Hip Flexor Stretch | Heupbuigerstretch | translated |
| `inner-thigh-squeeze` | Inner Thigh Squeeze | Binnenkant dij aanspannen | translated |
| `kegel-elevator` | Kegel Elevator | Kegel lift | translated |
| `kegel-hold` | Kegel Hold | Kegel houden | translated |
| `kegel-pulses` | Kegel Pulses | Kegel pulseren | translated |
| `leg-swings-front-back` | Active Leg Swings (Front/Back) | Beenzwaaien voor-achter (actief) | translated |
| `leg-swings-lateral` | Active Leg Swings (Side to Side) | Beenzwaaien zijwaarts (actief) | translated |
| `lunge-thoracic-rotation` | Lunge with Thoracic Rotation | Uitvalspas met thoracale rotatie | translated |
| `lying-hamstring-stretch` | Lying Hamstring Stretch | Hamstring stretch liggend | translated |
| `mat-supine-spinal-twist` | Supine Spinal Twist | Rugdraai liggend | translated |
| `neck-half-circles` | Neck Half-Circles | Nek halve cirkels | translated |
| `neck-stretch` | Neck Stretch | Nekstretch | translated |
| `ninety-ninety-hip-switch` | 90/90 Hip Switch | Heup 90/90 wissel | translated |
| `overhead-reach-stretch` | Overhead Reach Stretch | Reiken boven het hoofd (stretch) | translated |
| `pelvic-floor-breathing` | Pelvic Floor Breathing | Bekkenbodem ademhaling | translated |
| `pelvic-tilt-lying` | Pelvic Tilt (Lying) | Bekken kantelen liggend | translated |
| `pelvic-tilt-standing` | Standing Pelvic Tilt | Bekken kantelen staand | translated |
| `pigeon-pose` | Pigeon Pose | Duif | translated |
| `prone-hip-extension` | Prone Hip Extension | Heupextensie op de buik | translated |
| `run-warmup-calf-raises` | Calf Raises | Kuitheffen (hardloop-warming-up) | translated |
| `run-warmup-high-knees-march` | High Knees March | Mars met knieheffen | translated |
| `run-warmup-hip-circles` | Hip Circles | Heupcirkels (hardloop-warming-up) | translated |
| `run-warmup-leg-swings` | Leg Swings | Beenzwaaien (hardloop-warming-up) | translated |
| `seated-butterfly` | Seated Butterfly Stretch | Vlinderstretch zittend | translated |
| `seated-hamstring-stretch` | Seated Hamstring Stretch | Hamstring stretch zittend | translated |
| `seated-pelvic-roll` | Seated Pelvic Roll | Bekkencirkels zittend | translated |
| `seated-spinal-twist` | Seated Spinal Twist | Rugdraai zittend | translated |
| `seated-straddle-stretch` | Seated Straddle Stretch | Spreidzit stretch | translated |
| `seated-thoracic-rotation` | Seated Thoracic Rotation | Thoracale rotatie (zittend) | translated |
| `shoulder-circles-active` | Active Shoulder Circles | Schoudercirkels (actief) | translated |
| `shoulder-roll-stretch` | Shoulder Rolls | Schouders rollen | translated |
| `side-lying-full-stretch` | Side-Lying Full Body Stretch | Volledige stretch op de zij | translated |
| `side-lying-hip-abduction` | Side-Lying Hip Abduction | Heupabductie op de zij | translated |
| `side-lying-quad-stretch` | Side-Lying Quad Stretch | Quadriceps stretch op de zij | translated |
| `single-leg-glute-bridge` | Single Leg Glute Bridge | Heupbrug op één been | translated |
| `standing-figure-four` | Standing Figure Four | Figuur-4 stretch staand | translated |
| `standing-forward-fold` | Standing Forward Fold | Vooroverbuiging staand | translated |
| `standing-hamstring-stretch` | Standing Hamstring Stretch | Hamstring stretch staand | translated |
| `standing-pelvic-rock` | Standing Pelvic Rock | Bekken wiegen staand | translated |
| `standing-quad-stretch` | Standing Quad Stretch | Quadriceps stretch staand | translated |
| `standing-side-stretch` | Standing Side Stretch | Zijstretch staand | translated |
| `supine-figure-four` | Supine Figure-Four Stretch | Figuur-4 stretch liggend | translated |
| `supported-glute-bridge` | Supported Glute Bridge | Heupbrug ondersteund | translated |
| `supported-wall-squat` | Supported Wall Squat | Squat tegen de muur (ondersteund) | translated |
| `thoracic-extension-chair` | Thoracic Extension on Chair | Thoracale extensie op stoel | translated |
| `thread-the-needle` | Thread the Needle | Draad door de naald | translated |
| `wall-chest-stretch` | Wall Chest Stretch | Borststretch tegen de muur | translated |
| `warrior-i-pose` | Warrior I | Krijger I | translated |
| `world-greatest-stretch` | World's Greatest Stretch | World's greatest stretch | kept English |
| `wrist-flexor-stretch` | Wrist Flexor Stretch | Polsbuigerstretch | translated |

## Herstel (38)

| slug | English | Dutch (proposed) | note |
|---|---|---|---|
| `478-breathing` | 4-7-8 Breathing | 4-7-8 ademhaling | translated |
| `5-senses-grounding` | 5 Senses Grounding | Gronding met 5 zintuigen | translated |
| `alternate-nostril-breathing` | Alternate Nostril Breathing | Wisselende neusgatademhaling | translated |
| `ankle-pumps` | Ankle Pumps | Enkelpompen | translated |
| `body-scan-meditation` | Body Scan | Bodyscan | kept English |
| `box-breathing` | Box Breathing | Box-ademhaling | translated |
| `breath-counting` | Breath Counting | Ademhalingen tellen | translated |
| `childs-pose` | Child's Pose | Kindhouding | translated |
| `cooling-breath` | Cooling Breath (Sitali) | Verkoelende ademhaling (Sitali) | translated |
| `cooling-down` | Cooling-down | Cooling-down | already Dutch |
| `eye-palming` | Eye Palming | Ogen palmen | translated |
| `foam-roll-calves` | Foam Roll: Calves | Foamrollen kuiten | translated |
| `foam-roll-glutes` | Foam Roll: Glutes | Foamrollen billen | translated |
| `foam-roll-hamstrings` | Foam Roll: Hamstrings | Foamrollen hamstrings | translated |
| `foam-roll-hip-flexors` | Foam Roll: Hip Flexors | Foamrollen heupbuigers | translated |
| `foam-roll-it-band` | Foam Roll: IT Band | Foamrollen IT-band | translated |
| `foam-roll-lats` | Foam Roll: Lats | Foamrollen lats | translated |
| `foam-roll-quads` | Foam Roll: Quads | Foamrollen quadriceps | translated |
| `foam-roll-upper-back` | Foam Roll: Upper Back | Foamrollen bovenrug | translated |
| `gentle-hip-circles` | Gentle Hip Circles | Heupcirkels rustig | translated |
| `gratitude-reflection` | Gratitude Reflection | Dankbaarheidsreflectie | translated |
| `happy-baby-pose` | Happy Baby Pose | Happy baby | translated |
| `humming-bee-breath` | Humming Bee Breath | Bijenademhaling (Bhramari) | translated |
| `labour-breathing-prep` | Labour Breathing Preparation | Voorbereiding bevallingsademhaling | translated |
| `legs-up-wall` | Legs Up the Wall | Benen omhoog tegen de muur | translated |
| `mindful-body-check` | Mindful Body Check | Mindful lichaamscheck | translated |
| `neck-shoulder-self-massage` | Neck & Shoulder Self-Massage | Nek- en schouderzelfmassage | translated |
| `ocean-breath` | Ocean Breath (Ujjayi) | Oceaanademhaling (Ujjayi) | translated |
| `progressive-relaxation-body` | Progressive Muscle Relaxation | Progressieve spierontspanning | translated |
| `pursed-lip-breathing` | Pursed Lip Breathing | Ademhaling met getuite lippen | translated |
| `savasana` | Savasana (Corpse Pose) | Savasana (lijkhouding) | translated |
| `self-massage-feet` | Self-Massage: Feet | Zelfmassage voeten | translated |
| `supine-knee-to-chest` | Supine Knee-to-Chest | Knie naar borst liggend | translated |
| `supported-side-lying-rest` | Supported Side-Lying Rest | Ondersteund rusten op de zij | translated |
| `tension-release-visualization` | Tension Release | Spanning loslaten (visualisatie) | translated |
| `warming-up` | Warming-up | Warming-up | already Dutch |
| `wrist-ankle-circles` | Wrist & Ankle Circles | Pols- en enkelcirkels | translated |
| `yawn-sigh-breath` | Yawn & Sigh Breath | Geeuw- en zuchtademhaling | translated |

## Overig (4)

| slug | English | Dutch (proposed) | note |
|---|---|---|---|
| `mountain-climber` | Mountain Climber | Mountain climber | kept English |
| `graaftest` | Graaftest | Graaftest | already Dutch |
| `til-draagtest-full-exercise` | Til/draagtest: Full exercise | Til/draagtest: volledige oefening | translated |
| `til-draagtest-gewicht-plaatsen-naar-heupen` | Til/draagtest: Gewicht plaatsen naar heupen | Til/draagtest: gewicht naar heupen | already Dutch |

## Summary

| note | count |
|---|---|
| translated | 309 |
| kept English | 91 |
| already Dutch | 80 |
| **total** | **480** |
