#!/usr/bin/env bash
# JustFit pre-deploy smoke check
# Usage: npm run smoke
# Runs lint + build then sanity-checks the live API endpoints.

set -e
PROD="https://app.justfit.cc"
PASS=0; FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

# ── 1. Lint & build ────────────────────────────────────────────────────────
echo ""
echo "── Lint & Build ──────────────────────────────────────────────────────"
npm run lint  && ok "lint clean" || fail "lint errors"
npm run build && ok "build succeeded" || fail "build failed"

# ── 2. API health checks ───────────────────────────────────────────────────
echo ""
echo "── API sanity (${PROD}) ──────────────────────────────────────────────"

ping_status=$(curl -s -o /dev/null -w "%{http_code}" "${PROD}/api/ping")
[ "$ping_status" = "200" ] && ok "/api/ping → 200" || fail "/api/ping → ${ping_status}"

# Auth endpoint should reject unauthenticated GET with 401 (not 500)
auth_status=$(curl -s -o /dev/null -w "%{http_code}" "${PROD}/api/auth")
[ "$auth_status" = "401" ] && ok "/api/auth (no token) → 401" || fail "/api/auth → ${auth_status}"

# Plan endpoint should reject unauthenticated GET with 401
plan_status=$(curl -s -o /dev/null -w "%{http_code}" "${PROD}/api/plan?user_id=test&date=2025-01-01")
[ "$plan_status" = "401" ] && ok "/api/plan (no token) → 401" || fail "/api/plan → ${plan_status}"

# Exercises endpoint should return 200 (no auth required for exercise list)
ex_status=$(curl -s -o /dev/null -w "%{http_code}" "${PROD}/api/exercises")
[ "$ex_status" = "200" ] && ok "/api/exercises → 200" || fail "/api/exercises → ${ex_status}"

# ── Legal / consent regression ────────────────────────────────────────────────

# accept-terms with no token → 401 (auth guard is up)
at_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${PROD}/api/accept-terms" \
  -H "Content-Type: application/json" \
  -d '{"termsVersion":"1.1","privacyVersion":"1.0"}')
[ "$at_status" = "401" ] && ok "/api/accept-terms (no token) → 401" || fail "/api/accept-terms (no token) → ${at_status}"

# Version constants: legalVersions.js must be the server-side source of truth
# Confirm the shared module exists and exports both expected values
LEGAL_JS="functions/api/_shared/legalVersions.js"
if [ -f "$LEGAL_JS" ]; then
  grep -q "CURRENT_TERMS_VERSION"   "$LEGAL_JS" && \
  grep -q "CURRENT_PRIVACY_VERSION" "$LEGAL_JS" && \
  ok "legalVersions.js exports both version constants" || \
  fail "legalVersions.js missing version constants"
else
  fail "functions/api/_shared/legalVersions.js not found"
fi

# Confirm auth.js + profile.js + accept-terms.js import from shared module (not hardcoded)
for f in functions/api/auth.js functions/api/profile.js functions/api/accept-terms.js; do
  if grep -q "from './_shared/legalVersions.js'" "$f"; then
    ok "$f uses shared legalVersions"
  else
    fail "$f has hardcoded version constants (should import from _shared/legalVersions.js)"
  fi
done

# Confirm accept-terms.js validates BOTH versions
if grep -q "CURRENT_PRIVACY_VERSION" functions/api/accept-terms.js; then
  ok "accept-terms.js validates privacy version"
else
  fail "accept-terms.js missing privacy version validation"
fi

# Confirm LEGAL_VERSIONS in login.js matches the server-side source of truth
TERMS_SERVER=$(grep "CURRENT_TERMS_VERSION" functions/api/_shared/legalVersions.js | grep -o "'[^']*'" | head -1 | tr -d "'")
PRIVACY_SERVER=$(grep "CURRENT_PRIVACY_VERSION" functions/api/_shared/legalVersions.js | grep -o "'[^']*'" | head -1 | tr -d "'")
TERMS_CLIENT=$(grep "CURRENT_TERMS_VERSION" packages/client-app/public/login.js | grep -o "'[^']*'" | head -1 | tr -d "'")
PRIVACY_CLIENT=$(grep "CURRENT_PRIVACY_VERSION" packages/client-app/public/login.js | grep -o "'[^']*'" | head -1 | tr -d "'")
if [ "$TERMS_SERVER" = "$TERMS_CLIENT" ] && [ "$PRIVACY_SERVER" = "$PRIVACY_CLIENT" ]; then
  ok "LEGAL_VERSIONS in sync: login.js matches legalVersions.js (terms=${TERMS_SERVER}, privacy=${PRIVACY_SERVER})"
else
  fail "LEGAL_VERSIONS drift: server=(${TERMS_SERVER},${PRIVACY_SERVER}) client=(${TERMS_CLIENT},${PRIVACY_CLIENT})"
fi

# Confirm App.jsx uses LEGAL_VERSIONS constant instead of bare string literals
if grep -q "LEGAL_VERSIONS" packages/client-app/src/App.jsx; then
  ok "App.jsx uses LEGAL_VERSIONS constant"
else
  fail "App.jsx has hardcoded version strings in acceptTerms call"
fi

# Confirm App.jsx terms gate is fail-closed (no silent catch that dismisses gate)
if grep -q "setTermsAcceptError" packages/client-app/src/App.jsx; then
  ok "App.jsx terms gate is fail-closed"
else
  fail "App.jsx terms gate catch block may dismiss gate on error"
fi

# ── Dead session-token guard ─────────────────────────────────────────────────
# C-B17 moved the session into an HttpOnly cookie. localStorage jf_token has not
# been written since, so any guard reading it is always false. One such guard sat
# in front of the Strava OAuth callback and silently discarded every connection.
if grep -rn 'getItem("jf_token")' packages/client-app/src --include="*.js" --include="*.jsx" >/dev/null 2>&1; then
  fail "something reads localStorage jf_token — it is never written; the guard will always be false"
else
  ok "no code reads the dead jf_token"
fi

# ── Equipment vocabulary coherence ───────────────────────────────────────────
# The gym is a superset of home. GYM_EQUIPMENT once omitted rucksack, chair,
# resistance_bands and foam_roller, so ticking "at the gym" dropped 52 exercises
# and added one. It also said resistance_band (singular) while the library says
# resistance_bands, silently excluding band work at the gym.
if grep -q "GYM_ONLY_EQUIPMENT" functions/api/plan.js && grep -q "HOME_EQUIPMENT" functions/api/plan.js; then
  ok "gym equipment is composed from the home list, not a parallel one"
else
  fail "GYM_EQUIPMENT is a standalone list again — it will drift from home equipment"
fi

if grep -qE "'resistance_band'" functions/api/plan.js; then
  fail "plan.js uses 'resistance_band' (singular); the exercise library says resistance_bands"
else
  ok "resistance_bands naming is consistent with the library"
fi

# ── Theme tokens (light/dark) ─────────────────────────────────────────────────
# Every theme-dependent colour must be a CSS custom property, or it will not
# invert on light. The dark design used white-at-low-alpha for every raised
# surface, border and divider; those are now rgba(var(--overlay-rgb),a).
_hard=$(grep -rrnE "rgba\(255,\s*255,\s*255," packages/client-app/src --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "tokens.js" | wc -l | tr -d ' ')
if [ "$_hard" = "0" ]; then
  ok "no hardcoded white overlays in components"
else
  fail "$_hard hardcoded rgba(255,255,255,...) in components — use rgba(var(--overlay-rgb),a)"
fi

# Any hex colour in a component is a theme bug waiting to happen: it cannot
# invert. The previous version of this check listed four specific values, which
# is why #cbd5e1 (coach sentence, ~1.4:1 on light) and 17 dark sheet backgrounds
# survived a "green" run. It is now an allowlist: brand and status hues that are
# genuinely theme-independent are permitted, everything else must be a token.
#
# Allowed: Strava brand, the ACCENT_COLORS swatches, status hues that carry
# meaning (amber/red/green), and #fff/#000.
_allow='FC4C02|10b981|8b5cf6|0ea5e9|f43f5e|f59e0b|6366f1|84cc16|06b6d4|f97316|d946ef|fb7185|fbbf24|ef4444|22c55e|a78bfa|fcd34d|6ee7b7|3b82f6|fda4af|be123c|b45309|dc2626|4ade80|60a5fa|ffffff|000000|0a0a0a'
# -n without -o: the full source line has to survive so the exclusions below can
# see it. (Filtering grep -o output silently does nothing — it has already thrown
# the context away.)
_scan() {
  grep -rnE "#[0-9a-fA-F]{3,8}|[\"'](white|black|silver|gray|grey)[\"']" packages/client-app/src --include="*.jsx" --include="*.js" 2>/dev/null \
    | grep -v "tokens.js" | grep -v "ErrorBoundary" | grep -v "themeValue(" | grep -v "var(--" \
    | grep -vE "#($_allow)" | grep -viE "#($_allow)"
}
_hex=$(_scan | wc -l | tr -d ' ')
if [ "$_hex" = "0" ]; then
  ok "no un-tokenised hex colours in components"
