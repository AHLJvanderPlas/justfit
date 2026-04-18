#!/usr/bin/env bash
# JustFit pre-deploy smoke check
# Usage: npm run smoke
# Runs lint + build then sanity-checks the live API endpoints.

set -e
PROD="https://justfit.cc"
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

# Confirm App.jsx uses LEGAL_VERSIONS constant instead of bare string literals
if grep -q "LEGAL_VERSIONS" src/App.jsx; then
  ok "App.jsx uses LEGAL_VERSIONS constant"
else
  fail "App.jsx has hardcoded version strings in acceptTerms call"
fi

# Confirm App.jsx terms gate is fail-closed (no silent catch that dismisses gate)
if grep -q "setTermsAcceptError" src/App.jsx; then
  ok "App.jsx terms gate is fail-closed"
else
  fail "App.jsx terms gate catch block may dismiss gate on error"
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
