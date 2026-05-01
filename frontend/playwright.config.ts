import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — E2E suite del frontend.
 *
 * Convenciones (ADR-0036, docs/testing/conventions.md):
 *   - Specs en `frontend/e2e/<área>/<flow>.spec.ts`.
 *   - Helpers reusables en `frontend/e2e/helpers/`.
 *   - Localmente: requiere `just infra-up` + backend en :5000 + frontend en :3000.
 *     Recipe Justfile: `just frontend-test-e2e`.
 *   - CI: `.github/workflows/e2e.yml` corre on-demand (label `e2e` en el PR
 *     o push a main), no en cada push.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,

  // Default timeouts: 60s por test (algunos flujos esperan emails en mailpit),
  // 10s para auto-wait de locators.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Fail builds si quedaron `.only` en el código.
  forbidOnly: !!process.env.CI,

  // No retries local (queremos ver los flakes); 1 retry en CI para
  // tolerar flakes transientes de network.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // En failures: screenshot full page + trace zip para post-mortem.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  // Default chromium siempre. FF/Webkit como matrix opcional via env var.
  // Para correr cross-browser localmente: `PLAYWRIGHT_ALL_BROWSERS=1 just frontend-test-e2e`.
  projects: process.env.PLAYWRIGHT_ALL_BROWSERS
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
