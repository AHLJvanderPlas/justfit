# JustFit — Pre-Release Smoke Checklist

Run `npm run smoke` first. Then work through this manual checklist before deploying.

---

## Automated (npm run smoke)

- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run build` — succeeds, outputs `dist/`
- [ ] `/api/ping` → HTTP 200
- [ ] `/api/auth` (no token) → HTTP 401 (not 500)
- [ ] `/api/plan` (no token) → HTTP 401
- [ ] `/api/exercises` → HTTP 200

## Rate-limit check (npm run smoke:ratelimit — optional, run before UAT or after auth changes)

Fires 11 bad login attempts against `smoke_test@justfit.cc`. The per-email limit is 10/hr,
so attempt 11 must return 429.

- [ ] `npm run smoke:ratelimit` — all 11 attempts logged, 429 seen by attempt 11

**Side effect**: consumes ~11 slots in `auth_rate_limits` for the canary email. Clears automatically after 1 hour. To clear immediately:

```bash
npx wrangler d1 execute justfit-db --remote --command "DELETE FROM auth_rate_limits WHERE bucket LIKE '%smoke_test%';"
```

---

## Manual — Auth flow

- [ ] Sign up with a new email — welcome email received
- [ ] Log in with password
- [ ] Log in with magic link (request link, click from email)
- [ ] Log in with passkey / Face ID (if registered)
- [ ] Forgot password → reset email received → password updated → login works
- [ ] Wrong password 11× → 429 rate limit response

---

## Manual — Onboarding & check-in

- [ ] First-time user completes full onboarding (goal → body → equipment → cycle)
- [ ] Daily check-in modal appears for returning user
- [ ] "Skip" generates a plan from settings alone
- [ ] Pain scope = "specific" + areas selected → injury-filtered plan
- [ ] Check-in with period_today → cycle logged

---

## Manual — Plan generation

- [ ] Today's plan generates successfully (session card visible)
- [ ] Plan adapts to check-in (e.g. low energy → volume reduced)
- [ ] `AdaptationChip` and "Why this plan?" panel appear when rules fire
- [ ] Blocking safety banner appears for postnatal clearance gate (R539)
- [ ] Regenerating plan after delete works (no 500)

---

## Manual — Workout execution

- [ ] Start workout → instruction cards → working phase → rest timer → next exercise
- [ ] Tap rep zone → rep counted, vibration fires
- [ ] "All reps done" shortcut skips to rest
- [ ] Difficulty adjustment (±2 reps / ±10s) persists across sets
- [ ] Substitute exercise → loads alternatives, swap works
- [ ] Session feedback (Too hard / Just right / Too easy / Skip)
- [ ] Post-workout: score updates, history entry appears

---

## Manual — History & account

- [ ] History tab shows past sessions
- [ ] Delete session (type DELETE to confirm) → removed, today reset if needed
- [ ] Bonus session generates and saves
- [ ] Settings: profile update (name, weight, goal) saves correctly
- [ ] Accent colour change applies immediately and persists across reload
- [ ] Email change flow: request → code in email → verified, new token issued
- [ ] Delete account → all data wiped, redirected to login

---

## Deploy command (after checklist passes)

```bash
git add . && git commit -m "chore: pre-release" && git push
npm run build && npx wrangler pages deploy dist --project-name=justfit --branch=main
```
