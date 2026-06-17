import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';

// E2E suite runs against a built client-app served by `wrangler pages dev`
// (local D1, local JWT_SECRET from .dev.vars). See docs/IMPROVEMENT_PLAN.md Phase 3.
export default defineConfig({
  globalSetup: './e2e/global-setup.js',
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
    command: 'npm run build --workspace=client-app && npx wrangler pages dev packages/client-app/dist --port 8788',
    url: 'http://localhost:8788/api/ping',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