else
  echo "        offenders:"; _scan | head -8 | sed 's/^/          /' | cut -c1-120
  fail "$_hex un-tokenised hex colour(s) in components — add a token or allowlist the brand hue"
fi

# index.html resolves the theme inline before the bundle loads; its --bg values
# must match THEMES in tokens.js or the page flashes the wrong ground colour.
if grep -q '"--bg": "#f7f8fa"' packages/client-app/index.html && grep -q '"--bg":           "#f7f8fa"' packages/client-app/src/tokens.js; then
  ok "index.html pre-paint palette matches tokens.js"
else
  fail "index.html inline theme palette is out of step with tokens.js THEMES"
fi

# ── Session/localStorage symmetry (login <-> app redirect loop) ───────────────
# logout() must AWAIT the cookie clear before navigating. Fire-and-forget lets the
# navigation abort the request, leaving a live cookie with no jf_user_id — which
# loops /login.html <-> / forever, with no address bar to escape in an installed PWA.
if grep -qE "await fetch\('/api/auth'" packages/client-app/src/authHelpers.js; then
  ok "logout() awaits the server-side cookie clear"
else
  fail "authHelpers.logout() does not await /api/auth logout — cookie can outlive localStorage"
fi

# login.js must require BOTH halves of the session before redirecting to "/".
# Redirecting on res.ok alone is the other half of the same loop.
if grep -qE "if \(s\.ok\) \{ *redirectAfterAuth\(\); *return; *\}" packages/client-app/public/login.js; then
  fail "login.js redirects on res.ok alone — will loop against App.jsx auth guard"
elif grep -q "jf_user_id" packages/client-app/public/login.js && grep -q "d.valid" packages/client-app/public/login.js; then
  ok "login.js requires cookie AND jf_user_id before redirecting home"
else
  fail "login.js session check does not verify both cookie validity and jf_user_id"
fi

# Detect self-referential C token definitions (amber: C.amber inside the C object literal)
# This causes a fatal TypeError on every page load (TDZ: C is undefined while being initialized)
for f in packages/client-app/src/App.jsx packages/client-app/src/SettingsView.jsx; do
  if grep -qE "^\s+(amber|rose|amberDim|roseDim|amberBorder|roseBorder):\s+C\." "$f"; then
    fail "$f has self-referential C token definition (e.g. amber: C.amber) — use literal values"
  else
    ok "$f C tokens are not self-referential"
  fi
done

# ── C-F15 — the DCP card must not appear uninvited ─────────────────────────
# dcp.enabled only records that a baseline exists. Showing readiness stats and a
# "go measure yourself" prompt to someone who has turned the coach AND the bias
# off is nagging about a goal they do not have. One predicate, both mounts.
VIS=$(node --input-type=module -e '
import fs from "node:fs";
const src = fs.readFileSync("functions/api/_shared/military.js","utf8");
const m = src.match(/export function dcpCardVisible[\s\S]*?\n\}/);
if (!m) { process.stdout.write("MISSING dcpCardVisible"); }
else {
  fs.writeFileSync("/tmp/_vis.mjs", m[0].replace("export ", "") + "\nexport { dcpCardVisible };");
  const { dcpCardVisible } = await import("/tmp/_vis.mjs?t=" + Date.now());
  const errs = [];
  if (dcpCardVisible({enabled:true}, false)) errs.push("shows with coach off and bias off");
  if (!dcpCardVisible({enabled:true, bias_enabled:true}, false)) errs.push("hidden when the bias is on");
  if (!dcpCardVisible({enabled:true}, true)) errs.push("hidden when the military coach is on");
  if (dcpCardVisible({enabled:false, bias_enabled:true}, true)) errs.push("shows without a baseline");
  if (dcpCardVisible(undefined, true)) errs.push("shows with no dcp block");
  process.stdout.write(errs.length ? errs.join("; ") : "OK");
}' 2>&1)
if [ "$VIS" = "OK" ]; then
  ok "DCP card appears only when the coach or the bias is actually on"
else
  fail "DCP card visibility: ${VIS}"
fi

# Both mounts must route through that predicate, or one screen drifts from the other.
if grep -q "militaryActive" packages/client-app/src/HistoryView.jsx \
   && grep -q "militaryActive" packages/client-app/src/CoachView.jsx; then
  ok "both DCP card mounts pass the military flag"
else
  fail "a DCP card mount is not passing militaryActive — it will show uninvited"
fi

