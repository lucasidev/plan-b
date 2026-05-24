/**
 * Cross-shell wrapper para correr Playwright con browser visible + slowMo.
 *
 * Convención del repo: scripts en TS (`CLAUDE.md` "Scripts en TypeScript,
 * no en bash. Consistencia."). Antes el recipe `frontend-test-e2e-show`
 * usaba sintaxis bash inline (`PLAYWRIGHT_SLOWMO=300 bunx ...`) que pwsh
 * (default windows-shell del Justfile) no entiende.
 *
 * Defaults:
 * - `--headed` siempre. Headless solo en CI (job `e2e` de `ci.yml` invoca
 *   `bunx playwright test` directo, no pasa por acá). Para validación
 *   visual local antes de declarar un slice "listo".
 * - `PLAYWRIGHT_SLOWMO`: 1000ms. Override via env var del mismo nombre.
 *
 * Args extra se forwardean a `playwright test` (filtros, `--grep`, specs
 * específicos, etc.).
 *
 * Ej: `bun scripts/run-e2e-show.ts e2e/auth/onboarding.spec.ts`
 *     `bun scripts/run-e2e-show.ts --grep "happy path"`
 *     `PLAYWRIGHT_SLOWMO=500 bun scripts/run-e2e-show.ts`
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FRONTEND = resolve(ROOT, 'frontend');

const result = spawnSync('bunx', ['playwright', 'test', '--headed', ...process.argv.slice(2)], {
  cwd: FRONTEND,
  env: { ...process.env, PLAYWRIGHT_SLOWMO: process.env.PLAYWRIGHT_SLOWMO ?? '1000' },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
