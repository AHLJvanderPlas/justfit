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
const sqlish = /\b(SELECT|INSERT|UPDATE|DELETE)\b/i;
const tbl = /\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z0-9_]{2,})/gi;
const noise = new Set(["select","set","where","values","json_each"]);
const bad = [];
for (const f of files) {
  const src = fs.readFileSync(f,"utf8");
  for (const m of src.matchAll(/`([^`]*)`/g)) {
    const lit = m[1];
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

# ── R590 — recovery bias must never starve the pool ────────────────────────
# On a day when every muscle is fatigued the right answer is "train the least
# fatigued thing", not "train nothing". R590 is a reorder, never a filter; if it
# ever becomes a filter, a consistent trainer gets an empty session.
R590=$(node --input-type=module -e '
import fs from "node:fs";
const src = fs.readFileSync("functions/api/plan.js","utf8");
const m = src.match(/  \/\/ R590 — C-F7[\s\S]*?\n  \}\n/);
if (!m) { process.stdout.write("MISSING"); }
else {
  fs.writeFileSync("/tmp/_r590_guard.mjs",
   "export function r590(ctx){ const FATIGUE_THRESHOLD=40; const _addNote=(c,n)=>(c.sessionNotes??=[]).push(n);\n"
   + m[0] + "\n}");
  const { r590 } = await import("/tmp/_r590_guard.mjs?t=" + Date.now());
  const ex = (id,f) => ({id,name:"e"+id,muscle_freshness:f,category:"strength"});
  const errs = [];
  const allTired = {pool:[ex(1,5),ex(2,9),ex(3,14)],slot_type:"main",trace:[],sessionNotes:[]};
  r590(allTired);
  if (allTired.pool.length !== 3) errs.push("pool shrank when everything was fatigued");
  const mixed = {pool:[ex(1,12),ex(2,90)],slot_type:"main",trace:[],sessionNotes:[]};
  r590(mixed);
  if (mixed.pool.length !== 2) errs.push("pool shrank on mixed fatigue");
  if (mixed.pool[0].muscle_freshness !== 90) errs.push("fresh exercise was not promoted");
  process.stdout.write(errs.length ? errs.join("; ") : "OK");
}' 2>&1)
if [ "$R590" = "OK" ]; then
  ok "R590 reorders by fatigue without ever shrinking the exercise pool"
else
  fail "R590 regression: ${R590}"
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