# ── C-F13b — the DCP bias must let go ──────────────────────────────────────
# A goal pushes continuously; a bias must stop once the floor is cleared, or
# general training quietly becomes permanent DCP prep. Also asserts the bias
# floor and the goal's `safe` tier remain ONE number — two near-identical
# thresholds would be a glossary nobody reads.
BIAS=$(node --input-type=module -e '
import { getDcpNorms, dcpProgress, dcpBiasStrength, DCP_TIERS, dcpIsStale, DCP_RETEST_DAYS }
  from "./functions/api/_shared/military.js";
const n = getDcpNorms("male", 37), errs = [];
if (DCP_TIERS.safe !== 1.2) errs.push("safe is " + DCP_TIERS.safe + ", the bias defends +20% — keep them one number");
const at  = (v) => dcpBiasStrength(dcpProgress(v, n.pushups));
const safe = Math.round(n.pushups * DCP_TIERS.safe);
if (at(0) !== 1) errs.push("no full push below the minimum");
if (at(safe) !== 0) errs.push("bias still pushing at the +20% floor (" + safe + ") — it must let go");
if (at(safe + 10) !== 0) errs.push("bias pushing above the floor");
if (!(at(n.pushups) > 0 && at(n.pushups) < 1)) errs.push("no taper between minimum and floor");
// Monotonic: more capability must never mean more push.
let prev = 2;
for (let v = 0; v <= safe + 4; v++) { const b = at(v); if (b > prev + 1e-9) errs.push("bias rose at " + v); prev = b; }
if (dcpIsStale(Date.now() - (DCP_RETEST_DAYS - 1) * 86400000)) errs.push("stale too early");
if (!dcpIsStale(Date.now() - (DCP_RETEST_DAYS + 1) * 86400000)) errs.push("never goes stale");
if (dcpIsStale(null)) errs.push("never-measured must not read as stale");
process.stdout.write(errs.length ? errs.join("; ") : "OK");
' 2>&1)
if [ "$BIAS" = "OK" ]; then
  ok "DCP bias tapers and releases at +20%, and shares one number with the goal"
else
  fail "DCP bias: ${BIAS}"
fi

# R593 fronts the test MOVEMENTS; R594 shapes the axis targets. Target shaping
# alone would let a dumbbell press satisfy a raised push target, which is not what
# the DCP measures. Both must exist — and R593 must be gated on the SAME predicate
# as the card (dcpCardVisible), or the planner gets steered by a DCP the user has
# switched off and cannot see. `dcp.enabled` alone only records that a baseline exists.
if grep -q "R593 — DCP-beweging vooraan" functions/api/plan.js \
   && grep -q "R594 — DCP-bias actief" functions/api/plan.js; then
  if grep -q "dcpCardVisible(_dcp" functions/api/plan.js; then
    ok "DCP has both rules, and R593 is gated on the same predicate as the card"
  else
    fail "R593 is not gated on dcpCardVisible — a switched-off DCP would still bias the plan"
  fi
else
  fail "DCP is missing either the movement guarantee or the target bias"
fi

# ── C-F13 — DCP norms and tiering ──────────────────────────────────────────
# The DCP is a published standard someone is training against, so the numbers
# must not drift and the tiering must never show an unreachable target to
# someone below the minimum. Also asserts the female table stays null rather
# than silently falling back to male norms.
DCP=$(node --input-type=module -e '
import { getDcpNorms, dcpProgress, DCP_NORMS } from "./functions/api/_shared/military.js";
const errs = [];
const m37 = getDcpNorms("male", 37);
if (!m37 || m37.pushups !== 16 || m37.situps !== 24 || m37.run_m !== 2200)
  errs.push("published 36-40 male norms changed: " + JSON.stringify(m37));
if (DCP_NORMS.male.length !== 8) errs.push("expected 8 male age bands, got " + DCP_NORMS.male.length);
if (getDcpNorms("female", 37) !== null)
  errs.push("female norms are not published here — must return null, never male numbers");
// Tiering: below the minimum, the target shown is the minimum, never capacity.
const low = dcpProgress(6, 16);
if (low.next !== 16) errs.push("below minimum shows " + low.next + ", must show the minimum");
if (low.step < 1) errs.push("step must always move");
if (low.value + low.step > low.next) errs.push("step overshoots the target");
// Cleared the minimum, the target moves up rather than sticking.
const mid = dcpProgress(25, 24);
if (mid.next <= 24) errs.push("target did not advance past a cleared minimum");
// At capacity, nothing further is demanded.
const top = dcpProgress(40, 16);
if (top.gap !== 0 || top.tier !== "capacity") errs.push("capacity not recognised");
// The run capacity must still cover the hardest keuring cluster (2700 m).
if (dcpProgress(0, 2200, true).capacity < 2700)
  errs.push("run capacity " + dcpProgress(0,2200,true).capacity + " no longer covers cluster 6");
process.stdout.write(errs.length ? errs.join("; ") : "OK");
' 2>&1)
if [ "$DCP" = "OK" ]; then
  ok "DCP norms match the published standards and tiering never overshoots"
else
  fail "DCP: ${DCP}"
fi

# The sit-up family must exist, or the app can measure a DCP score it cannot train.
SITUPS=$(grep -c "sit-up" migrations/0110_dcp_situps.sql 2>/dev/null || echo 0)
if [ "$SITUPS" -ge 4 ]; then
  ok "DCP sit-up family is seeded (the library had no sit-up at all)"
else
  fail "the sit-up family is missing — DCP sit-ups would be measurable but untrainable"
fi

# ── C-B22 — no SQL against a table that no longer exists ───────────────────
# mollie-consumer.js read `auth_users` for months after the schema consolidation
# dropped it. It threw on every failed payment, a .catch discarded the error, and
# the customer was never warned. Schema drift is this codebase's most expensive
# bug class, so it gets a build-time check rather than a documented rule.
#
# The table list is committed alongside the code (scripts/known-tables.txt) so the
# guard runs offline; refresh it whenever a migration adds or drops a table.
if [ -f scripts/known-tables.txt ]; then
  DRIFT=$(node --input-type=module -e '
import fs from "node:fs";
const live = new Set(fs.readFileSync("scripts/known-tables.txt","utf8").split("\n").map(s=>s.trim()).filter(Boolean));
const files = [];
(function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p = d + "/" + e.name;
  if (e.isDirectory()) walk(p); else if (e.name.endsWith(".js")) files.push(p);
} })("functions");
// A literal is SQL when it STARTS with the verb. Matching the verb anywhere
// turned comment prose ("select … from what the user …") into table names.
const sqlish = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|PRAGMA)\b/i;
const tbl = /\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z0-9_]{2,})/gi;
const noise = new Set(["select","set","where","values","json_each"]);
const bad = [];
for (const f of files) {
  const src = fs.readFileSync(f,"utf8");
  // Backtick AND single-quoted literals. auth.js writes its deletion batch in
  // single quotes, and a missing table there 500s every account deletion —
  // the exact shape that broke trainer deletion once already.
  for (const m of src.matchAll(/`([^`]*)`|\x27((?:[^\x27\\]|\\.)*)\x27/g)) {
    const lit = m[1] ?? m[2] ?? "";
    if (!sqlish.test(lit)) continue;
    // Skip HTML email bodies: they contain words like UPDATE and arrows such as
    // "from Settings -> Privacy" that read as a table reference. No SQL string
    // contains markup, so this costs nothing and removes the whole false class.
    if (/<\/?[a-z][^>]*>|&[a-z]+;/i.test(lit)) continue;
    for (const t of lit.matchAll(tbl)) {
      const name = t[1].toLowerCase();
      if (!noise.has(name) && !live.has(name)) bad.push(f.replace("functions/api/","") + " → " + name);
    }
  }
}
process.stdout.write(bad.length ? [...new Set(bad)].join("; ") : "OK");
' 2>&1)
  if [ "$DRIFT" = "OK" ]; then
    ok "every table referenced in SQL exists in the schema"
  else
    fail "SQL references a table that does not exist: ${DRIFT}"
  fi
fi

# ── C-F12 — progression calibration must stay physiological ────────────────
# The old model claimed you lose 65% of your strength in 28 days off, and capped
# a weekly trainee at 12/100. These assert the calibrated behaviour rather than
# the constants, so a future tune is free to change the numbers but not to
# reintroduce a model that does not describe training.
CAL=$(node --input-type=module -e '
import { applyGain, applyDecay, applyBaselineRatchet, GAIN_PER_SET }
  from "./functions/api/_shared/progressionModel.js";
const NOW = Date.now(), ago = d => NOW - d * 86400000;
const sim = (every, sets, days) => {
  let s = 0, b = 0;
  for (let i = 0, n = Math.floor(days / every); i < n; i++) {
    s = applyGain(s, sets * GAIN_PER_SET);
    b = applyBaselineRatchet(b, s);
    s = applyDecay(s, b, ago(every), NOW, "power");
  }
  return s;
};
const errs = [];
const weekly = sim(7, 4, 365);
if (weekly < 50 || weekly > 72) errs.push("weekly/year = " + weekly.toFixed(1) + ", expected 50-72");
const daily = sim(1, 4, 365);
if (daily > 97) errs.push("daily/year = " + daily.toFixed(1) + " — 100 must stay out of reach");
if (daily < weekly) errs.push("training more often scores lower");
const keep28 = applyDecay(70, 30, ago(28), NOW, "power") / 70;
if (keep28 < 0.88) errs.push("28d retention " + Math.round(keep28*100) + "% — literature says ~93%");
const keep90 = applyDecay(70, 30, ago(90), NOW, "power") / 70;
if (keep90 < 0.70) errs.push("90d retention " + Math.round(keep90*100) + "% — too aggressive");
if (applyDecay(70, 30, ago(3650), NOW, "power") < 30) errs.push("decay crossed the baseline floor");
if (applyBaselineRatchet(40, 5) < 40) errs.push("baseline fell");
if (applyGain(99.9, 500) > 100) errs.push("score exceeded 100");
process.stdout.write(errs.length ? errs.join("; ") : "OK");
' 2>&1)
if [ "$CAL" = "OK" ]; then
  ok "progression calibration is physiological (retention, ceiling, monotonic baseline)"
else
  fail "progression calibration: ${CAL}"
fi

# One definition of the model, not three. Before the shared module, applyGain
# existed twice with DIFFERENT curves and applyDecay twice with different configs.
for fn in applyGain applyDecay; do
  CNT=$(grep -rcE "^(export )?function ${fn}\(" functions/api/ 2>/dev/null | awk -F: '{s+=$2} END {print s+0}')
  if [ "$CNT" = "1" ]; then
    ok "${fn} has exactly one definition"
  else
    fail "${fn} defined ${CNT} times — duplicate formulas drift silently"
  fi
done

# ── C-F11 — the curve must agree with the radar ────────────────────────────
# The axis drill-down replays stored snapshots through getDisplayScore. If it ever
# used a separate computation, the last point of the curve could disagree with the
# radar's current value on the same screen — the one thing a drill-down must never
# do. This asserts the replay calls the shared function rather than its own maths.
if grep -q "function buildAxisHistory" functions/api/progression.js; then
  if sed -n '/function buildAxisHistory/,/^}/p' functions/api/progression.js | grep -q "getDisplayScore(scores, axis, chartMode)"; then
    ok "axis history replays through getDisplayScore — curve cannot disagree with the radar"
  else
    fail "buildAxisHistory no longer uses getDisplayScore — the curve can drift from the radar"
  fi
  # chartMode must be defined before the history block, or it is a TDZ ReferenceError
  CM=$(grep -n "const chartMode" functions/api/progression.js | head -1 | cut -d: -f1)
  AH=$(grep -n "let axisHistory" functions/api/progression.js | head -1 | cut -d: -f1)
  if [ -n "$CM" ] && [ -n "$AH" ] && [ "$AH" -gt "$CM" ]; then
    ok "axis history reads chartMode after it is declared"
  else
    fail "axis history uses chartMode before declaration (line ${AH} vs ${CM}) — ReferenceError at runtime"
  fi
fi

# ── W0.1 — column-backed settings must be read from the column ─────────────
# training_goal, experience_level, sex, weight_kg, height_cm, session_duration_min
# and intensity_pref are COLUMNS on user_preferences. Reading one from
# preferences_json always misses and falls back to a default, which is how the
# weekly summary described a goal the user had never set.
BLOB=$(grep -rn --include='*.js' --include='*.jsx' -E "preferences\??\.(training_goal|experience_level|sex|weight_kg|height_cm|session_duration_min|intensity_pref)\b" packages/client-app/src functions/api 2>/dev/null || true)
if [ -z "$BLOB" ]; then
  ok "column-backed settings are never read from preferences_json"
else
  fail "a column-backed setting is read from the JSON blob (always misses): ${BLOB}"
fi

# ── W0.2 — every advertised alternative must actually exist ────────────────
# WorkoutView fetches alternatives by slug. 29 targets did not exist, so 16
# exercises offered fewer than advertised and 5 opened an empty sheet. A button
# that opens nothing is the same defect class as the unreachable self-assessment.
ALTS=$(node --input-type=module -e '
import fs from "node:fs";
const mig = fs.readFileSync("migrations/0113_repair_alternatives.sql","utf8");
if (!/UPDATE exercises SET alternatives_json/.test(mig)) { process.stdout.write("migration 0113 missing"); }
else process.stdout.write("OK");' 2>&1)
if [ "$ALTS" = "OK" ]; then
  ok "substitution repair migration is present (0113)"
else
  fail "alternatives: ${ALTS}"
fi

# ── W5 — library data: muscles, symmetric swaps, protocol/measurable tags ──
# Three data migrations carry the Wave 5 work (0114 primary muscles, 0115 mirrored
# substitutions, 0116 protocol + measurable tags). The `protocol` tag marks a
# Defence programme PRESCRIPTION; R596 and R598 will read it. If it ever lands on
# a general movement that merely carries `military` (push-up, plank, squat, lunge,
# sit-up ...), civilian users lose that movement from their sessions with no error
# anywhere, so the property is asserted from the source of every migration >= 0114.
W5=$(node --input-type=module -e '
import fs from "node:fs";
const need = [
  ["migrations/0114_cardio_primary_muscles.sql", /UPDATE exercises SET primary_muscles_json/],
  ["migrations/0115_mirror_substitutions.sql", /UPDATE exercises SET alternatives_json/],
  ["migrations/0116_protocol_measurable_tags.sql", /UPDATE exercises SET tags_json/],
];
for (const [f, re] of need) {
  if (!fs.existsSync(f)) { process.stdout.write("missing " + f); process.exit(0); }
  if (!re.test(fs.readFileSync(f, "utf8"))) { process.stdout.write(f + " has no matching UPDATE"); process.exit(0); }
}
const GENERAL = new Set(["push-up","knee-push-up","wall-push-up","hand-release-push-up","plyometric-push-up","plyo-push-up","plank","squat","back-squat","front-squat","squat-jump","lunge","walking-lunges","sit-up","bent-knee-sit-up","anchored-sit-up","weighted-sit-up","bicycle-crunch","flutter-kicks","scissor-jump","mountain-climber","clean-pull","high-pull","counter-movement-jump","single-leg-deadlift","deadlift","wissel-sprongen"]);
const protocol = new Set(); const measurable = new Set();
for (const f of fs.readdirSync("migrations")) {
  const m = /^(\d{4})_.*\.sql$/.exec(f);
  if (!m || Number(m[1]) < 114) continue;
  const sql = fs.readFileSync("migrations/" + f, "utf8");
  for (const u of sql.matchAll(/UPDATE exercises SET tags_json = \x27(.*?)\x27, updated_at_ms = \d+ WHERE slug = \x27(.*?)\x27;/g)) {
    const tags = JSON.parse(u[1]);
    if (tags.includes("protocol")) protocol.add(u[2]);
    if (tags.includes("measurable")) measurable.add(u[2]);
  }
}
const leaked = [...protocol].filter(s => GENERAL.has(s));
if (leaked.length) { process.stdout.write("general movement(s) tagged protocol: " + leaked.join(", ")); process.exit(0); }
if (protocol.size === 0) { process.stdout.write("no protocol tags seeded"); process.exit(0); }
const lost = ["push-up","knee-push-up","wall-push-up","sit-up","bent-knee-sit-up","anchored-sit-up","12-minute-cooper-test"].filter(s => !measurable.has(s));
if (lost.length) { process.stdout.write("self-assessment exercise(s) not tagged measurable: " + lost.join(", ")); process.exit(0); }
process.stdout.write("OK");' 2>&1)
if [ "$W5" = "OK" ]; then
  ok "library data migrations present (0114-0116); no general movement tagged protocol"
else
  fail "wave 5 data: ${W5}"
fi

# ── W2.1 — a rule that traces must be explainable, in Dutch ────────────────
# parseRuleTrace iterates RULE_LABELS and matches the trace against it, so a code
# with no label is dropped SILENTLY: the user is not shown a raw code, they are
# shown nothing. 23 rules were invisible that way, and three more changed volume
# or session shape with no trace at all. Fixing 23 instances without a guard just
# means a 24th next month, so this asserts the property:
#
#   every R-code the planner traces is either in RULE_LABELS or declared in
#   INTERNAL_RULE_CODES with a reason, every label has an NL translation, and
#   the single R519 volume sentence really is the product of its own factors.
#
# Codes carrying a variant suffix (R500a, R557b, R573a) are checked on their base
# code. Diagnostics that do not start with a code (WARN …, BMI: …) are out of scope
# by design — they are not statements to a user.
EXPL=$(node --input-type=module -e '
import fs from "node:fs";
import { RULE_LABELS, INTERNAL_RULE_CODES, VOLUME_REASON_TEXT, parseVolumeTrace } from "./packages/client-app/src/messagePolicy.js";
import { runPlanner } from "./functions/api/plan.js";

const errs = [];
const src = fs.readFileSync("functions/api/plan.js", "utf8");
const lines = src.split("\n");
const balance = (t) => [...t].reduce((n, c) => n + (c === "(" ? 1 : c === ")" ? -1 : 0), 0);

// ── 1. every traced R-code is labelled or explicitly internal ──
const traced = new Map();
for (let i = 0; i < lines.length; i++) {
  const at = lines[i].indexOf("trace.push(");
  if (at < 0) continue;
  let stmt = lines[i].slice(at);
  let j = i;
  while (balance(stmt) > 0 && j < lines.length - 1) { j++; stmt += "\n" + lines[j]; }
  for (const m of stmt.matchAll(/["\x27`]\s*(R\d{3})/g)) {
    if (!traced.has(m[1])) traced.set(m[1], i + 1);
  }
}
if (traced.size < 40) errs.push("only " + traced.size + " traced rule codes found - the trace.push scan is not seeing the planner");
const unexplained = [...traced].filter(([c]) => !RULE_LABELS[c] && !INTERNAL_RULE_CODES[c]);
if (unexplained.length) {
  errs.push("rule(s) trace with no RULE_LABELS entry and no INTERNAL_RULE_CODES declaration: "
    + unexplained.map(([c, ln]) => c + " (plan.js:" + ln + ")").join(", "));
}
const bothWays = Object.keys(INTERNAL_RULE_CODES).filter(c => RULE_LABELS[c]);
if (bothWays.length) errs.push("declared internal AND labelled: " + bothWays.join(", "));
for (const [code, why] of Object.entries(INTERNAL_RULE_CODES)) {
  if (typeof why !== "string" || why.trim().length < 20) errs.push(code + " is declared internal with no real reason");
}

