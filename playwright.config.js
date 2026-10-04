import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';

// E2E suite runs against a built client-app served by `wrangler pages dev`
// (local D1, local JWT_SECRET from .dev.vars). See docs/IMPROVEMENT_PLAN.md Phase 3.
export default defineConfig({
  globalSetup: './e2e/global-setup.js',
  // One worker: every journey shares one freshly-seeded D1 and one fixture gym.
  // In parallel, two journeys racing on e2e-gym-open flake (seen 2026-10-04,
  // 1 of 10); serially the suite is ~30 s of test time, so parallelism buys nothing.
  workers: 1,
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'retain-on-failure',
  },
  webServer: {
    // --persist-to must match e2e/global-setup.js PERSIST: the suite seeds its own D1.
    // Secrets are passed as bindings, not read from .dev.vars: Playwright starts
    // this server BEFORE globalSetup, so a file written there arrives too late —
    // from a fresh worktree the server came up with no JWT_SECRET and every
    // journey failed its first signed-cookie request. The value only ever signs
    // cookies for users this suite creates against its own local database.
    command: 'npm run build --workspace=client-app && npx wrangler pages dev packages/client-app/dist --port 8788 --persist-to .wrangler/e2e-state --binding JWT_SECRET=e2e-local-only-not-a-secret --binding RESEND_API_KEY=re_e2e_placeholder',
    url: 'http://localhost:8788/api/ping',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
