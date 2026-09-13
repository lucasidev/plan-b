/**
 * Corre el tramo con cuenta de "El recorrido para Copas" (`docs/engineering/deploy.md`) contra el
 * stage real. A mano, nunca en CI: no levanta ningún stack local, pega directo a
 * `https://planb.olisar.com.ar` y a su Mailpit.
 *
 * Wrapped en TS porque pwsh, el default windows-shell del Justfile, no entiende la sintaxis bash
 * `VAR=value cmd` (mismo motivo que `run-e2e-show.ts`).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

// Los secretos del stage (hoy solo STAGE_MAILPIT_UI_AUTH) no viven en el .env de dev: si existe
// este archivo aparte, gitignorado, se leen de ahí. Si no existe, siguen pudiendo venir del entorno.
function parseEnvFile(path: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const stageEnv = parseEnvFile(resolve(ROOT, '.env.stage.local'));

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
      ...stageEnv,
      PLAYWRIGHT_INCLUDE_STAGE: '1',
      PLAYWRIGHT_BASE_URL: 'https://planb.olisar.com.ar',
    },
    stdio: 'inherit',
    shell: true,
  },
);

process.exit(result.status ?? 1);
