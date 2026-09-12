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
