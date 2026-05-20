#!/usr/bin/env bash
# CF scenario automated tests — runs against live justfit.cc API
# Usage: TOKEN=<jf_token> bash scripts/run-cf-tests.sh
#
# Automated: CF-01 to CF-16, CF-21 to CF-22, CF-24 to CF-25, CF-27 to CF-29
# Skipped (needs execution flow): CF-17, CF-18, CF-27 full advancement, CF-26 (R558)
# Manual only: CF-19, CF-20

set -euo pipefail
BASE="https://justfit.cc/api"
TOKEN="${TOKEN:-}"
DATE="$(date -u +%Y-%m-%d)"
PASS=0; FAIL=0; SKIP=0

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set TOKEN=<your jf_token from localStorage>"; exit 1
fi

# Extract user_id from JWT payload (middle segment, base64-decoded)
USER_ID=$(echo "$TOKEN" | cut -d. -f2 | python3 -c "
import sys, base64, json
p = sys.stdin.read().strip()
p += '=' * (4 - len(p) % 4)
print(json.loads(base64.b64decode(p))['userId'])
")

pass() { echo "  ✓ $1"; ((++PASS)); }
fail() { echo "  ✗ $1"; ((++FAIL)); }
skip() { echo "  ~ $1 (skip)"; ((++SKIP)); }

# Extract plan from {ok,saved,plan} wrapper
p() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('plan',d)))"; }
has()           { echo "$1" | python3 -c "import sys; sys.exit(0 if '$2' in sys.stdin.read() else 1)"; }
slot()          { echo "$(p "$1")" | python3 -c "import sys,json; sys.exit(0 if json.load(sys.stdin).get('slot_type')=='$2' else 1)" 2>/dev/null || false; }
no_step_slug()  { echo "$(p "$1")" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$2' not in [s.get('exercise_slug','') for s in d.get('steps',[])] else 1)"; }
has_step_slug() { echo "$(p "$1")" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$2' in [s.get('exercise_slug','') for s in d.get('steps',[])] else 1)"; }
step_order()    { echo "$(p "$1")" | python3 -c "
import sys,json; d=json.load(sys.stdin)
slugs=[s.get('exercise_slug','') for s in d.get('steps',[])]
a,b='$2','$3'
sys.exit(0 if a in slugs and b in slugs and slugs.index(a)<slugs.index(b) else 1)
"; }
get_slot()      { echo "$(p "$1")" | python3 -c "import sys,json; print(json.load(sys.stdin).get('slot_type','?'))"; }

plan() {
  curl -s -X POST "$BASE/plan" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$2"
}

d1() {
  npx --yes wrangler d1 execute justfit-db --remote --command "$1" 2>/dev/null
}

# Deactivate military so standard-mode tests aren't polluted by the user's real military prefs
MIL_OFF='"military_coach":{"active":false}'

echo ""
echo "══════════════════════════════════════════════"
echo "  JustFit CF Automated Tests — $DATE"
echo "  User: $USER_ID"
echo "══════════════════════════════════════════════"
echo ""

# ── CF-01: General pain vs coach ─────────────────────────────────────────────
echo "CF-01  General pain vs coach"
R=$(plan CF-01 '{
  "date":"'"$DATE"'",
  "checkin":{"pain_level":3,"pain_scope":"general","energy":6,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"',"run_coach":{"enrolled":true,"target_km":10,"week":2,"session_in_week":0}}
}')
if slot "$R" rest && has "$R" "R514"; then pass "slot=rest, R514 fires"; else fail "Expected rest+R514; got slot=$(get_slot "$R")"; fi
if has "$R" "R556"; then fail "R556 should NOT fire"; else pass "R556 suppressed"; fi
echo ""

# ── CF-02: Specific pain — no forced rest ────────────────────────────────────
echo "CF-02  Specific pain — no forced rest"
R=$(plan CF-02 '{
  "date":"'"$DATE"'",
  "checkin":{"pain_level":3,"pain_scope":"specific","pain_areas":["knee"],"energy":6,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"'},
  "user_profile":{"sex":"male","weight_kg":80,"height_cm":180}
}')
if ! slot "$R" rest; then pass "slot != rest"; else fail "Should NOT be rest day"; fi
if has "$R" "R563"; then pass "R563 fires (knee filter)"; else fail "R563 missing"; fi
echo ""

# ── CF-03: Specific + chronic injury merge ───────────────────────────────────
echo "CF-03  Specific + chronic injury merge"
R=$(plan CF-03 '{
  "date":"'"$DATE"'",
  "checkin":{"pain_level":2,"pain_scope":"specific","pain_areas":["knee"],"energy":6,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"',"chronic_injury_areas":["shoulder"]}
}')
if has "$R" "R563"; then pass "R563 fires"; else fail "R563 missing"; fi
echo ""

# ── CF-04: BMI strict vs run coach ───────────────────────────────────────────
echo "CF-04  BMI strict vs run coach (BMI 36)"
R=$(plan CF-04 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":6,"sleep_hours":7},
  "user_profile":{"sex":"male","weight_kg":110,"height_cm":175},
  "coach_sim":{'"$MIL_OFF"',"run_coach":{"enrolled":true,"target_km":10,"week":2,"session_in_week":0}},
  "is_pro":true
}')
if ! has "$R" "R556"; then pass "R556 suppressed (bmiStrictForRun)"; else fail "Run coach fired despite BMI>=35"; fi
if has "$R" "R545"; then pass "R545 fires"; else fail "R545 missing — check BMI calculation"; fi
echo ""

# ── CF-05: BMI moderate + pain cofactor ──────────────────────────────────────
echo "CF-05  BMI moderate + pain cofactor (BMI 31 + pain 1)"
R=$(plan CF-05 '{
  "date":"'"$DATE"'",
  "checkin":{"pain_level":1,"pain_scope":"general","energy":6,"sleep_hours":7},
  "user_profile":{"sex":"male","weight_kg":95,"height_cm":175},
  "coach_sim":{'"$MIL_OFF"',"run_coach":{"enrolled":true,"target_km":10,"week":2,"session_in_week":0}},
  "is_pro":true
}')
if ! has "$R" "R556"; then pass "R556 suppressed"; else fail "Run coach fired despite moderate BMI+pain"; fi
echo ""

# ── CF-06: Polarised R568 ────────────────────────────────────────────────────
echo "CF-06  Polarised R568 — last HIIT, promotes Zone 2"
R=$(plan CF-06 '{
  "date":"'"$DATE"'",
  "checkin":{"sleep_hours":4,"stress":8,"energy":5},
  "coach_sim":{'"$MIL_OFF"',"sport_prefs":{"polarised_training":true},"last_session_type":"hiit"},
  "is_pro":true
}')
if has "$R" "R568"; then pass "R568 fires"; else fail "R568 missing"; fi
if has "$R" "R511"; then pass "R511 fires (low sleep)"; else fail "R511 missing"; fi
echo ""

# ── CF-07: Follicular phase boost ────────────────────────────────────────────
echo "CF-07  Follicular phase boost"
R=$(plan CF-07 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":8,"sleep_hours":8,"mood":8},
  "user_profile":{"sex":"female","weight_kg":65,"height_cm":168},
  "coach_sim":{'"$MIL_OFF"'},
  "cycle_context":{"phase":"follicular","period_today":false,"cycle_day":8}
}')
if has "$R" "R521"; then pass "R521 fires (follicular boost)"; else fail "R521 missing"; fi
echo ""

# ── CF-08/09/10: Pregnancy/postnatal — requires D1 mode change ───────────────
echo "CF-08  Cycle rules suppressed in pregnancy"
echo "CF-09  Pregnancy nausea → micro"
echo "CF-10  Postnatal clearance gate"
# Save current cycle_profile mode
CURRENT_MODE=$(d1 "SELECT mode FROM cycle_profile WHERE user_id='$USER_ID' LIMIT 1;" 2>/dev/null | python3 -c "
import sys,json
try:
  data=json.load(sys.stdin)
  print(data[0]['results'][0]['mode'])
except:
  print('standard')
" 2>/dev/null || echo "standard")
echo "  [setup] current cycle mode: $CURRENT_MODE — temporarily setting to pregnant"

d1 "INSERT OR IGNORE INTO cycle_profile (user_id, mode, tracking_mode, created_at_ms, updated_at_ms) VALUES ('$USER_ID','standard','off',0,0);
    UPDATE cycle_profile SET mode='pregnant', pregnancy_due_date='2026-11-01', pregnancy_confirmed_at_ms=1700000000000, medical_clearance_confirmed=1, updated_at_ms=$(date +%s)000 WHERE user_id='$USER_ID';" > /dev/null

# CF-08
R=$(plan CF-08 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":6,"sleep_hours":7},
  "user_profile":{"sex":"female","weight_kg":70,"height_cm":168},
  "coach_sim":{'"$MIL_OFF"'},
  "cycle_context":{"phase":"follicular","period_today":false}
}')
if has "$R" "R530"; then pass "CF-08 R530 fires (pregnancy)"; else fail "CF-08 R530 missing"; fi
if has "$R" "R521"; then fail "CF-08 R521 should NOT fire in pregnancy"; else pass "CF-08 R521 suppressed"; fi

# CF-09
R=$(plan CF-09 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":5,"sleep_hours":6,"pregnancy_signals":{"nausea":true}},
  "user_profile":{"sex":"female","weight_kg":70,"height_cm":168},
  "coach_sim":{'"$MIL_OFF"'}
}')
if slot "$R" micro; then pass "CF-09 slot=micro"; else fail "CF-09 Expected micro, got $(get_slot "$R")"; fi
if has "$R" "R535"; then pass "CF-09 R535 fires (nausea)"; else fail "CF-09 R535 missing"; fi

# Switch to postnatal for CF-10
d1 "UPDATE cycle_profile SET mode='postnatal', postnatal_birth_date='2026-01-25', postnatal_birth_type='vaginal', postnatal_cleared_for_exercise=0, updated_at_ms=$(date +%s)000 WHERE user_id='$USER_ID';" > /dev/null

R=$(plan CF-10 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":6,"sleep_hours":7},
  "user_profile":{"sex":"female","weight_kg":68,"height_cm":168},
  "coach_sim":{'"$MIL_OFF"'}
}')
if has "$R" "R539"; then pass "CF-10 R539 fires (clearance gate)"; else fail "CF-10 R539 missing"; fi

# Restore
d1 "UPDATE cycle_profile SET mode='$CURRENT_MODE', pregnancy_due_date=NULL, pregnancy_confirmed_at_ms=NULL, postnatal_birth_date=NULL, postnatal_cleared_for_exercise=0, updated_at_ms=$(date +%s)000 WHERE user_id='$USER_ID';" > /dev/null
echo "  [teardown] cycle mode restored to: $CURRENT_MODE"
echo ""

# ── CF-11: Run + cycle coach simultaneously ───────────────────────────────────
echo "CF-11  Run coach takes precedence over cycling coach"
R=$(plan CF-11 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "coach_sim":{
    '"$MIL_OFF"',
    "run_coach":{"enrolled":true,"target_km":10,"week":2,"session_in_week":0},
    "cycling_coach":{"active":true,"week":2,"sessions_this_week":0,"completed":false}
  },
  "is_pro":true
}')
if has "$R" "R556"; then pass "R556 fires (run coach)"; else fail "R556 missing"; fi
if has "$R" "R557"; then fail "R557 should be suppressed"; else pass "R557 suppressed"; fi
echo ""

# ── CF-12: Micro blocks coach ────────────────────────────────────────────────
echo "CF-12  Micro (no_time) blocks run coach"
R=$(plan CF-12 '{
  "date":"'"$DATE"'",
  "checkin":{"no_time":true,"energy":7,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"',"run_coach":{"enrolled":true,"target_km":10,"week":2,"session_in_week":0}},
  "is_pro":true
}')
if slot "$R" micro; then pass "slot=micro"; else fail "Expected micro, got $(get_slot "$R")"; fi
if has "$R" "R556"; then fail "R556 should be suppressed in micro"; else pass "R556 suppressed"; fi
echo ""

# ── CF-13: Gym today vs travel + no gear ─────────────────────────────────────
echo "CF-13  Gym today vs travel + no gear"
R=$(plan CF-13 '{
  "date":"'"$DATE"'",
  "checkin":{"gym_today":true,"traveling":true,"no_gear":true,"energy":7,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"'}
}')
if has "$R" "R516"; then pass "R516 fires (bodyweight wins)"; else fail "R516 missing"; fi
echo ""

# ── CF-14: Goal filter vs R555 safe-run pin ──────────────────────────────────
echo "CF-14  R555 run interval pinned despite strength goal"
R=$(plan CF-14 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "user_profile":{"sex":"male","weight_kg":80,"height_cm":180},
  "coach_sim":{'"$MIL_OFF"',"training_goal":"strength","equipment_profile":{"available":["running_shoes"]}}
}')
if has "$R" "R555"; then pass "R555 fires"; else fail "R555 missing"; fi
echo ""

# ── CF-15: Empty pool fallback ───────────────────────────────────────────────
echo "CF-15  Empty pool fallback safety"
# Use D1 pregnancy mode
d1 "UPDATE cycle_profile SET mode='pregnant', pregnancy_due_date='2026-11-01', medical_clearance_confirmed=1, updated_at_ms=$(date +%s)000 WHERE user_id='$USER_ID';" > /dev/null
R=$(plan CF-15 '{
  "date":"'"$DATE"'",
  "checkin":{"no_clothing":true,"pain_level":2,"pain_scope":"specific","pain_areas":["knee","shoulder","lower_back"],"energy":5,"sleep_hours":7},
  "user_profile":{"sex":"female","weight_kg":70,"height_cm":168},
  "coach_sim":{'"$MIL_OFF"'}
}')
d1 "UPDATE cycle_profile SET mode='$CURRENT_MODE', pregnancy_due_date=NULL, updated_at_ms=$(date +%s)000 WHERE user_id='$USER_ID';" > /dev/null
if has "$R" "steps"; then pass "Response has steps (no crash)"; else fail "No steps in response"; fi
echo ""

# ── CF-16: Progression gap vs run coach ──────────────────────────────────────
echo "CF-16  Progression gap doesn't override run coach"
R=$(plan CF-16 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"',"run_coach":{"enrolled":true,"target_km":10,"week":3,"session_in_week":0}},
  "is_pro":true
}')
if has "$R" "R556"; then pass "R556 fires (coach preserved)"; else fail "R556 missing"; fi
if has_step_slug "$R" "run-warmup-leg-swings"; then pass "Run warmup exercises present"; else fail "Warmup missing"; fi
echo ""

# ── CF-17/18: Skipped ────────────────────────────────────────────────────────
skip "CF-17  Run coach regression — needs execution flow + 8-day gap"
skip "CF-18  Cycling coach regression — needs execution flow + 11-day gap"
echo ""

# ── CF-21: Military + recovery_mode → rest ───────────────────────────────────
echo "CF-21  Military + recovery_mode → rest override"
R=$(plan CF-21 '{
  "date":"'"$DATE"'",
  "checkin":{"recovery_mode":true,"energy":5,"sleep_hours":7},
  "coach_sim":{"military_coach":{"active":true,"track":"keuring","mode":"open","cluster_current":2,"cluster_target":6,"block_session_index":0,"block_number":1}}
}')
if slot "$R" rest; then pass "slot=rest (check-in override)"; else fail "Expected rest, got $(get_slot "$R")"; fi
if has "$R" "check-in override: recovery_mode"; then pass "check-in override: recovery_mode in trace"; else fail "override not found in R570 trace"; fi
if has "$R" "R559"; then fail "R559 should NOT fire (military bypasses it)"; else pass "R559 suppressed"; fi
echo ""

# ── CF-22: Cooper test 3-phase steps ─────────────────────────────────────────
echo "CF-22  Cooper test 3-phase structure"
R=$(plan CF-22 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "coach_sim":{"military_coach":{"active":true,"track":"keuring","mode":"open","cluster_current":1,"cluster_target":6,"block_session_index":0,"block_number":1}}
}')
if has "$R" "R576"; then pass "R576 fires (Cooper test)"; else fail "R576 missing"; fi
if has_step_slug "$R" "easy-jog-warmup";        then pass "easy-jog-warmup present"; else fail "easy-jog-warmup missing"; fi
if has_step_slug "$R" "12-minute-cooper-test";   then pass "12-minute-cooper-test present"; else fail "Cooper test missing"; fi
if has_step_slug "$R" "cooldown-walk";           then pass "cooldown-walk present"; else fail "cooldown-walk missing"; fi
if step_order "$R" "easy-jog-warmup" "12-minute-cooper-test"; then pass "jog warmup before test ✓"; else fail "Wrong order: jog/test"; fi
if step_order "$R" "12-minute-cooper-test" "cooldown-walk";   then pass "test before cooldown ✓"; else fail "Wrong order: test/cooldown"; fi
echo ""

# ── CF-24: Recovery mode R559 ────────────────────────────────────────────────
echo "CF-24  Recovery mode R559 (standard)"
R=$(plan CF-24 '{
  "date":"'"$DATE"'",
  "checkin":{"recovery_mode":true,"energy":6,"sleep_hours":7},
  "coach_sim":{'"$MIL_OFF"'}
}')
if has "$R" "R559"; then pass "R559 fires"; else fail "R559 missing"; fi
echo ""

# ── CF-25: session_phase isolation ───────────────────────────────────────────
echo "CF-25  session_phase exercises not in general session"
R=$(plan CF-25 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "user_profile":{"sex":"male","weight_kg":80,"height_cm":180},
  "coach_sim":{'"$MIL_OFF"'}
}')
if no_step_slug "$R" "easy-jog-warmup"; then pass "easy-jog-warmup absent"; else fail "easy-jog-warmup leaked into general session"; fi
if no_step_slug "$R" "cooldown-walk";   then pass "cooldown-walk absent"; else fail "cooldown-walk leaked into general session"; fi
echo ""

# ── CF-26: R558 — needs D1 state ─────────────────────────────────────────────
skip "CF-26  R558 return-to-training — needs old execution row in D1"
echo ""

# ── CF-27: Military block_session_index=4 → rest ─────────────────────────────
echo "CF-27  Military block complete → rest earned"
R=$(plan CF-27 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "coach_sim":{"military_coach":{"active":true,"track":"keuring","mode":"open","cluster_current":2,"cluster_target":6,"block_session_index":4,"block_number":2}}
}')
if slot "$R" rest; then pass "slot=rest (block_session_index=4 → rest earned)"; else fail "Expected rest, got $(get_slot "$R")"; fi
echo ""

# ── CF-28: Military BMI chip guard ───────────────────────────────────────────
echo "CF-28  BMI caution chip absent for military"
R=$(plan CF-28 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "user_profile":{"sex":"male","weight_kg":95,"height_cm":175},
  "coach_sim":{"military_coach":{"active":true,"track":"keuring","mode":"open","cluster_current":2,"cluster_target":6,"block_session_index":1,"block_number":1}}
}')
if has "$R" "R545"; then fail "R545 should NOT fire for military"; else pass "R545 absent"; fi
if has "$R" "R546"; then fail "R546 should NOT fire for military"; else pass "R546 absent"; fi
echo ""

# ── CF-29: Military open Keuring starts at KB ────────────────────────────────
echo "CF-29  Military open Keuring KB (cluster 0) generates valid plan"
R=$(plan CF-29 '{
  "date":"'"$DATE"'",
  "checkin":{"energy":7,"sleep_hours":7},
  "coach_sim":{"military_coach":{"active":true,"track":"keuring","mode":"open","cluster_current":0,"cluster_target":6,"block_session_index":0,"block_number":1}}
}')
if has "$R" "R576"; then pass "Cooper test at KB (baseline)"; else
  if has "$R" "R570"; then pass "Military plan generated at KB"; else fail "Military did not activate for cluster 0"; fi
fi
if has "$R" "keuring_low"; then pass "keuring_low group for KB"; else fail "Wrong group — cluster 0 not mapped to keuring_low"; fi
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "══════════════════════════════════════════════"
printf "  Passed: %d  Failed: %d  Skipped: %d\n" $PASS $FAIL $SKIP
echo "══════════════════════════════════════════════"
echo ""
if [[ $FAIL -gt 0 ]]; then exit 1; fi
