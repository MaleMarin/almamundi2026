import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke E2E: arranca el dev server en el mismo puerto que `npm run dev` (3005).
 * Para apuntar a otro origen: PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e
 * Para no levantar servidor (ya tienes `npm run dev`): PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
 * CI / producción local: `npm run build` y PLAYWRIGHT_WEB_SERVER_CMD="npm run start:e2e" npm run test:e2e
 */
const PORT = 3005;
const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || `http://127.0.0.1:${PORT}`;
const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: isCi ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEB_SERVER_CMD?.trim() || 'npm run dev',
        url: baseURL,
        // En local suele haber `npm run dev` en 3005; en GitHub Actions el runner está vacío.
        reuseExistingServer: process.env.PLAYWRIGHT_FORCE_FRESH_SERVER !== '1',
        timeout: 120_000,
      },
});
