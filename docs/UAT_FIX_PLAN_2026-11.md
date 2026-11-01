# UAT follow-up plan — fix the five defects, then the improvements (2026-11-01)

Source: `docs/UAT_PERSONAS_2026-11.md` (30-persona UAT). Status line at the bottom.

## Release 1 — the five day-one defects (D1–D5), one release

House rules apply: no new inline styles; Dutch through `t()`; `App.jsx` stays at or under 1800
lines (`APP_CEILING`), `plan.js` at or under 3688, `onRequestPost` at or under 99; every new guard
is broken once to prove it fails; `npm test && npm run release` green before merge.

### D1 — cancel crash
- `WorkoutView.jsx`: import `Glass` from `./uiComponents.jsx`.
- Lint guard for the class: `eslint-plugin-react` with only `react/jsx-no-undef` as an error in
  `packages/client-app/eslint.config.js` (not the full recommended set). Proof: remove the import,
  `npm run lint` fails, restore.
- e2e: start a session → "← Cancel" → "Quit workout?" → "Quit" → Today with "START SESSION", no
  "Something went wrong".

### D2 — service worker blocked by CSP
- `public/_headers`: `worker-src 'self'`.
- e2e: no console message containing "Content Security Policy" during the core journey, and
  `navigator.serviceWorker.getRegistration()` resolves after load.
- Smoke: `_headers` must contain `worker-src 'self'` and must not contain `worker-src 'none'`.

### D3 — a path choice is not applied until reload
- After `PathChoiceModal` saves: refetch the profile, merge `preferences` into state, regenerate
  today's plan with the entitlement state. New request flag `path_change: true`, exempt from the
  free daily cap in `decideExistingPlan` (reason `path_change`; a one-time event per path change,
  not a re-roll; `preserve` still wins). Decision-table test + harness case.
- Keep `App.jsx` under the ceiling: the apply logic lives in a small module (e.g. `src/pathApply.js`).
- e2e: signup → Running path → Today shows the running coach card without a reload; Settings →
  Your coach / Doel & coach shows RUNNING as the path.

### D4 — check-in signals never reach the session
- Client: every `prefs.isPro` read in `App.jsx` (840, 867, 876, 885, 891, 1100, 1109) becomes the
  entitlement state (`isPro` / `isProRef.current`); the `preferences.isPro` merges go.
- Server: a plan request without `checkin` (and without `adapt_mode`) uses today's stored
  `daily_checkins` row for the user, rebuilt into the shape the client sends (numeric columns +
  `checkin_json` toggles), so no later regeneration can drop the check-in. Lives in `_shared/`
  (ceilings). Harness case: no `checkin` in the body, stored row with `recovery_mode: true` →
  R559 in the trace.
- e2e: fresh user, check-in chip "Taking it easy" → Today is a recovery session (LOW, R559 label in
  "Why this plan?").

### D5 — day-1 trial users meet the paywall
- Fetch `/api/subscribe` at mount as soon as the session is known; `entitlementKnown` state.
- `PathChoiceModal`: `locked = entitlementKnown && !isPro && key === 'cycling'`; the modal is not
  rendered before the entitlement is known (or failed).
- Account sub-view: never print "Nog  dagen"; without `ends_at_ms` print "Proefperiode actief".
- Rewrite `journey-billing.spec.js` (a): a fresh signup is trialing → Cycling is NOT locked and
  opens its follow-up; then expire the trial in the local D1 (`UPDATE entitlements SET ends_at_ms =
  1, status = 'expired' WHERE user_id = ?`, via `wrangler d1 execute --local --persist-to
  .wrangler/e2e-state`, pattern in `scripts/uat/uat.mjs` `flowSqlReturn`) → reload → "Pro vereist"
  → paywall.

Proof after merge: `node scripts/uat/uat.mjs p02-mark p05-daan p08-fleur p09-tim p20-marieke
p28-mohammed` → 0 app failures, coach card on Daan/Fleur/Tim, recovery session for Mohammed.

## Release 2+ — improvements (advice; see `docs/UAT_IMPROVEMENT_PLAN_2026-11.md`)

Status: release 1 LIVE — commit d2f8fc7, deployed 2026-11-01 14:09 (vitest 428 + shared 20, smoke 99, e2e 21); replay of p02/p05/p08/p09/p16/p20/p28 → 0 app failures. Release 2+ is `docs/UAT_IMPROVEMENT_PLAN_2026-11.md`.
