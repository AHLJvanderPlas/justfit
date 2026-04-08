-- Migration 0017: Polarised Training
--
-- 1. Tag run-interval exercises as 'hiit'
-- 2. Tag run-continuous exercises as 'zone2'
-- 3. Replace instructions on all run exercises with pace/HR/watt targets
-- 4. Update existing cardio exercises (cycling intervals, rowing, easy run)
-- 5. Insert new exercises: treadmill zone2/HIIT, static bike zone2/HIIT,
--    outdoor bike zone2/HIIT
--
-- Polarised model: ~80% Zone 2 (HR ≤135, conversational) + ~20% HIIT (HR 160-175)
-- Running targets: Zone 2 = 6:30–8:30 min/km (7–9 km/h)
--                  HIIT   = 4:30–5:30 min/km (11–13 km/h)
-- Cycling targets: Zone 2 = 80–150W, 80–90 RPM
--                  HIIT   = 150–250W, 90–110 RPM
-- Rowing  targets: Zone 2 = 2:20–2:40 /500m, 18–20 SPM
--                  HIIT   = under 2:10 /500m, 24–28 SPM

-- ─── 1. TAG UPDATES ──────────────────────────────────────────────────────────

UPDATE exercises
SET tags_json = replace(tags_json, '"no_floor"]', '"no_floor","hiit"]'),
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug LIKE 'run-interval-level-%';

UPDATE exercises
SET tags_json = replace(tags_json, '"run_continuous"]', '"run_continuous","zone2"]'),
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug LIKE 'run-continuous-level-%';

UPDATE exercises
SET tags_json = replace(tags_json, '"high_intensity"]', '"high_intensity","hiit"]'),
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug IN ('cycling-intervals-indoor','rowing-intervals','run-intervals-outdoor');

UPDATE exercises
SET tags_json = replace(tags_json, '"outdoor"]', '"outdoor","zone2"]'),
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'easy-run-outdoor';

UPDATE exercises
SET tags_json = replace(tags_json, '"full_body"]', '"full_body","zone2"]'),
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'rowing-steady-state';

-- ─── 2. INSTRUCTIONS: RUN INTERVALS (HIIT) ───────────────────────────────────
-- Keep original step flow, append polarised HIIT cues with pace + HR targets.

UPDATE exercises
SET instructions_json = '{"steps":["Run gently for 30 seconds — think of it as a purposeful shuffle, not a sprint.","When the rest timer starts, walk briskly for 90 seconds. Keep moving and breathe steadily.","Repeat for 6 rounds. If you need to stop early, that is your body giving you the right signal."],"cues":["💡 Effort target: 70–80% max — HR should reach 140–155 bpm during each run","💡 Pace guide: 6:00–8:30 min/km (7–10 km/h). On a treadmill: 7.5 km/h is a good start","💡 Walk recovery is not optional — full recovery between efforts is what makes HIIT work","💡 This is polarised training: the run is hard, the walk is truly easy"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-1';

UPDATE exercises
SET instructions_json = '{"steps":["Run for 60 seconds at a strong, controlled effort — not a sprint, but clearly working hard.","Walk steadily for 60 seconds when the rest timer starts. Do not stop — keep your legs moving.","Complete 6 rounds. Equal time running and walking."],"cues":["💡 Effort target: 80–85% max — HR should reach 155–165 bpm during each interval","💡 Pace guide: 5:30–7:30 min/km (8–11 km/h). Treadmill: 9–10 km/h effort, 5 km/h walk","💡 Midfoot landing reduces joint stress — avoid landing heel-first","💡 If your breathing stops you from speaking at all, reduce pace by 0.5 km/h"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-2';

UPDATE exercises
SET instructions_json = '{"steps":["Run for 90 seconds at a hard, sustained effort — your breathing should be clearly laboured.","Walk for 60 seconds when the rest timer begins. Breathe deep and settle your heart rate below 130 bpm.","6 rounds total. Consistency over speed — every round at the same effort."],"cues":["💡 Effort target: 82–87% max — HR target 158–168 bpm during effort","💡 Pace guide: 5:00–7:00 min/km (8.5–12 km/h). Treadmill: 10 km/h effort, 5.5 km/h walk","💡 Relax your shoulders and hands — tension costs energy","💡 Recovery walk: HR should drop below 130 before the next effort starts"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-3';

