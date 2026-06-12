# Lean & Clean Improvement Plan (2026-05-30)

Execute phases in order. One item per deploy cycle (CLAUDE.md build workflow applies:
assess → build → `npm test && npm run smoke` → deploy → commit → docs).
Mark items `[x]` here in the same commit that ships them.
HARD GATE: Phase 4 must not start until Phase 3 E2E suite is green in CI/local.

## Phase 1 — Quick wins (no structural risk)

- [x] 1.1 Extract duplicated NL date formatter (`fmtSessionTime`/`fmtAvailTime` in CoachView)
      into `fmtDateNL(ms)` in `packages/client-app/src/planUtils.js`; replace both call sites.
- [x] 1.2 Route the ~8 stray `fetch('/api…')` calls in App.jsx + SettingsView through
      `apiClient.js` methods (add methods where missing, keep response shapes identical).
- [x] 1.3 Delete orphan `packages/trainer-app/` workspace; remove from root package.json
      workspaces if listed; regenerate package-lock; verify `npm test && npm run smoke`.
- [ ] 1.4 Verify no live route depends on consumer-repo trainer API remnants, then close
      C-B14 in ROADMAP.md (functions/api/trainer/ already absent — confirm only).
- [ ] 1.5 Lazy-load CoachView via React.lazy + Suspense (copy SettingsView pattern).
      Target: main chunk under 500 KB. Verify Coach tab renders + consent gate still blocks.

## Phase 2 — UX coherence

- [ ] 2.1 Language unification in CoachView: replace hardcoded English section headers
      ("YOUR PROGRAMME", "Weekly plan →") with `t()` NL-first strings so one screen is
      one language. Scope: headers + button labels only, ~15 strings. Add i18n.js entries.
- [ ] 2.2 CoachView hierarchy: merge GEPLANDE SESSIES + OPEN GROEPSLESSEN + SESSIE CREDITS
      into one "Trainer" card with internal sections. Max 4 top-level cards on first paint.
      No data/API changes — JSX restructure only.
- [ ] 2.3 Refresh unread badge on `visibilitychange`: re-fetch getTrainerData when tab
      becomes visible (copy the existing Strava visibility-sync pattern in App.jsx).

## Phase 3 — Test keystone (C-B10)

- [ ] 3.1 Add Playwright; journeys: signup/login → onboarding → check-in → plan →
      complete workout → history. Run against local `wrangler pages dev` or preview deploy.
- [ ] 3.2 Add journeys: guest mode, connect (FIT-code), trainer-invite accept,
      consent gate block/sign, 409 client-limit error message.
- [ ] 3.3 Wire into npm script (`npm run e2e`); document in CLAUDE.md as release gate
      for structural PRs. Close C-B10 in ROADMAP.md.

## Phase 4 — Structural (GATED on Phase 3)

- [ ] 4.1 C-E11: split App.jsx → features/today, features/coach, features/onboarding,
      features/invites + AppShellContext owning token/userId/prefs. Kills 37-site token
      threading and CoachView's 20-prop signature. E2E must stay green per extraction.
- [ ] 4.2 C-B7: HttpOnly cookie auth per /tmp/c_b7_design.md (copy into docs/ first).
      Grace period: getUser() accepts cookie OR Bearer for 30 days. Do during/after 4.1.
- [ ] 4.3 C-E12: split SettingsView into panels (account, privacy, subscription,
      training, integrations, trainer) after 4.1 settles state ownership.
- [ ] 4.4 X-4: resolve duplicate migration prefixes 0059/0060/0061/0072/0074 — document
      applied-as-is in migrations/legacy/README, update baseline, unblock consumer
      migrations. Never rename applied files; ledger fix only.

## Out of scope (decided, do not do)
Backend refactors beyond the above (plan.js is fine post-C-E13); Tailwind migration
for client-app; additional lazy boundaries before 4.1.
