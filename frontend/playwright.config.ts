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

// `_capture/` es para automatizaciones one-off (ej. screenshot del canvas de design). No corren
// con la suite normal: para invocarlas hay que pasarlas como argumento explícito al cli de
// playwright.
const CAPTURE_IGNORE = process.env.PLAYWRIGHT_INCLUDE_CAPTURE === '1' ? [] : ['**/_capture/**'];

/**
 * Specs que van al proyecto `serial` (ver `projects` más abajo) porque mutan un recurso global
 * sin lock optimista y no toleran correr a la vez que otro spec, ni consigo mismo en otro worker.
 *
 * `admin/items.spec.ts`: sus dos tests destilan una frase nueva cada uno (`DistilItemCommand`, y
 * uno de los dos también `SupersedeItemCommand`). Las dos operaciones leen el instrumento
 * "vigente", lo cierran y publican la versión siguiente, y `Instrument` no tiene concurrency
 * token (solo `unique(code, version)`, ver `InstrumentConfiguration.cs`): dos publicaciones que
 * lean la misma vigente antes de que la primera cierre pueden calcular la MISMA versión
 * siguiente y chocar contra ese unique con un 500 en vez de un error de dominio prolijo. Un
 * worker alcanza para sacar la ventana de carrera consigo mismo; que corra recién cuando
 * `parallel` terminó (incluida `admin/curation.spec.ts`, que también destila una frase, una sola
 * vez) la saca contra cualquier otro spec también.
 */
const SERIAL_SPECS = ['**/admin/items.spec.ts'];

/**
 * Playwright config: E2E suite del frontend.
 *
 * Convenciones (ADR-0036, docs/engineering/testing.md):
 *   - Specs en `frontend/e2e/<área>/<flow>.spec.ts`.
 *   - Helpers reusables en `frontend/e2e/helpers/`.
 *   - Localmente: `just frontend-test-e2e` levanta su propio stack contra una base efímera
 *     (`scripts/run-e2e.ts`, mismo patrón que el job de CI), así que el stack de dev tiene que
 *     estar ABAJO. Solo hace falta la infra: `just infra-up`.
 *   - CI: job `e2e` dentro de `.github/workflows/ci.yml` corre siempre en cada PR.
 *   - Dos proyectos (ver `projects`): `parallel` corre todo lo que no muta estado global, y
 *     `serial` corre después, con un worker. La regla de aislamiento completa (qué hace que un
 *     spec pueda vivir en `parallel`) está en `docs/engineering/testing.md`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  testIgnore: CAPTURE_IGNORE,

  // Default timeouts: 60s por test (algunos flujos esperan emails en mailpit),
  // 10s para auto-wait de locators.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // Fail builds si quedaron `.only` en el código.
  forbidOnly: !!process.env.CI,

  // No retries local (queremos ver los flakes); 1 retry en CI para
  // tolerar flakes transientes de network.
  retries: process.env.CI ? 1 : 0,

  // Sin fijar en local: Playwright usa la mitad de los cores. El runner de CI tiene 4 cores y los
  // comparte con Postgres, el backend y el frontend corriendo al lado (`scripts/run-e2e.ts`
  // levanta los tres antes de esto); 3 es el valor a confirmar contra 2 en una corrida real de CI
  // (no se pudo comparar desde acá, ver docs/engineering/testing.md).
  //
  // PLAYWRIGHT_ALL_BROWSERS no lleva la partición `parallel`/`serial` (ver `projects`): ese modo
  // es manual y local, y sumarle la partición multiplicaría cada proyecto por navegador. Un
  // worker ahí es lo que evita la carrera de `SERIAL_SPECS` sin la partición para sacarla.
  workers: process.env.PLAYWRIGHT_ALL_BROWSERS ? 1 : process.env.CI ? 3 : undefined,

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

  // Default chromium siempre, partido en `parallel` + `serial` (ver `SERIAL_SPECS` arriba). FF y
  // WebKit quedan como matrix opcional via env var, sin la partición: correrla ahí también
  // multiplicaría cada proyecto por navegador (parallel-chromium, serial-chromium,
  // parallel-firefox, ...) para un modo que ya es manual y local, así que ese matrix se queda con
  // la forma que tenía. Para correr cross-browser: `PLAYWRIGHT_ALL_BROWSERS=1 just
  // frontend-test-e2e`.
  projects: process.env.PLAYWRIGHT_ALL_BROWSERS
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [
        {
          name: 'parallel',
          testIgnore: [...CAPTURE_IGNORE, ...SERIAL_SPECS],
          fullyParallel: true,
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'serial',
          testMatch: SERIAL_SPECS,
          fullyParallel: false,
          workers: 1,
          // Corre recién cuando `parallel` terminó entero: ver docstring de `SERIAL_SPECS`.
          dependencies: ['parallel'],
          use: { ...devices['Desktop Chrome'] },
        },
      ],
});