UPDATE exercises
SET instructions_json = '{"steps":["Run for 2 minutes at a strong, sustainable pace — hard enough that speech requires effort.","Walk for 60 seconds when the rest timer starts. Drop your heart rate actively — breathe deep.","5 rounds. You are building real aerobic power now."],"cues":["💡 Effort target: 85–88% max — HR target 162–170 bpm during effort","💡 Pace guide: 5:00–6:30 min/km (9–12 km/h). Treadmill: 10–11 km/h effort, 5.5 km/h walk","💡 Short stride, quick turnover beats long slow strides for HIIT efficiency","💡 Hips forward, body upright — not hunched. Posture holds your pace."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-4';

UPDATE exercises
SET instructions_json = '{"steps":["Run for 3 minutes at a pace that challenges your breathing — speaking takes real effort but one word is possible.","Walk for 60 seconds when the rest timer starts. Heart rate should drop noticeably — aim for below 130.","5 rounds. You are building serious HIIT fitness."],"cues":["💡 Effort target: 87–90% max — HR target 165–175 bpm during effort","💡 Pace guide: 4:45–6:00 min/km (10–12.5 km/h). Treadmill: 11 km/h effort, 6 km/h walk","💡 Drive your arms forward — arm drive sets the rhythm for your legs","💡 Perceived effort: 8–9 out of 10. If it does not feel hard, push the pace."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-5';

UPDATE exercises
SET instructions_json = '{"steps":["Run for 5 minutes at a strong, controlled pace. You are approaching lactate threshold — this should feel genuinely demanding.","Walk for 60 seconds when the rest timer starts — use it actively to prepare for the next effort.","4 rounds. At this level the walks are strategic recovery, not a break."],"cues":["💡 Effort target: 88–92% max — HR target 168–178 bpm during effort","💡 Pace guide: 4:30–5:30 min/km (11–13 km/h). Treadmill: 11.5–12.5 km/h effort, 6 km/h walk","💡 5-minute efforts at this intensity build lactate threshold — this is where real fitness is made","💡 Keep form sharp even when tired — fatigue is when injury risk is highest"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-interval-level-6';

-- ─── 3. INSTRUCTIONS: RUN CONTINUOUS (ZONE 2) ────────────────────────────────
-- Full Zone 2 coaching with pace and HR targets.
-- Duration-specific step text references the exercise name (already visible to user).

UPDATE exercises
SET instructions_json = '{"steps":["Set your pace so your heart rate settles at 130 bpm — this is Zone 2, your aerobic base zone.","Target pace: 6:30–8:30 min/km (7–9 km/h). On a treadmill, start at 7.5 km/h at 1% incline and adjust. Slower is better than faster — HR governs, not pace.","If your HR rises above 135 bpm, reduce pace by 5–10 sec/km and hold there. This is not failure — it is exactly correct Zone 2 training.","Last 5 minutes: notice how stable your breathing feels. This is your aerobic engine working at its optimal intensity."],"cues":["💡 Talk test: say a full sentence out loud. If you cannot, slow down — you have left Zone 2","💡 Zone 2 builds mitochondrial density and fat-burning efficiency. Most runners go too fast on easy days.","💡 HR 130 = roughly 65–70% of max HR. Adjust target by ±5 bpm based on your age and fitness","💡 Polarised rule: this session should feel almost too easy. Save the hard effort for HIIT days."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-7';

UPDATE exercises
SET instructions_json = '{"steps":["Start at a pace where your heart rate settles at 130 bpm. For most runners this is 7–9 km/h (6:40–8:30 min/km).","Maintain this effort for the full 25 minutes. Ignore your pace — if HR climbs above 135 on a hill, shorten your stride and power-walk the top.","You should be able to hold a conversation throughout. If you cannot say 3–4 words without gasping, you are running too fast.","After the session: your easy pace will improve over weeks as your aerobic base builds."],"cues":["💡 Zone 2 HR target: 125–135 bpm throughout","💡 Treadmill: 7.5–9 km/h at 1% incline. Outdoor: let HR govern, ignore pace","💡 The aerobic engine runs on fat at this intensity — this is where your base is built","💡 Feeling slow is correct. Most runners spend too much time in the inefficient middle zone."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-8';

