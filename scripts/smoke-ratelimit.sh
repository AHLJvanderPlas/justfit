#!/usr/bin/env bash
# JustFit rate-limit smoke test
# Usage: npm run smoke:ratelimit
#
# WHEN TO RUN:
#   - Before UAT (once, to verify abuse protection is live)
#   - After any changes to auth.js rate-limiting logic
#
# WHAT IT DOES:
#   Fires 11 bad login attempts against a canary email.
#   The per-email limit is 10/hr, so attempt 11 must return 429.
#   Uses smoke_test@justfit.cc — not a real account, no data at risk.
#
# SIDE EFFECT:
#   Consumes ~11 slots in auth_rate_limits for smoke_test@justfit.cc.
#   The sliding window resets after 1 hour. To clear immediately:
#   npx wrangler d1 execute justfit-db --remote \
#     --command "DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';"

set -e
PROD="https://justfit.cc"
EMAIL="smoke_test@justfit.cc"
PASS=0; FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "── Rate-limit smoke (${PROD}) ────────────────────────────────────────"
echo "  Sending 11 bad login attempts for ${EMAIL} …"
echo "  (per-email limit: 10/hr — attempt 11 must be 429)"
echo ""

got_429=0

for i in $(seq 1 11); do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${PROD}/api/auth" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"login\",\"email\":\"${EMAIL}\",\"password\":\"smoke_wrong_pw_${i}\"}")
  echo "  attempt ${i}: HTTP ${status}"
  if [ "$status" = "429" ]; then
    got_429=1
  fi
done

echo ""
if [ "$got_429" = "1" ]; then
  ok "rate limit triggered — 429 received before attempt 12"
else
  fail "rate limit NOT triggered — 11 attempts passed without 429"
fi

echo ""
echo "── Result ─────────────────────────────────────────────────────────────"
echo "  Passed: ${PASS}  Failed: ${FAIL}"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "  RATE-LIMIT SMOKE FAILED."
  echo "  To clear test bucket:"
  echo "  npx wrangler d1 execute justfit-db --remote --command \"DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';\""
  exit 1
else
  echo "  Rate-limit protection confirmed."
  echo ""
  echo "  To clear test bucket (optional):"
  echo "  npx wrangler d1 execute justfit-db --remote --command \"DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';\""
fi
