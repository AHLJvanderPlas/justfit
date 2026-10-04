// One definition of "this user has Pro right now", for every Pages Function.
//
// Before F8 there were three: plan.js and subscribe.js accepted status 'grace'
// and any product_code; execution.js and subscribe-push.js copied the pattern in
// CLAUDE.md, which rejected 'grace' and listed product codes. The billing code
// settles which is right:
//
//   status 'grace'  webhooks/mollie-consumer.js sets it when a recurring payment
//                   fails, with ends_at_ms = now + 7 days, and emails the customer
//                   "Je hebt nog 7 dagen toegang terwijl we het opnieuw proberen".
//                   Grace is still entitled; ends_at_ms closes it.
//   product_code    is not a Pro/not-Pro signal. Mollie writes the plan key
//                   (pro_monthly, pro_annual, pro_monthly_eb, pro_annual_eb — see
//                   PLANS in subscribe.js); trials write pro_trial; referral, the
//                   B2B2C trainer grant and the admin grant write pro_consumer.
//                   The documented list ('pro','pro_consumer','pro_trial',
//                   'trainer_grant') excluded every paying subscriber, and two of
//                   its values are never written ('trainer_grant' is a source).
//                   The guest row (justfit_trial, trialing) has no ends_at_ms and
//                   so never passes the window below.
//
// Every row in entitlements is a Pro product; what makes one count is its status
// and its window. scripts/smoke.sh fails on any other entitlement-window query
// under functions/ — import this instead.

export async function isProUser(env, userId, now = Date.now()) {
  if (!userId) return false;
  const row = await env.DB.prepare(
    `SELECT 1 FROM entitlements
      WHERE user_id = ?
        AND status IN ('active', 'trialing', 'grace')
        AND ends_at_ms > ?
      LIMIT 1`
  ).bind(userId, now).first();
  return !!row;
}
