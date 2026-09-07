/**
 * Corre el tramo con cuenta de "El recorrido para Copas" (`docs/engineering/deploy.md`) contra el
 * stage real. A mano, nunca en CI: no levanta ningún stack local, pega directo a
 * `https://planb.olisar.com.ar` y a su Mailpit.
 *
 * Wrapped en TS porque pwsh, el default windows-shell del Justfile, no entiende la sintaxis bash
 * `VAR=value cmd` (mismo motivo que `run-e2e-show.ts`).
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const result = spawnSync(
  'bunx',
  [
    'playwright',
    'test',
    'e2e/_stage/walk.spec.ts',
    '--project=parallel',
    '--workers=1',
    '--retries=0',
    '--reporter=list',
  ],
  {
    cwd: resolve(ROOT, 'frontend'),
    env: {
      ...process.env,
      PLAYWRIGHT_INCLUDE_STAGE: '1',
      PLAYWRIGHT_BASE_URL: 'https://planb.olisar.com.ar',
    },
    stdio: 'inherit',
    shell: true,
  },
);

process.exit(result.status ?? 1);