UPDATE exercises
SET instructions_json = '{"steps":["Settle into Zone 2 within the first 5 minutes — HR 125–135 bpm, pace that allows easy conversation.","Hold this steady state for the full 30 minutes. Adjust pace by terrain: uphill = slower stride, downhill = let it flow naturally.","Target pace: 6:30–8:30 min/km (7–9 km/h) on flat terrain. On treadmill: 8 km/h at 1% incline is a good reference.","Mental check at 20 minutes: if your breathing has changed significantly since minute 5, you are drifting into Zone 3 — slow down."],"cues":["💡 Zone 2 HR: 125–135 bpm. If a hill pushes you to 140+, walk the top.","💡 30 minutes of Zone 2 is a complete aerobic stimulus — no need to go faster","💡 Your Zone 2 pace will improve significantly over 8–12 weeks of consistent easy running","💡 Easy days easy, hard days hard. This is the foundation of polarised training."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-9';

UPDATE exercises
SET instructions_json = '{"steps":["Start at a conservative pace (HR 120–125) for the first 5 minutes, then let it settle to your Zone 2 band (125–135 bpm).","For 35 minutes of Zone 2, pacing strategy matters: start easy so the second half stays aerobic.","Target pace: 6:30–8:30 min/km (7–9 km/h) on flat terrain. Hills: reduce pace to keep HR below 135.","Last 5 minutes: check your form — relaxed shoulders, quiet foot strike, natural arm swing. This is your aerobic signature at work."],"cues":["💡 HR 130 bpm is your target. Under 125 = too easy, over 135 = too hard","💡 Treadmill reference: 8 km/h at 1% incline. Adjust by ±0.5 km/h to hit your HR zone","💡 At 35+ minutes, fuelling strategy begins to matter: hydrate before long Zone 2 runs","💡 Zone 2 at this duration significantly improves fat oxidation and running economy"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-10';

UPDATE exercises
SET instructions_json = '{"steps":["Warm up at very easy pace (HR below 120) for 5 minutes, then settle into Zone 2 (HR 125–135).","40 minutes of Zone 2 — pace target 6:30–8:30 min/km (7–9 km/h) on flat. Use HR as your only real guide.","Mid-run check (20 min): still speaking easily? Good. Still feel like you have a lot left? Good. That is Zone 2.","Cool down: last 5 minutes naturally ease off as your pace holds but effort reduces — this is training adaptation beginning."],"cues":["💡 Zone 2 HR: 125–135 bpm throughout. Treadmill: start at 8 km/h at 1% incline","💡 At 40 minutes your body is primarily running on fat as fuel — efficient and sustainable","💡 This session is worth more than a 20-minute harder effort for aerobic development","💡 If HR drifts above 135 in the second half, reduce pace by 10 sec/km — not a failure, a correction"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-11';

UPDATE exercises
SET instructions_json = '{"steps":["45 minutes of Zone 2. Treat the first 10 minutes as a warm-up within the zone (HR 120–128), then settle at 130.","Pace: 6:30–8:30 min/km (7–9 km/h) on flat. On a treadmill: 7.5–8.5 km/h at 1% incline.","Strategy: split mentally into three 15-minute blocks. Each block: settle, hold, finish. Identical HR across all three.","The last 5 minutes should feel the same as minute 10 — that is your aerobic base working."],"cues":["💡 HR 130 bpm. Talk test still valid at 40+ minutes means you stayed aerobic — well done","💡 Treadmill: 8 km/h at 1% incline is the standard Zone 2 reference for most moderate-fitness runners","💡 45 minutes of Zone 2 per session is the training volume associated with significant VO2max gains","💡 Nutrition: for runs above 40 minutes, have a small carbohydrate snack 2 hours before"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-12';

UPDATE exercises
SET instructions_json = '{"steps":["50-minute Zone 2 run. Hydrate beforehand — at this duration, starting dehydrated affects HR and performance.","Settle at HR 125–135 bpm within the first 8 minutes. Pace: 6:30–8:30 min/km (7–9 km/h) on flat terrain.","Mid-point check (25 min): HR steady? Breathing easy? If HR has crept to 140+, you drifted — reduce pace 15 sec/km.","Finish strong in terms of form, not pace. Shoulders, stride, breathing — all relaxed."],"cues":["💡 50 minutes at HR 130 is a significant aerobic training dose — more effective than 25 minutes at HR 155","💡 Treadmill: 7.5–8.5 km/h at 1% incline. Adjust by ±0.3 km/h to hold your HR band","💡 Cardiac drift is normal: HR may rise 3–5 bpm over the session with pace unchanged","💡 Zone 2 pace will improve 20–30 sec/km over a 12-week training block at this volume"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-13';

