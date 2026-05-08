/**
 * Cross-shell wrapper para `frontend-test-e2e-show`. Antes el recipe usaba
 * `PLAYWRIGHT_SLOWMO=300 bunx playwright test --headed` directamente, que es
 * sintaxis bash. En Windows el Justfile usa `pwsh` por default
 * (`set windows-shell := ["pwsh", ...]`) y pwsh no acepta `VAR=value command`,
 * tira "PLAYWRIGHT_SLOWMO=300 is not recognized as cmdlet".
 *
 * Este script setea la env var via `process.env` (cross-platform) y spawnea
 * `bunx playwright test --headed`. Args extra se forwardean (filtros,
 * `--grep`, spec específicos, etc.).
 *
 * Ej: `bun scripts/run-e2e-show.ts e2e/auth/onboarding.spec.ts`
 *     `bun scripts/run-e2e-show.ts --grep "happy path"`
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FRONTEND = resolve(ROOT, 'frontend');

const result = spawnSync('bunx', ['playwright', 'test', '--headed', ...process.argv.slice(2)], {
  cwd: FRONTEND,
  env: { ...process.env, PLAYWRIGHT_SLOWMO: process.env.PLAYWRIGHT_SLOWMO ?? '300' },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
