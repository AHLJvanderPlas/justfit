#!/usr/bin/env bash
# JustFit rate-limit smoke test
# Usage: npm run smoke:ratelimit
#
# WHEN TO RUN:
#   - Before UAT (once, to verify abuse protection is live)
#   - After any changes to auth.js rate-limiting logic
#
# WHAT IT ASSERTS:
#   - Attempts 1–10  → NOT 429 (any other status is fine: 401, 400, etc.)
#   - Attempt 11     → exactly 429
#   The per-email limit is 10/hr; attempt 11 must trip it.
#
# SIDE EFFECT:
#   Consumes ~11 slots in auth_rate_limits for smoke_test@justfit.cc.
#   Clears automatically after 1 hour. To clear immediately:
#   npx wrangler d1 execute justfit-db --remote \
#     --command "DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';"

PROD="https://justfit.cc"
EMAIL="smoke_test@justfit.cc"
PASS=0; FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "── Rate-limit smoke (${PROD}) ────────────────────────────────────────"
echo "  Email: ${EMAIL}"
echo "  Expecting: attempts 1–10 → non-429, attempt 11 → 429"
echo ""

for i in $(seq 1 11); do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${PROD}/api/auth" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"login\",\"email\":\"${EMAIL}\",\"password\":\"smoke_wrong_pw_${i}\"}")

  if [ "$i" -le 10 ]; then
    if [ "$status" = "429" ]; then
      fail "attempt ${i}: got 429 too early (expected non-429, got ${status})"
    else
      ok "attempt ${i}: ${status} (non-429)"
    fi
  else
    if [ "$status" = "429" ]; then
      ok "attempt ${i}: 429 — rate limit triggered correctly"
    else
      fail "attempt ${i}: expected 429, got ${status} — rate limit NOT enforced"
    fi
  fi
done

echo ""
echo "── Result ─────────────────────────────────────────────────────────────"
echo "  Passed: ${PASS}  Failed: ${FAIL}"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "  RATE-LIMIT SMOKE FAILED."
  echo ""
  echo "  To clear test bucket:"
  echo "  npx wrangler d1 execute justfit-db --remote --command \"DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';\""
  exit 1
else
  echo "  Rate-limit protection confirmed — clean boundary at attempt 11."
  echo ""
  echo "  To clear test bucket (optional, auto-clears in 1h):"
  echo "  npx wrangler d1 execute justfit-db --remote --command \"DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';\""
fi