UPDATE exercises
SET instructions_json = '{"steps":["55-minute Zone 2 run. Choose a route or treadmill setting you can sustain without interruption — continuous running delivers more aerobic stimulus than stop-start.","Target: HR 125–135 bpm throughout. Pace: 6:30–8:30 min/km (7–9 km/h). On treadmill: 8 km/h at 1% incline is the reference starting point.","At 30 minutes, assess: HR stable? Stride smooth? If effort feels the same as minute 10, your aerobic base is working.","Last 10 minutes: maintain form. Quiet feet, relaxed arms, upright posture. This is where the training adaptation is earned."],"cues":["💡 HR 130 is the sweet spot — enough stimulus to build base, low enough to recover fully in 24 hours","💡 A 55-minute Zone 2 run = more aerobic gain than two 25-minute moderate-effort runs","💡 Treadmill: 1% incline corrects for the lack of air resistance — never run flat on a treadmill","💡 You should finish this run feeling like you could do another 15 minutes. That is correct."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-14';

UPDATE exercises
SET instructions_json = '{"steps":["60-minute Zone 2 run — one full hour. Hydrate properly beforehand. Carry water if temperature is above 15°C.","Settle at HR 125–135 bpm within the first 8 minutes. Pace: 6:30–8:30 min/km (7–9 km/h). Treadmill: 8 km/h at 1% incline as your starting reference.","Divide into four 15-minute blocks. Block 1: settle in. Block 2: find your rhythm. Block 3: manage fatigue. Block 4: finish with intent.","At 45 minutes, your mental game matters as much as your physical fitness. Stay present — one kilometre at a time."],"cues":["💡 60 minutes at HR 130 is one of the most effective single aerobic training sessions available","💡 Cardiac drift: HR may rise 5 bpm in the final 20 minutes with pace unchanged — this is normal","💡 An hour of Zone 2 running significantly elevates VO2max over a training cycle","💡 Eat a small carbohydrate snack (banana, oats) 2 hours before runs of this duration"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-15';

UPDATE exercises
SET instructions_json = '{"steps":["75-minute Zone 2 run. This is a serious long run — plan your route, carry water, and eat a carbohydrate snack 2 hours before.","HR target: 125–135 bpm. Pace: 6:30–8:30 min/km. On treadmill: 8 km/h at 1% incline, adjusting by ±0.5 to hold your zone.","For runs above 60 minutes, managing HR drift matters: if HR rises above 135 after 45 minutes, reduce pace — do not push through.","Last 15 minutes: check your form actively. Fatigue affects posture first — shoulders drop, stride shortens. Correct it consciously."],"cues":["💡 HR 130 × 75 minutes = maximum polarised training stimulus without significant recovery debt","💡 Fat is your primary fuel at Zone 2. Glycogen stores last 90+ minutes at this intensity — no fuelling needed for most runners","💡 Treadmill at this duration: check the fan, keep a water bottle in reach, accept that it is mentally demanding","💡 After this run, 36 hours of easy activity maximises aerobic adaptation"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-16';

UPDATE exercises
SET instructions_json = '{"steps":["90-minute Zone 2 run. Fuel and hydrate before you start — at 90 minutes, even Zone 2 depletes glycogen stores in some runners.","Hold HR 125–135 bpm throughout. Pace: 6:30–8:30 min/km. After 60 minutes, pace may need to slow 10–15 sec/km to hold the same HR — this is correct, not failure.","Mental strategy: break into three 30-minute segments. Each has its own challenge: warmup, build, hold. The final 30 minutes is where endurance is built.","Last 10 minutes: active cool down within the run — same pace, conscious relaxation of effort."],"cues":["💡 Cardiac drift at 90 minutes can add 8–10 bpm to HR at the same pace — slow down, not push through","💡 If you have running gels or blocks, one at 60 minutes helps maintain Zone 2 without bonking","💡 90 minutes at Zone 2 is the backbone of distance runner training — this is what marathon pace is built on","💡 Recovery: full rest day tomorrow, or very light mobility only"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-17';

