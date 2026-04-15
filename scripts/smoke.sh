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

# Rate limit sanity: rapid fire 25 login attempts should eventually return 429
echo "  (skipping rate-limit test in smoke — run manually if needed)"

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