// ── 2. every volume reason key the planner emits can be rendered ──
for (const m of src.matchAll(/_volumeReason\(\s*ctx\s*,\s*["\x27]([a-z_]+)["\x27]\s*\)/g)) {
  if (!VOLUME_REASON_TEXT[m[1]]) errs.push("volume reason \"" + m[1] + "\" has no VOLUME_REASON_TEXT fragment");
}

// ── 3. Dutch-first: every label the panel can render has an NL entry ──
const i18n = fs.readFileSync("packages/client-app/src/i18n.js", "utf8");
const unesc = (x) => x.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
                      .replace(/\\(["\x27\\])/g, "$1");
const nlKeys = new Set();
for (const m of i18n.matchAll(/^ {2}(["\x27])((?:\\.|(?!\1)[^\\])*)\1\s*:/gm)) nlKeys.add(unesc(m[2]));
const needNl = [];
for (const [code, label] of Object.entries(RULE_LABELS)) {
  if (!nlKeys.has(label.text)) needNl.push(code);
  if (label.cta && !nlKeys.has(label.cta)) needNl.push(code + " (cta)");
  for (const v of Object.values(label.variants ?? {})) if (!nlKeys.has(v)) needNl.push(code + " (variant)");
}
for (const [key, text] of Object.entries(VOLUME_REASON_TEXT)) if (!nlKeys.has(text)) needNl.push("reason:" + key);
for (const c of ["Safety adaptation", "Training adaptation", "Suggested action"]) if (!nlKeys.has(c)) needNl.push("header:" + c);
if (needNl.length) errs.push("no NL translation in i18n.js for: " + needNl.join(", "));

// ── 4. the volume sentence must be the product of the factors that fired ──
// Source scanning cannot answer this, so the planner is run for real: a beginner at
// 110 kg, five hours of sleep, back after a 17-day break - the account that hit the
// stack. Checked against the rules that actually fired, not against a fixed number.
const ex = (slug, name, category, tags, metrics) => ({
  id: slug, slug, name, category,
  tags_json: JSON.stringify(tags), equipment_required_json: JSON.stringify(["none"]),
  metrics_json: JSON.stringify(metrics), instructions_json: null, alternatives_json: null,
  primary_muscles_json: "[]", secondary_muscles_json: "[]", media_json: null,
});
const pool = [
  ex("push-up", "Push-up", "strength", ["bodyweight", "push"], { supports: ["reps", "sets"] }),
  ex("bodyweight-squat", "Bodyweight Squat", "strength", ["bodyweight", "legs"], { supports: ["reps", "sets"] }),
  ex("glute-bridge", "Glute Bridge", "strength", ["bodyweight", "hips"], { supports: ["reps", "sets"] }),
  ex("plank", "Plank", "strength", ["bodyweight", "core"], { supports: ["time", "sets"], base_duration_sec: 45 }),
  ex("cat-cow", "Cat Cow", "mobility", ["mobility", "low_impact"], { supports: ["time", "sets"], base_duration_sec: 40 }),
];
const date = "2026-10-02";
const gapStart = new Date(Date.parse(date + "T12:00:00Z") - 17 * 86400000).toISOString().slice(0, 10);
const plan = runPlanner(date, { sleep_hours: 5, energy: 7, stress: 2 }, pool,
  { training_goal: "strength", experience_level: "beginner", session_duration_min: 40, preferences: {} },
  [], [], { sex: "female", weight_kg: 110, height_cm: 190 }, null, null, false,
  { last_workout_date: gapStart }, false, [], null, 0, 0, 0, null, null, {});
const trace = plan.rule_trace ?? [];
const has = (code) => trace.some(t => String(t).startsWith(code));

if (!has("R502")) errs.push("R502 scaled reps and durations without a trace (the duration leg was silent for weeks)");
if (!has("R524")) errs.push("R524 rescaled bodyweight reps without a trace");
if (!has("R525")) errs.push("R525 appended a mobility exercise without a trace - the session shown does not match the session explained");

const volLines = trace.filter(t => String(t).startsWith("R519"));
if (volLines.length !== 1) {
  errs.push("expected exactly one accumulated volume sentence, found " + volLines.length);
} else {
  const v = parseVolumeTrace(volLines[0]);
  if (!v) errs.push("the R519 volume line is not parsable by parseVolumeTrace");
  else {
    const drift = Math.abs(v.pct / 100 - v.product) / (v.product || 1);
    if (drift > 0.01) errs.push("volume sentence says " + v.pct + "% but its own factors multiply to "
      + Math.round(v.product * 100) + "% (" + Math.round(drift * 1000) / 10 + "% off)");
    if (has("R502") && v.factors.experience == null) errs.push("R502 fired but is missing from the volume sentence");
    if (has("R524") && v.factors.bodyweight == null) errs.push("R524 fired but is missing from the volume sentence");
    if ((has("R511") || has("R558")) && v.factors.situational == null) errs.push("a de-load rule fired but is missing from the volume sentence");
    if (!v.reasons.length) errs.push("the volume sentence states a percentage with no reasons");
    for (const r of v.reasons) if (!VOLUME_REASON_TEXT[r]) errs.push("volume sentence names unknown reason \"" + r + "\"");
  }
}
process.stdout.write(errs.length ? errs.join("; ") : "OK (" + traced.size + " traced codes, "
  + Object.keys(INTERNAL_RULE_CODES).length + " internal)");
' 2>&1)
case "$EXPL" in
  OK*) ok "every planner rule that traces is explainable and translated — $EXPL" ;;
  *)   fail "explainability: ${EXPL}" ;;
esac

# ── W7 — gym-private exercises stay private ────────────────────────────────
# exercises.gym_id scopes a row to one gym. The planner's base query and the
# PUBLIC library endpoint both fetched every active row regardless; members got
# their gym's rows twice and non-members got them once. Latent while every live
# row is global, a leak the day a trainer creates one. The planner case is
# asserted behaviourally in plan-override-requests.mjs (block 8); the public
# endpoint has no session to scope by, so it must never serve a gym row at all.
if grep -q "FROM exercises WHERE is_active = 1" functions/api/exercises.js \
   && awk '/FROM exercises WHERE is_active = 1/{f=1} f&&/gym_id IS NULL/{ok=1} f&&/`;/{exit} END{exit !ok}' functions/api/exercises.js; then
  ok "public exercise library never serves a gym-scoped row"
else
  fail "GET /api/exercises base query no longer excludes gym_id rows — every gym's private exercises are public"
fi

# ── W6.4 — the planner never reads the wall clock for a DCP age ────────────
# The planner is deterministic by design (planDateMs replaced Date.now() in the
# sport-bias guardrail and mobility-decay rule). Two DCP sites called
# dcpAgeFrom(birth_year) with no date, so the same plan request could change
# answer across a birthday. Every call must pass the plan date.
BARE=$(grep -nE "dcpAgeFrom\([^)]*\)" functions/api/plan.js | grep -v "planDateMs" || true)
if [ -z "$BARE" ]; then
  ok "every dcpAgeFrom call in the planner passes the plan date"
else
  fail "dcpAgeFrom called without the plan date (wall-clock dependency): ${BARE}"
fi

# ── W5.1 — cardio always credits the Cardio axis, in BOTH mappers ──────────
# plan.js (progGetExerciseAxis, selection reasoning) and execution.js
# (progExerciseToAxis, credit on save) each map an exercise to a progression
# axis. Both took the first primary muscle before falling back to category, so a
# run listing quads/hamstrings credited Legs and the Cardio axis never moved.
# Migration 0114 gives 72 cardio rows muscle data and would have spread that to
# every run. The two must also AGREE — a planner that reasons about one axis
# while the save credits another is a radar that lies.
AXIS=$(node --input-type=module -e '
import fs from "node:fs";
const out = [];
for (const [f, name] of [["functions/api/plan.js","progGetExerciseAxis"],["functions/api/execution.js","progExerciseToAxis"]]) {
  const src = fs.readFileSync(f,"utf8");
  const tbl = src.match(/const PROG_MUSCLE_TO_AXIS = \{[\s\S]*?\};/)?.[0];
  const fb  = src.match(/const PROG_CATEGORY_FALLBACK = \{[\s\S]*?\};/)?.[0];
  const fn  = src.match(new RegExp("function "+name+"\\(exercise\\) \\{[\\s\\S]*?\\n\\}"))?.[0];
  if (!tbl || !fb || !fn) { out.push(f+": mapper not found"); continue; }
  fs.writeFileSync("/tmp/_axis_guard.mjs", tbl+"\n"+fb+"\n"+fn+"\nexport { "+name+" as ax };");
  const { ax } = await import("/tmp/_axis_guard.mjs?"+Math.random());
  const run = ax({category:"cardio",   primary_muscles_json:JSON.stringify(["quads","hamstrings","calves","glutes"])});
  const sq  = ax({category:"strength", primary_muscles_json:JSON.stringify(["quads","glutes"])});
  const pu  = ax({category:"strength", primary_muscles_json:JSON.stringify(["chest","triceps"])});
  if (run !== "conditioning") out.push(f+": a run with leg muscles credits "+run+", not conditioning");
  if (sq !== "legs")          out.push(f+": a squat credits "+sq);
  if (pu !== "push")          out.push(f+": a push-up credits "+pu);
}
process.stdout.write(out.length ? out.join("; ") : "OK");' 2>&1)
if [ "$AXIS" = "OK" ]; then
  ok "cardio credits the Cardio axis in both plan.js and execution.js mappers"
else
  fail "axis mapping: ${AXIS}"
fi

# ── C-F18 / W1.1 — behavioural: run the planner and inspect the SESSION ────
# Every guard above reads source text. That is exactly what let R590 and R593
# ship inert for weeks: they printed their trace lines, their own unit guards
# passed, and no session changed. This runs the real planner over a fixture of
# real library rows and asserts on the steps it produces, which is the only
# thing a user ever sees.
#
# W1.1 widened it to a persona x property matrix: 35 personas (pregnancy T1-T3,
# postnatal incl. caesarean, perimenopause, military, run/cycling coach, BMI
# bands, injury, pain, recovery, time and kit extremes, DCP, de-load stack) x 8
# properties, each replanned across 60 dates because selection is a seeded
# shuffle. Run `node scripts/planner-behaviour.mjs --verbose` for the matrix.
BEHAV=$(node scripts/planner-behaviour.mjs 2>&1)
if [ "$BEHAV" = "OK" ]; then
  ok "planner behaviour: 41 personas x 9 properties x 60 dates hold end-to-end, nothing waived"
else
  fail "planner behaviour: ${BEHAV}"
fi

# ── W4 — the user override, at the request level ───────────────────────────
# "Being able to adapt to the user's preferences or circumstances is the core
# value of the app." The matrix proves what the planner does with custom steps
# and pins; this proves what POST /api/plan does with them, against an
# in-memory SQLite carrying the production day_plans DDL: unknown/inactive ids
# are 400, values are stored clamped, a user-authored plan survives every
# automatic regeneration (app open, check-in, adapt, force_assessment), an
# explicit replace relabels the row (every upsert writes generated_by), blocking
# safety notes are 409 until acknowledged, custom_steps are exempt from the
# C-G4 cap and pins are not.
OVERRIDE=$(node --no-warnings scripts/plan-override-requests.mjs 2>&1)
if [ "$OVERRIDE" = "OK" ]; then
  ok "user override (W4.1/W4.4): validation, clamping, survival, upsert relabel, safety ack, cap exemption hold over HTTP"
else
  fail "user override: ${OVERRIDE}"
fi

# ── W4.3 — saved trainings ("Mijn trainingen"), at the request level ────────
# Drives functions/api/my-sessions.js against in-memory SQLite built from
# migration 0117 itself: 401 without a session on every verb, unknown/inactive
# exercise ids are 400, another user's template cannot be read, updated or
# deleted, the 30-per-user cap holds, est_minutes matches the client's
# estimateMins, and apiClient.useMySession installs through the real POST
# /api/plan custom_steps path — generated_by='user', the template's exercise ids
# in order.
MYSESS=$(node --no-warnings scripts/my-sessions-requests.mjs 2>&1)
if [ "$MYSESS" = "OK" ]; then
  ok "saved trainings (W4.3): auth, validation, ownership, 30-cap and one-tap reuse via custom_steps hold over HTTP"
else
  fail "saved trainings: ${MYSESS}"
fi

# ── C-F17 — the self-assessment must be measurable and recordable ──────────
# dcp.last was read in four places and written by none, so the card sat at 0/19
# and R593/R594 biased toward a baseline that never existed. R598 schedules the
# measurement into the session; execution.js must write the result back, or the
# loop is open again and nothing downstream will ever see a number.
if grep -q "R598 —" functions/api/plan.js \
   && grep -q "recordDcpMeasurement" functions/api/execution.js \
   && grep -q "dcp.last = {" functions/api/execution.js; then
  ok "R598 schedules the self-assessment and execution.js writes dcp.last back"
else
  fail "the DCP measurement loop is open — nothing writes dcp.last, so the bias aims at a baseline that never updates"
fi

# A forced assessment must bypass the free daily plan cap. The cap exists so
# re-rolling for a nicer session is paid; measuring yourself is the input the
# whole DCP bias depends on, and gating it behind Pro would leave free users
# permanently biased toward a stale baseline.
if grep -q "!isPro && !bonus_session && !force_assessment" functions/api/plan.js; then
  ok "a forced self-assessment is exempt from the free daily plan cap"
else
  fail "force_assessment is not exempt from the C-G4 daily cap — free users could never re-measure"
fi

# The measurement set must not be volume-scaled: a number that has been scaled
# by sleep and experience is not comparable to a published norm.
if grep -q "measures" functions/api/plan.js \
   && grep -q "max_effort: true" functions/api/plan.js; then
  ok "measurement sets are emitted as max-effort, unscaled"
else
  fail "measurement steps are not marked max_effort — the recorded number would be a scaled target"
fi

# ── C-F16 — civilian sessions must not get Defence protocol work ───────────
# A fat_loss user with no equipment and primary_intent=general was handed three
# rucksack marches, because nothing ever filtered the `military` tag OUT — R572
# only filters the pool TO military for military sessions. The tag alone is not
# the discriminator (push-up, plank, squat and sit-up carry it), so R596 splits
# on protocol vs movement and must keep a floor so the pool cannot starve.
if grep -q "R596 —" functions/api/plan.js \
   && grep -q "civilian.length >= 3" functions/api/plan.js \
   && grep -q "!isMilCoachActive" functions/api/plan.js; then
  ok "R596 keeps Defence protocol work out of civilian sessions, with a pool floor"
else
  fail "R596 missing, ungated, or has no floor — military marches can reach a civilian plan"
fi

# R597 — one exercise per movement family. Three push-up variants is not a
# session. The family key must group the two shapes that actually went wrong.
FAM=$(node --input-type=module -e '
const { movementFamily: f } = await import("./functions/api/plan.js");
const errs = [];
if (f("push-up") !== f("knee-push-up"))   errs.push("push-up family not grouped");
if (f("push-up") !== f("incline-push-up"))errs.push("incline push-up not grouped");
if (f("marsen-6-km-u-30-minuten") !== f("marsen-6-km-u-40-minuten")) errs.push("marsen family not grouped");
if (f("burpee") === f("squat"))           errs.push("distinct movements collapsed");
process.stdout.write(errs.length ? errs.join("; ") : "OK");' 2>&1)
if [ "$FAM" = "OK" ]; then
  ok "R597 movement families group variants without collapsing distinct work"
else
  fail "R597 family key: ${FAM}"
fi

# ── C-F16 — a declared duration must survive the planner ───────────────────
# Migration 0112 gave every timed exercise a real base_duration_sec and marked
# the 70 whose NAME states the prescription as fixed_duration. If plan.js stops
# honouring that flag, "Marsen (6 km/u) - 40 minuten" gets volume-scaled again
# and the card contradicts the exercise title it is printing.
if grep -q "metrics.fixed_duration === true" functions/api/plan.js; then
  ok "named durations are exempt from volume scaling (metrics.fixed_duration)"
else
  fail "plan.js ignores metrics.fixed_duration — a 40-minute march will be scaled again"
fi

# R595 drops exercises longer than the whole session, but must never empty the
# pool: same discipline as R518. A budget smaller than anything available has to
# degrade to "keep what we had", not "no session".
if grep -q "R595 —" functions/api/plan.js \
   && grep -q "fits.length >= 3" functions/api/plan.js; then
  ok "R595 removes over-length exercises without ever starving the pool"
else
  fail "R595 missing or has no floor — a short budget could empty the exercise pool"
fi

# ── A-F1 — a planner rule's reorder must reach the session ─────────────────
# The session is _takeVaried(shuffled, count). `shuffled` is derived from ctx.pool
# once; any write to ctx.pool after that derivation is read by nobody. R590 and
# R593 both did exactly that and shipped inert for weeks: they printed their
# trace lines, their own unit guards passed, and they changed no session. A rule
# that cannot fail looks like coverage while providing none — so this asserts the
# structural property (does the write reach the selection?) rather than the
# rule's internal logic.
PLAN=functions/api/plan.js
SHUF=$(grep -n 'let shuffled = seededShuffle' "$PLAN" | head -1 | cut -d: -f1)
SLICE=$(grep -n '_takeVaried(shuffled, count' "$PLAN" | head -1 | cut -d: -f1)
if [ -z "$SHUF" ] || [ -z "$SLICE" ]; then
  fail "planner selection shape changed — cannot locate shuffled derivation or slice"
else
  DEADW=$(awk -v a="$SHUF" -v b="$SLICE" 'NR>a && NR<b && /ctx\.pool[[:space:]]*=/ {print NR}' "$PLAN")
  if [ -n "$DEADW" ]; then
    fail "ctx.pool written at line(s) $(echo $DEADW | tr '\n' ' ')— after shuffled is derived (L${SHUF}), so the session (L${SLICE}) never sees it"
  else
    ok "no planner rule writes ctx.pool after the selection list is derived"
  fi
fi

# ── W3.4 — a de-load may only ever LOWER volume ────────────────────────────
# R536 assigned `ctx.volumeMultiplier = 0.8`, so on a day another rule had
# already set 0.75 it would RAISE volume on a worse day. Every rule that lowers
# volume must take the minimum; the only other write allowed is the R521
# follicular boost (`*=`). No current rule combination makes the old assignment
# observable in a session (R558 is skipped in pregnancy, R511 is 0.85), so this
# is a source guard: a behavioural test could not fail on it.
VMBAD=$(grep -nE 'ctx\.volumeMultiplier[[:space:]]*=[^=]' functions/api/plan.js | grep -v 'Math\.min(ctx\.volumeMultiplier' || true)
if [ -n "$VMBAD" ]; then
  fail "ctx.volumeMultiplier assigned without Math.min — a de-load could raise volume: $(echo "$VMBAD" | cut -c1-120 | tr '\n' ' ')"
else
  ok "every de-load lowers ctx.volumeMultiplier with Math.min (never assigns over a lower value)"
fi

# ── A-E2 — a config-driven cap must fail closed ────────────────────────────
# The early-bird cap moved from a constant into platform_config. If that row is
# missing or unreadable the offer must fall back to a finite number, never to
# unlimited — a silently uncapped launch offer is a revenue bug that looks like
# nothing at all.
if grep -q "EARLY_BIRD_CAP_FALLBACK" functions/api/subscribe.js \
   && grep -q "return EARLY_BIRD_CAP_FALLBACK" functions/api/subscribe.js; then
  ok "early-bird cap falls back to a finite value when platform_config is unreadable"
else
  fail "early-bird cap has no finite fallback — a missing config row would uncap the offer"
fi

# ── C-F3 — exercise purpose labels must all translate ──────────────────────
# deriveExerciseWhy() previously returned raw English literals without passing
# through t(), so Dutch users saw English whatever their language setting. The
# purpose keys now go through t(); this asserts every one has an NL entry, and
# that the dictionary has no duplicate keys (a later duplicate silently shadows
# an earlier one).
I18N=$(node --input-type=module -e '
import fs from "node:fs";
import { WHY_PURPOSE } from "./functions/api/_shared/exerciseWhy.js";
const src = fs.readFileSync("packages/client-app/src/i18n.js", "utf8");
const keys = [...src.matchAll(/^  [\x27"]([^\x27"]+)[\x27"]:/gm)].map(m => m[1]);
const set = new Set(keys);
const errs = [];
const missing = Object.values(WHY_PURPOSE).filter(v => !set.has(v));
if (missing.length) errs.push("no NL entry for: " + missing.join(", "));
if (!set.has("and")) errs.push("no NL entry for the joining word \"and\"");
const dup = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
if (dup.length) errs.push("duplicate NL keys: " + dup.join(", "));
process.stdout.write(errs.length ? errs.join("; ") : "OK (" + keys.length + " keys)");
' 2>&1)
case "$I18N" in
  OK*) ok "every exercise purpose label translates — $I18N" ;;
  *)   fail "i18n: ${I18N}" ;;
esac

# ── S-3 — Strava webhook correctness ───────────────────────────────────────
# The subscription challenge must be gated on the verify token: without it anyone
# can point Strava at our endpoint. And POST must stay idempotent + always 200,
# because Strava retries.
if [ -f functions/api/webhooks/strava.js ]; then
  if grep -q "STRAVA_WEBHOOK_VERIFY_TOKEN" functions/api/webhooks/strava.js; then
    ok "strava webhook gates the subscription challenge on a verify token"
  else
    fail "strava webhook echoes hub.challenge without checking the verify token"
  fi
  if grep -qE "onRequestPost[\s\S]{0,40}" functions/api/webhooks/strava.js \
     && ! grep -A200 "export async function onRequestPost" functions/api/webhooks/strava.js | grep -qE "status: (4|5)[0-9][0-9]"; then
    ok "strava webhook POST always answers 200 (Strava retries on failure)"
  else
    fail "strava webhook POST can answer non-200 — Strava will retry it"
  fi
fi

# ── X-7 — webhook handlers must never invite retries ───────────────────────
# A webhook endpoint that answers non-200 gets retried. On a logging endpoint that
# turns one failure into a storm and helps nobody, so both handlers answer 200
# unconditionally and log instead. Also asserts the Resend handler actually checks
# a signature rather than trusting the caller.
if [ -f functions/api/webhooks/resend.js ]; then
  if grep -qE 'status: (4|5)[0-9][0-9]' functions/api/webhooks/resend.js; then
    fail "resend webhook can answer non-200 — that invites a retry storm"
  else
    ok "resend webhook always answers 200"
  fi
  if grep -q "verifySvix" functions/api/webhooks/resend.js && grep -q "TOLERANCE_SEC" functions/api/webhooks/resend.js; then
    ok "resend webhook verifies the Svix signature and rejects replays"
  else
    fail "resend webhook is missing signature verification or replay tolerance"
  fi
fi

# ── C-B20 — no equipment option the planner cannot satisfy ─────────────────
# A user ticks an option in onboarding and the planner has nothing behind it: a
# broken promise at the first interaction. X-36 swept these once, and exercise_mat
# survived by being a duplicate rather than an absence. This compares the options
# offered against the vocabulary the planner actually resolves, so the next dead
# option fails the build instead of reaching onboarding.
EQ=$(node --input-type=module -e '
import fs from "node:fs";
const consts = fs.readFileSync("packages/client-app/src/appConstants.js","utf8");
const plan   = fs.readFileSync("functions/api/plan.js","utf8");
const block  = consts.match(/export const ALL_EQUIPMENT = \[([\s\S]*?)\n\];/)[1];
const offered = [...block.matchAll(/value:\s*"([a-z_]+)"/g)].map(m => m[1]);
const list = (n) => {
  const m = plan.match(new RegExp("const " + n + " = \\[([\\s\\S]*?)\\];"));
  return m ? [...m[1].matchAll(/.([a-z_]+)./g)].map(x => x[1]) : [];
};
const known = new Set([...list("HOME_EQUIPMENT"), ...list("GYM_ONLY_EQUIPMENT"), ...list("CYCLING_EQUIPMENT")]);
const orphans = offered.filter(o => !known.has(o));
const dupes = offered.filter((o,i) => offered.indexOf(o) !== i);
const errs = [];
if (orphans.length) errs.push("options the planner cannot resolve: " + orphans.join(","));
if (dupes.length) errs.push("duplicate options: " + dupes.join(","));
process.stdout.write(errs.length ? errs.join("; ") : "OK (" + offered.length + " options)");
' 2>&1)
case "$EQ" in
  OK*) ok "every equipment option is resolvable by the planner — $EQ" ;;
  *)   fail "equipment vocabulary: ${EQ}" ;;
esac

# ── C-F9 — location profiles must never starve the pool ────────────────────
# R518's history: a parallel GYM_EQUIPMENT list once made "at the gym" drop 52
# exercises and add one. Profiles reintroduce that risk per location, so R518 now
# keeps the wider pool whenever a profile resolves fewer than 3 exercises. These
# assert the floor exists and that gym still resolves as a superset of home.
if grep -q "_next.length >= 3" functions/api/plan.js; then
  ok "R518 keeps the wider pool when a location resolves too few exercises"
else
  fail "R518 lost its minimum-pool floor — a narrow profile can empty a session"
fi

if grep -q "equipment_profile_id ?? (checkIn?.gym_today ? 'gym' : null)" functions/api/plan.js; then
  ok "R518 still accepts gym_today from cached clients"
else
  fail "R518 dropped gym_today back-compat — an offline client would silently lose gym access"
fi

# ── R590 — recovery bias must never starve the selection ───────────────────
# On a day when every muscle is fatigued the right answer is "train the least
# fatigued thing", not "train nothing". R590 is a reorder, never a filter; if it
# ever becomes a filter, a consistent trainer gets an empty session. It reorders
# `shuffled` (the list the session is sliced from), not ctx.pool — see A-F1.
R590=$(node --input-type=module -e '
import fs from "node:fs";
const src = fs.readFileSync("functions/api/plan.js","utf8");
const m = src.match(/  \/\/ R590 — C-F7[\s\S]*?\n  \}\n/);
if (!m) { process.stdout.write("MISSING"); }
else {
  if (!/shuffled\s*=/.test(m[0])) { process.stdout.write("R590 no longer writes `shuffled` — its reorder cannot reach the session"); }
  else {
  fs.writeFileSync("/tmp/_r590_guard.mjs",
   "export function r590(ctx, shuffled){ const FATIGUE_THRESHOLD=40; const _addNote=(c,n)=>(c.sessionNotes??=[]).push(n);\n"
   + m[0] + "\nreturn { shuffled, fatiguedIds };\n}");
  const { r590 } = await import("/tmp/_r590_guard.mjs?t=" + Date.now());
  const ex = (id,f) => ({id,name:"e"+id,muscle_freshness:f,category:"strength"});
  const errs = [];
  const ctx = () => ({slot_type:"main",trace:[],sessionNotes:[]});
  const a = r590(ctx(), [ex(1,5),ex(2,9),ex(3,14)]);
  if (a.shuffled.length !== 3) errs.push("selection shrank when everything was fatigued");
  const b = r590(ctx(), [ex(1,12),ex(2,90)]);
  if (b.shuffled.length !== 2) errs.push("selection shrank on mixed fatigue");
  if (b.shuffled[0].muscle_freshness !== 90) errs.push("fresh exercise was not promoted");
  if (!b.fatiguedIds.has(1)) errs.push("fatiguedIds not exported for R593 to respect");
  process.stdout.write(errs.length ? errs.join("; ") : "OK");
  }
}' 2>&1)
if [ "$R590" = "OK" ]; then
  ok "R590 reorders the selection by fatigue without ever shrinking it"
else
  fail "R590: ${R590}"
fi

# ── C-F10 — superset pairing guard ─────────────────────────────────────────
# Pairing two exercises that share a primary muscle is not a superset — it is a
# drop set that compromises both. This asserts the overlap check still holds, and
# that pairing stays off when no time budget forces it.
SS=$(node --input-type=module -e '
import fs from "node:fs";
const src = fs.readFileSync("functions/api/plan.js","utf8");
const m = src.match(/function _applySupersets[\s\S]*?\n\}\n/);
if (!m) { process.stdout.write("MISSING"); }
else {
  fs.writeFileSync("/tmp/_ss_guard.mjs",
    m[0].replace("function _applySupersets","export function _applySupersets")
    + "\nfunction _addNote(ctx,n){ (ctx.sessionNotes ??= []).push(n); }\n");
  const { _applySupersets } = await import("/tmp/_ss_guard.mjs?t=" + Date.now());
  const mk = (n,p) => ({name:n,category:"strength",sets:3,target_reps:10,rest_sec:60,
    tags_json:"[]",primary_muscles_json:JSON.stringify(p)});
  const legsOnly = [mk("Squat",["quads","glutes"]),mk("Lunge",["quads","glutes"]),
                    mk("Step-up",["quads"]),mk("Leg press",["quads"])];
  const paired = _applySupersets({checkIn:{time_budget:15},trace:[],sessionNotes:[]},
    JSON.parse(JSON.stringify(legsOnly))).filter(s => s.group_id).length;
  const noBudget = _applySupersets({checkIn:{},trace:[],sessionNotes:[]},
    JSON.parse(JSON.stringify(legsOnly))).filter(s => s.group_id).length;
  const errs = [];
  if (paired > 0) errs.push("paired exercises sharing a primary muscle");
  if (noBudget > 0) errs.push("paired with no time budget set");
  process.stdout.write(errs.length ? errs.join("; ") : "OK");
}' 2>&1)
if [ "$SS" = "OK" ]; then
  ok "supersets never pair a shared primary muscle, and stay off without a time budget"
else
  fail "superset pairing regression: ${SS}"
fi

# ── C-F6 — load model guards ───────────────────────────────────────────────
# Bodyweight work must never score differently than it did before load existed.
# progLoadMultiplier returning anything but exactly 1.0 for an unlogged set would
# silently re-baseline every existing user's progression.
LOAD_MULT=$(node --input-type=module -e '
const src = await import("node:fs").then(m => m.readFileSync("functions/api/execution.js","utf8"));
const m = src.match(/function progLoadMultiplier\(actual\) \{[\s\S]*?\n\}/);
if (!m) { process.stdout.write("MISSING"); }
else {
  const fn = new Function("actual", m[0].replace(/^function progLoadMultiplier\(actual\) \{/, "").replace(/\}$/, "")
    .replace("PROG_LOAD_REFERENCE_KG", "20").replace("PROG_LOAD_MAX_MULT", "2.5"));
  const cases = [[{}, 1], [{weight_kg: []}, 1], [{weight_kg: [0,0]}, 1], [{weight_kg: [20]}, 1]];
  const bad = cases.filter(([a, want]) => Math.abs(fn(a) - want) > 1e-9);
  process.stdout.write(bad.length ? "DRIFT" : "OK");
}' 2>&1)
if [ "$LOAD_MULT" = "OK" ]; then
  ok "progLoadMultiplier is exactly 1.0 for unweighted sets (no silent re-baseline)"
else
  fail "progLoadMultiplier changed unweighted scoring (${LOAD_MULT}) — existing history would shift"
fi

# An exercise needing no equipment must never ask for a weight.
if [ -f migrations/0107_exercise_load.sql ]; then
  if grep -q "rucksack" migrations/0107_exercise_load.sql && ! grep -qE "^UPDATE.*load_type.*rucksack" migrations/0107_exercise_load.sql; then
    ok "0107 documents why rucksack is excluded from the load vocabulary"
  else
    fail "0107 must document the rucksack exclusion (march weight comes from MIL_MARCH_KG)"
  fi
fi

# ── C-F7 — muscle vocabulary guards ────────────────────────────────────────
# The library vocabulary is uncontrolled (100 distinct values). Anything the map
# cannot resolve is dropped in silence, which looks identical to "that muscle was
# not worked" — so a new exercise using an unmapped synonym degrades the recovery
# map with no error anywhere. These assert the two halves stay reconcilable.
MUSCLE_CHECK=$(node --input-type=module -e '
import { MUSCLE_REGIONS, REGION_TIER, REGION_LABELS_NL } from "./functions/api/_shared/muscles.js";
import fs from "fs";
const src = fs.readFileSync("packages/client-app/src/MuscleMap.jsx", "utf8");
const ids = new Set();
for (const m of src.matchAll(/^  "([a-z_-]+)":/gm)) ids.add(m[1]);
const regions = new Set(MUSCLE_REGIONS);
const errs = [];
for (const r of regions) if (!ids.has(r)) errs.push("region not drawn: " + r);
for (const i of ids) if (!regions.has(i)) errs.push("SVG group has no region: " + i);
for (const r of MUSCLE_REGIONS) {
  if (!REGION_TIER[r]) errs.push("no recovery tier: " + r);
  if (!REGION_LABELS_NL[r]) errs.push("no label: " + r);
}
process.stdout.write(errs.length ? errs.join("; ") : "OK");
' 2>&1)
if [ "$MUSCLE_CHECK" = "OK" ]; then
  ok "muscle regions, SVG groups, tiers and labels are all in step"
else
  fail "muscle vocabulary mismatch: ${MUSCLE_CHECK}"
fi

# Match the declaration, not the word — the file explains in a comment why the
# old ALIASES table was removed, and a bare grep flags its own documentation.
if grep -qE "^\s*(const|let|var)\s+ALIASES" packages/client-app/src/MuscleMap.jsx; then
  fail "MuscleMap.jsx still has a local ALIASES table — vocabulary must come from _shared/muscles.js"
else
  ok "MuscleMap.jsx has no local muscle vocabulary"
fi

# ── X-28 — migration number drift guard ────────────────────────────────────
# The documented "next valid migration number" has drifted twice (docs claimed
# 0089 and 0099 long after 0106 was applied). A stale number means a new
# migration either collides with an applied one or silently never runs. The
# filesystem is the only source of truth; this asserts the docs agree with it.
REAL_NEXT=$(printf "%04d" $((10#$(ls migrations/*.sql | sed 's|.*/||; s|_.*||' | sort -n | tail -1) + 1)))
DOC_NEXT=$(grep -oE 'next valid number: `0[0-9]{3}`' ../CLAUDE.md | grep -oE '0[0-9]{3}' | head -1)
if [ -z "$DOC_NEXT" ]; then
  fail "root CLAUDE.md has no parseable 'next valid number' — the migration ledger is the release gate"
elif [ "$REAL_NEXT" != "$DOC_NEXT" ]; then
  fail "migration number drift: migrations/ implies ${REAL_NEXT}, root CLAUDE.md says ${DOC_NEXT}"
else
  ok "migration ledger matches migrations/ (next valid: ${REAL_NEXT})"
fi

# ── W6.2 — CLAUDE.md schema section names only tables that exist ───────────
# CLAUDE.md documented auth_users, support_tokens and user_profile as live tables
# long after they were dropped; 69 real tables went unmentioned. Every table named
# in the "Database Schema" section (a bolded name followed by " — ") must be in the
# live table list. Runs offline against scripts/known-tables.txt.
# To regenerate the fixture after a migration adds/drops a table (read-only):
#   npx wrangler d1 execute justfit-db --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
#   then write the sorted names as a JSON array to scripts/known-tables.txt
SCHEMA_GHOSTS=$(node --input-type=module -e '
import fs from "node:fs";
const live = new Set(fs.readFileSync("scripts/known-tables.txt","utf8").split("\n").map(s=>s.trim()).filter(Boolean));
const doc = fs.readFileSync("CLAUDE.md","utf8");
const start = doc.indexOf("## Database Schema (D1");
const end = doc.indexOf("\n## ", start + 5);
if (start < 0) { console.log("NO-SECTION"); process.exit(0); }
const section = doc.slice(start, end < 0 ? undefined : end);
const named = [...section.matchAll(/^(?:- )?\*\*([a-z_][a-z0-9_]*)\*\* — /gm)].map(m => m[1]);
if (named.length < 10) { console.log("TOO-FEW:" + named.length); process.exit(0); }
console.log(named.filter(t => !live.has(t)).join(", "));
')
if [ -z "$SCHEMA_GHOSTS" ]; then
  ok "CLAUDE.md schema section names only live tables"
else
  fail "CLAUDE.md schema section names tables not in scripts/known-tables.txt: ${SCHEMA_GHOSTS}"
fi

# Rate-limit check — disabled by default (hits live DB, takes ~5s)
# Run separately before UAT or after auth changes: npm run smoke:ratelimit

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "── Result ────────────────────────────────────────────────────────────"
echo "  Passed: ${PASS}  Failed: ${FAIL}"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "  SMOKE FAILED — do not deploy until failures are resolved."
  exit 1
else
  echo "  All checks passed — safe to deploy."
fi