UPDATE exercises
SET instructions_json = '{"steps":["105-minute Zone 2 run. Mandatory preparation: hydrate the day before, eat a proper carbohydrate meal, carry water or plan a water stop.","HR 125–135 bpm. Pace: 6:30–8:30 min/km. Expect your sustainable pace to drop by 15–20 sec/km versus your shorter runs — this is normal at this duration.","First 20 minutes: resist the urge to run faster than HR 130. The last 40 minutes will thank you.","From 75 minutes onward: run on your aerobic system alone. HR steady, mind focused on form."],"cues":["💡 At 1 hour 45 minutes, this is genuine long-run territory. Your pace does not matter — time on feet at Zone 2 does.","💡 Fuel at 60 minutes and 90 minutes: 25–35g of fast carbohydrate (gel, banana, dates)","💡 After this run, active recovery for 48 hours — no HIIT, no strength. Let the aerobic adaptation consolidate.","💡 This is where your aerobic engine gets built. The discomfort is the signal."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-18';

UPDATE exercises
SET instructions_json = '{"steps":["120-minute Zone 2 run. Full preparation required: hydrate 24 hours before, eat carbohydrates the morning of, carry or plan for fluids.","HR 125–135 bpm throughout. Pace will naturally be 20–25 sec/km slower than your shorter Zone 2 runs by the final 30 minutes — hold the HR, not the pace.","First 30 minutes: disciplined patience. Your legs want to run faster. Resist — you are building an aerobic engine.","Final 30 minutes: these minutes are the most valuable of the entire session. Stay present, hold form, complete the run."],"cues":["💡 2 hours at Zone 2 is the signature long run of half-marathon preparation","💡 Fuelling strategy: 30–40g carbohydrate at 45, 90 minutes. Hydrate every 20 minutes.","💡 Your fat-burning efficiency improves most dramatically from runs above 90 minutes at Zone 2","💡 Post-run: protein + carbohydrates within 30 minutes, full rest day tomorrow"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-19';

UPDATE exercises
SET instructions_json = '{"steps":["150-minute Zone 2 run. This is a significant athletic undertaking — treat it as a training event, not just a run.","HR 125–133 bpm. Expect pace to drift significantly in the second half — this is correct. Let HR govern entirely.","Nutrition required: eat 30–40g carbohydrate every 45 minutes (gel, banana, bar). Hydrate every 20 minutes.","Last 30 minutes: fatigue is real. Focus entirely on form — quiet feet, upright posture, relaxed hands. The aerobic adaptation is happening right now."],"cues":["💡 2.5 hours at Zone 2 is approaching marathon long-run territory — few non-athletes attempt this. You are building something significant.","💡 Pace at 2+ hours: 7:00–9:00 min/km is normal even for trained runners. Let go of pace ego.","💡 Cardiac drift at this duration can add 10–12 bpm — reduce pace proactively, do not wait for it to force you","💡 Recovery: 48 hours easy activity minimum. Sleep is the most important training adaptation tool."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-20';

UPDATE exercises
SET instructions_json = '{"steps":["180-minute Zone 2 run — 3 hours. This is elite-range long run volume. Prepare as you would for a race: sleep, nutrition, hydration, gear.","HR 120–130 bpm. Pace expectations: 7:00–9:00 min/km. After 90 minutes, pace will likely be slower — this is correct and expected at this duration.","Nutrition: 30–40g carbohydrate every 40 minutes from the start. Hydrate every 20 minutes. Consider electrolytes (sodium) for runs above 2 hours.","This run is not about pace, speed, or distance. It is about 3 hours of continuous aerobic work at Zone 2. The adaptation from this single session is extraordinary."],"cues":["💡 3-hour Zone 2 runs are the foundation of marathon and ultra training. You are training your body to run on fat.","💡 At 2+ hours: fat oxidation is near-maximum. Your body is learning to spare glycogen — this takes weeks to express.","💡 HR will drift. At 2.5 hours, 128–133 bpm at a walk/jog is still Zone 2 work. Do not push harder.","💡 Recovery: full rest day tomorrow, protein-focused nutrition, 9+ hours sleep if possible."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'run-continuous-level-21';

-- ─── 4. UPDATE EXISTING CARDIO EXERCISES ─────────────────────────────────────

UPDATE exercises
SET instructions_json = '{"steps":["Set treadmill to 1% incline — this compensates for the absence of air resistance and more closely matches outdoor running.","Start at 7.5 km/h and adjust until your heart rate settles at 125–135 bpm. This is Zone 2 — your aerobic base pace.","Target speed range: 7–9 km/h (6:40–8:30 min/km equivalent). Your exact Zone 2 speed depends on fitness — let HR be your only guide.","If HR exceeds 135 bpm, reduce speed by 0.3–0.5 km/h and hold there. This is not failure — it is precise Zone 2 training."],"cues":["💡 Talk test: say a full sentence without gasping. If you cannot, you have left Zone 2 — slow down","💡 1% incline is not a hill — it corrects for treadmill mechanics. Always use it for Zone 2 runs.","💡 Zone 2 on a treadmill: 7.5–8.5 km/h is the reference range for moderate-fitness runners","💡 Zone 2 builds your aerobic engine. Slower than it feels right is usually correct on easy days."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'easy-run-outdoor';

