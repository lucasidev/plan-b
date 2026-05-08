import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Cargar el .env del root del repo (donde vive REDIS_PASSWORD, MAILPIT_URL,
// BACKEND_URL, etc.). Sin esto, los helpers que tocan Redis (clear rate
// limits) no autentican y los rate limits del backend se acumulan entre
// tests, haciendo flakear los flows de resend / forgot-password. `just`
// carga .env automáticamente cuando se invoca via `just frontend-test-e2e`,
// pero correr `bunx playwright test` directo no, así que cargarlo acá da
// invariante más fuerte.
dotenv.config({ path: resolve(__dirname, '../.env') });

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
  // `_capture/` es para automatizaciones one-off (ej. screenshot del canvas
  // de design). No corren con la suite normal: para invocarlas hay que
  // pasarlas como argumento explícito al cli de playwright.
  testIgnore: process.env.PLAYWRIGHT_INCLUDE_CAPTURE === '1' ? [] : ['**/_capture/**'],

  // Default timeouts: 60s por test (algunos flujos esperan emails en mailpit),
  // 10s para auto-wait de locators.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Fail builds si quedaron `.only` en el código.
  forbidOnly: !!process.env.CI,

  // No retries local (queremos ver los flakes); 1 retry en CI para
  // tolerar flakes transientes de network.
  retries: process.env.CI ? 1 : 0,
  // Workers: 1 siempre. Los specs comparten state externo (Mailpit, Redis,
  // backend DB con personas pre-seedeadas). Tests paralelos racean: el
  // `clearAllMessages()` de un test borra el mail que otro está esperando;
  // dos tests intentan login con la misma persona y los refresh tokens
  // chocan. Serializar es más simple que aislar cada resource compartido
  // (alternativa: dedicated personas por test, mailpit search filtrado por
  // tag, etc.). El costo es ~25s extras locales vs paralelo.
  workers: 1,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // En failures: screenshot full page + trace zip para post-mortem.
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    // PLAYWRIGHT_SLOWMO=<ms> ralentiza cada acción del browser. Útil con
    // `--headed` para demos visibles ("mostrame el flow corriendo").
    launchOptions: process.env.PLAYWRIGHT_SLOWMO
      ? { slowMo: Number(process.env.PLAYWRIGHT_SLOWMO) }
      : undefined,
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
