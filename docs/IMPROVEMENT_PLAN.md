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
- [x] 1.4 Verify no live route depends on consumer-repo trainer API remnants, then close
      C-B14 in ROADMAP.md (functions/api/trainer/ already absent — confirm only).
- [x] 1.5 Lazy-load CoachView via React.lazy + Suspense (copy SettingsView pattern).
      Target: main chunk under 500 KB. Verify Coach tab renders + consent gate still blocks.
      Result: main chunk 591.68 kB → 531.02 kB (CoachView now its own 61 kB chunk);
      close to but not fully under 500 KB — further splitting deferred to Phase 4 (C-E11).

## Phase 2 — UX coherence

- [x] 2.1 Language unification in CoachView: replace hardcoded English section headers
      ("YOUR PROGRAMME", "Weekly plan →") with `t()` NL-first strings so one screen is
      one language. Scope: headers + button labels only, ~15 strings. Add i18n.js entries.
- [x] 2.2 CoachView hierarchy: merge GEPLANDE SESSIES + OPEN GROEPSLESSEN + SESSIE CREDITS
      into one "Trainer" card with internal sections. Max 4 top-level cards on first paint.
      No data/API changes — JSX restructure only.
- [x] 2.3 Refresh unread badge on `visibilitychange`: re-fetch getTrainerData when tab
      becomes visible (copy the existing Strava visibility-sync pattern in App.jsx).

## Phase 3 — Test keystone (C-B10)

- [x] 3.1 Add Playwright; journeys: signup/login → onboarding → check-in → plan →
      complete workout → history. Run against local `wrangler pages dev` or preview deploy.
- [x] 3.2 Add journeys: guest mode, connect (FIT-code), trainer-invite accept,
      consent gate block/sign, 409 client-limit error message.
- [x] 3.3 Wire into npm script (`npm run e2e`); document in CLAUDE.md as release gate
      for structural PRs. Close C-B10 in ROADMAP.md.

## Phase 4 — Structural (GATED on Phase 3)

- [x] 4.1 C-E11: split App.jsx → features/today, features/coach, features/onboarding,
      features/invites + AppShellContext owning token/userId/prefs. Kills 37-site token
      threading and CoachView's 20-prop signature. E2E must stay green per extraction.
      Result: AppShellContext.js created; TrainerInviteScreen/ConnectScreen/PendingInviteModal
      extracted to own files; CoachView token removed from props; SettingsView token+userId
      removed from props. All 6 E2E tests green.
- [x] 4.2 C-B7: HttpOnly cookie auth per docs/c_b7_design.md. Grace period active: getUser()
      accepts __Host-jf_session cookie OR Authorization Bearer. All auth endpoints set cookie.
      logout action clears cookie server-side. Bearer fallback stays until post-grace cleanup.
- [x] 4.3 C-E12: split SettingsView into panels (account, privacy, subscription,
      training, integrations, trainer) after 4.1 settles state ownership.
      Result: TrainersPanel extracted to src/settings/TrainersPanel.jsx (370-line inline → own file);
      E2E regression fixed: global-setup now resets guest IP rate limit bucket + open gym client memberships
      between runs. All 6 E2E tests green.
- [x] 4.4 X-4: resolve duplicate migration prefixes 0059/0060/0061/0072/0074 — document
      applied-as-is in migrations/legacy/README, update baseline, unblock consumer
      migrations. Never rename applied files; ledger fix only.

## Out of scope (decided, do not do)
Backend refactors beyond the above (plan.js is fine post-C-E13); Tailwind migration
for client-app; additional lazy boundaries before 4.1.