UPDATE exercises
SET instructions_json = '{"steps":["Warm up at 70–90W for 5 minutes at 80 RPM — HR should reach 110–120 bpm before the intervals begin.","Effort interval: increase resistance to your maximum sustainable output. Target 150–250W at 90–110 RPM. This should feel like 8–9 out of 10 effort — HR target 160–175 bpm.","Recovery interval: drop to 60–90W at 70–80 RPM. Let HR fall back to 120–130 bpm before the next effort begins. Full recovery makes HIIT effective.","Repeat the effort/recovery pattern. Final 5 minutes: cool down at 60–80W, 75 RPM."],"cues":["💡 Watt targets: beginners 120–160W effort / 60–80W recovery. Intermediate 160–220W / 70–90W. Advanced 200–280W+ / 80–100W.","💡 RPM during efforts: 90–110 revolutions per minute. High cadence maximises cardiovascular stimulus.","💡 HIIT on a bike is joint-friendly — you can push harder than running intervals with lower injury risk","💡 HR 165–175 bpm during effort is the target. If you cannot reach 160 bpm, increase resistance."]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'cycling-intervals-indoor';

UPDATE exercises
SET instructions_json = '{"steps":["Set resistance so you maintain 18–20 strokes per minute (SPM) at a comfortable, sustained effort.","Target split: 2:20–2:40 per 500m. This is Zone 2 rowing — HR should settle at 125–135 bpm within 5 minutes.","Hold this pace for the full session. If HR rises above 135, reduce stroke rate by 1–2 SPM or reduce drive power.","Focus on the catch-drive-finish-recovery sequence: legs first, then lean back, then arms draw to the lower chest."],"cues":["💡 Talk test applies on the rowing machine too — full sentences should be possible at Zone 2 effort","💡 Split target: 2:25–2:35 /500m is the standard Zone 2 reference for recreational rowers","💡 18–20 SPM: lower stroke rate forces longer, more powerful strokes — this builds aerobic efficiency","💡 Zone 2 rowing is full-body aerobic work: legs (60%), core (20%), arms (20%) at every stroke"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'rowing-steady-state';

UPDATE exercises
SET instructions_json = '{"steps":["Warm up with 3–5 minutes at easy pace: 24–26 SPM, split around 2:35–2:45 /500m, HR below 130.","Effort interval: drive hard for the prescribed duration. Target split: under 2:10 /500m at 24–28 SPM. This is near-maximum effort — HR target 165–175 bpm.","Recovery interval: drop to 18–20 SPM at 2:40–2:50 /500m. Let HR fall below 130 before the next effort. Active recovery — keep rowing, do not stop.","Repeat the effort/recovery pattern throughout the session."],"cues":["💡 HIIT rowing split targets: beginners under 2:20 /500m, intermediate under 2:10, advanced under 2:00","💡 SPM during efforts: 24–28 strokes per minute. Increase power, not SPM, to hit your split target","💡 The catch is where power begins: arms straight, shins vertical, weight forward — then legs drive","💡 Rowing HIIT is among the highest caloric-burn HIIT modalities — 800–1000 kcal/hr at max effort"]}',
    updated_at_ms = strftime('%s','now') * 1000
WHERE slug = 'rowing-intervals';

-- ─── 5. NEW EXERCISES ─────────────────────────────────────────────────────────

-- Treadmill — Zone 2
INSERT INTO exercises
  (id, slug, name, category,
   tags_json, equipment_required_json, equipment_advised_json,
   primary_muscles_json,
   metrics_json, instructions_json, alternatives_json,
   is_active, created_at_ms, updated_at_ms)
