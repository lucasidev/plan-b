/**
 * E2E con browser visible + slowMo, sobre la misma base efímera que usa `run-e2e.ts`.
 *
 * Delega en `run-e2e.ts` en vez de invocar Playwright directo. Antes le pegaba al stack de dev que
 * hubiera levantado, y eso tenía dos problemas: dejaba data acumulada en la base de dev, y cuando
 * estás debuggeando un spec flaky no sabés contra qué estado corriste. Un poco más lento (levanta
 * el stack), a cambio de que lo que ves en pantalla arranque siempre del mismo punto.
 *
 * Convención del repo: scripts en TS (`CLAUDE.md` "Scripts en TypeScript, no en bash.
 * Consistencia."). El recipe `frontend-test-e2e-show` no puede usar sintaxis bash inline
 * (`PLAYWRIGHT_SLOWMO=300 bunx ...`) porque pwsh, el default windows-shell del Justfile, no la
 * entiende.
 *
 * Defaults:
 * - `--headed` siempre. Headless solo en CI (el job `e2e` de `ci.yml` invoca `bunx playwright test`
 *   directo, no pasa por acá). Para validación visual local antes de declarar un slice "listo".
 * - `PLAYWRIGHT_SLOWMO`: 1000ms. Override via env var del mismo nombre.
 *
 * Args extra se forwardean a `playwright test` (filtros, `--grep`, specs específicos, etc.).
 *
 * Ej: `bun scripts/run-e2e-show.ts e2e/auth/onboarding.spec.ts`
 *     `bun scripts/run-e2e-show.ts --grep "happy path"`
 *     `PLAYWRIGHT_SLOWMO=500 bun scripts/run-e2e-show.ts`
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const result = spawnSync('bun', ['scripts/run-e2e.ts', '--headed', ...process.argv.slice(2)], {
  cwd: ROOT,
  env: { ...process.env, PLAYWRIGHT_SLOWMO: process.env.PLAYWRIGHT_SLOWMO ?? '1000' },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