VALUES
(
  'c3000001-tdml-4000-8000-zone20000001',
  'treadmill-zone2',
  'Treadmill — Zone 2 Run',
  'cardio',
  '["cardio","high_impact","indoor","running","no_floor","zone2","treadmill"]',
  '["treadmill"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":1800}',
  '{"steps":["Set treadmill to 1% incline — this compensates for the absence of air resistance and more closely matches outdoor running effort.","Start at 7.5 km/h and let your HR settle over 3–5 minutes. Target zone: 125–135 bpm. Adjust speed in 0.3 km/h increments until you find your personal Zone 2 speed.","Hold your Zone 2 speed for the full session. Speed guide: beginners 7–8 km/h, intermediate 8–9.5 km/h, trained 9.5–11 km/h. HR governs — not pace.","If HR rises above 135 at any point (especially on long sessions), reduce speed by 0.3 km/h and hold. Cardiac drift over 30+ minutes is normal."],"cues":["💡 Talk test: say 5 words comfortably without gasping. If you cannot, you are above Zone 2 — reduce speed.","💡 Treadmill Zone 2 reference: 8 km/h at 1% incline suits most recreational runners (HR ~125–135)","💡 Never run flat on a treadmill for Zone 2 — 1% incline is not optional for accurate training","💡 Zone 2 pace will improve 15–25 sec/km over 8 weeks of consistent training without increasing perceived effort"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Treadmill — HIIT
(
  'c3000002-tdml-4000-8000-hiit00000002',
  'treadmill-hiit',
  'Treadmill — HIIT Intervals',
  'cardio',
  '["cardio","high_impact","indoor","running","no_floor","hiit","treadmill"]',
  '["treadmill"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes","hip_flexors"]',
  '{"supports":["time"],"base_duration_sec":1800}',
  '{"steps":["Set incline to 1%. Warm up at 6 km/h for 3 minutes — HR should reach 110–120 bpm before intervals begin.","Effort interval: increase to 11–14 km/h. Target effort: 85–90% max, HR 160–175 bpm. Beginners start at 10–11 km/h — increase over sessions.","Recovery interval: reduce to 5.5–6.5 km/h (brisk walk). Let HR drop below 130 bpm before the next effort. Full recovery is what makes HIIT work.","Repeat effort/recovery pattern. Final 3 minutes: cool down at 5.5 km/h. Never stop abruptly after hard intervals."],"cues":["💡 Speed targets: effort 11–14 km/h (4:17–5:27 min/km equivalent). Recovery 5.5–6 km/h walking pace","💡 HR during effort: 160–175 bpm. If you cannot reach 158 bpm, increase speed by 0.5 km/h","💡 Pre-programme your effort and recovery speeds before starting — transitions must be fast (under 10 seconds)","💡 HIIT treadmill: 2:1 recovery ratio (e.g. 1 min effort / 2 min walk) is standard for beginners"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Static Bike — Zone 2
(
  'c3000003-bike-4000-8000-zone20000003',
  'static-bike-zone2',
  'Static Bike — Zone 2',
  'cardio',
  '["cardio","low_impact","indoor","no_floor","zone2","cycling"]',
  '["stationary_bike"]',
  NULL,
  '["quadriceps","hamstrings","glutes","calves"]',
  '{"supports":["time"],"base_duration_sec":1800}',
  '{"steps":["Set resistance so you spin smoothly at 80–90 RPM without bouncing in the saddle. Start conservative — adjust resistance up if HR stays below 120 after 5 minutes.","Target wattage: 80–100W for beginners, 100–150W for intermediate, 150–180W for trained cyclists. Let HR be your guide: settle at 125–135 bpm.","Hold this steady state for the full session. RPM should stay in the 80–90 range — smooth, controlled pedal circles, not choppy punches.","Check HR at 10, 20, 30 minutes. It should remain within 5 bpm of your Zone 2 target. Adjust resistance by 1–2 levels if needed."],"cues":["💡 RPM 80–90 is Zone 2 cadence — spinning smoothly at moderate resistance trains aerobic efficiency","💡 Watt targets: beginners 80–100W, intermediate 100–140W, advanced 140–180W. These align with HR 125–135 for most people.","💡 Talk test: you should be able to speak full sentences throughout. The bike should feel like light work.","💡 Zone 2 cycling is low-impact but high-stimulus. 45 minutes delivers aerobic adaptation equivalent to 35 minutes of Zone 2 running."]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Static Bike — HIIT
(
  'c3000004-bike-4000-8000-hiit00000004',
  'static-bike-hiit',
  'Static Bike — HIIT Intervals',
  'cardio',
  '["cardio","low_impact","indoor","no_floor","hiit","cycling"]',
  '["stationary_bike"]',
  NULL,
  '["quadriceps","hamstrings","glutes","calves","hip_flexors"]',
  '{"supports":["time"],"base_duration_sec":1800}',
  '{"steps":["Warm up at 70–90W, 80 RPM for 5 minutes — HR should reach 110–120 before intervals.","Effort interval: increase resistance to target wattage. Beginners: 130–170W. Intermediate: 170–230W. Advanced: 230–300W+. Cadence 90–110 RPM. This should feel like 8–9 out of 10 effort — HR 165–178 bpm.","Recovery interval: drop to 60–90W at 70–80 RPM. Let HR fall to 120–130 bpm before the next effort. Do not stop pedalling.","Repeat effort/recovery. Cool down 5 minutes at 60–80W, 75 RPM."],"cues":["💡 Watt progression: beginners 130–170W effort / 60–80W recovery. Intermediate 170–230W / 70–90W. Advanced 230–300W+ / 80–100W.","💡 Cadence during efforts: 90–110 RPM. High cadence trains your cardiovascular system; high resistance trains your legs. Do both.","💡 Static bike HIIT is among the safest high-intensity cardio options — zero impact, consistent resistance.","💡 HR target during effort: 165–178 bpm. If you cannot reach 160 bpm, increase resistance by 2–3 levels."]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Outdoor / Road Bike — Zone 2
(
  'c3000005-obke-4000-8000-zone20000005',
  'outdoor-bike-zone2',
  'Road Bike — Zone 2 Ride',
  'cardio',
  '["cardio","low_impact","outdoor","no_floor","zone2","cycling"]',
  '["outdoor_bike"]',
  NULL,
  '["quadriceps","hamstrings","glutes","calves"]',
  '{"supports":["time"],"base_duration_sec":2700}',
  '{"steps":["Choose a flat-to-gently-rolling route. Settle into Zone 2 within the first 10 minutes: HR 125–135 bpm, cadence 80–90 RPM.","Speed target on flat terrain: 20–28 km/h. If you have a power meter, hold 50–65% of your FTP (Functional Threshold Power). Both are Zone 2 markers.","Climbs: shift down and maintain cadence (80–90 RPM) rather than grinding. If HR exceeds 138 bpm on climbs, accept slower speed — HR governs.","Descents: recover actively. Let HR drop back toward 120 bpm on long descents, then re-engage at Zone 2 effort on the flat."],"cues":["💡 Talk test at 25 km/h: if you cannot speak in phrases, you are above Zone 2 — ease off the power","💡 Cadence 80–90 RPM is more efficient than grinding at 60–70 RPM at the same wattage","💡 Power meter riders: Zone 2 = 55–75% FTP (e.g. if FTP is 200W, Zone 2 = 110–150W)","💡 Outdoor Zone 2: terrain variability is fine — manage HR to stay in zone across hills and flats"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Outdoor / Road Bike — HIIT
(
  'c3000006-obke-4000-8000-hiit00000006',
  'outdoor-bike-hiit',
  'Road Bike — HIIT Intervals',
  'cardio',
  '["cardio","low_impact","outdoor","no_floor","hiit","cycling"]',
  '["outdoor_bike"]',
  NULL,
  '["quadriceps","hamstrings","glutes","calves","hip_flexors"]',
  '{"supports":["time"],"base_duration_sec":2700}',
  '{"steps":["Choose a route with clear sprint sections — flat straights or consistent climbs of 2–4 minutes. Warm up at easy pace for 10 minutes (HR below 125, 80 RPM).","Effort interval: sprint at 85–95% effort. Speed target on flat: 30–45 km/h. Power meter: 85–100% of FTP. Standing sprints on climbs, seated sprints on flat. HR target: 165–178 bpm.","Recovery: easy spin at 15–22 km/h, 70–80 RPM. Let HR drop below 130 before the next effort. Do not stop pedalling during recovery.","Repeat the effort/recovery pattern throughout the session. Final 10 minutes: easy cool-down spin."],"cues":["💡 Power meter targets: effort 85–100% FTP (e.g. 170–200W for a 200W FTP). Recovery 40–55% FTP.","💡 Cadence in sprints: flat sprints 90–110 RPM. Climbing efforts 75–90 RPM. Match cadence to terrain.","💡 Outdoor HIIT: natural terrain resistance — hills and headwinds give you variable, effective overload","💡 Use full warm-up before first effort. Outdoor conditions (cold, wind) mean muscles need longer preparation."]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
);
