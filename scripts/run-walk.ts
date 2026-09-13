/**
 * Corre un recorrido de persona ("Recorridos de persona", `docs/engineering/testing.md`) contra
 * el stage real. Es la revisión del producto: camina un recorrido de `docs/product/` como una
 * persona concreta, así que su rojo es un hallazgo para `docs/history/reviews/`, nunca un bug del
 * arnés. A mano, nunca en CI: no levanta ningún stack local, pega directo a
 * `https://planb.olisar.com.ar` (o `WALK_BASE_URL`) y a su Mailpit.
 *
 * Wrapped en TS porque pwsh, el default windows-shell del Justfile, no entiende la sintaxis bash
 * `VAR=value cmd` (mismo motivo que `run-e2e-show.ts`).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PERSONAS = ['valentina', 'lucia', 'matias', 'sofia', 'copas'] as const;
type Persona = (typeof PERSONAS)[number];

// `copas` corre con aserciones duras (`expect`, no `record()`): a diferencia de los otros cuatro,
// no deja tabla de veredictos ni capturas propias.
const WRITES_ARTIFACTS: Record<Persona, boolean> = {
  valentina: true,
  lucia: true,
  matias: true,
  sofia: true,
  copas: false,
};

function isPersona(value: string | undefined): value is Persona {
  return !!value && PERSONAS.some((p) => p === value);
}

const persona = process.argv[2];
if (!isPersona(persona)) {
  console.error('Uso: bun scripts/run-walk.ts <persona>');
  console.error(`Personas disponibles: ${PERSONAS.join(', ')}`);
  process.exit(1);
}

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

// Fijada una sola vez y pasada por env: así el runner sabe con qué carpeta de capturas terminó la
// corrida, en vez de adivinar qué fecha eligió el proceso hijo.
const walkDate = process.env.WALK_DATE ?? new Date().toISOString().slice(0, 10);

const result = spawnSync(
  'bunx',
  ['playwright', 'test', '--project=walks', `e2e/walks/${persona}.spec.ts`, '--reporter=list'],
  {
    cwd: resolve(ROOT, 'frontend'),
    env: {
      ...process.env,
      ...stageEnv,
      WALK_DATE: walkDate,
    },
    stdio: 'inherit',
    shell: true,
  },
);

if (WRITES_ARTIFACTS[persona]) {
  console.log(`Tabla de veredictos: frontend/test-results/${persona}-verdicts.md`);
  console.log(`Capturas: docs/history/reviews/assets/${walkDate}-${persona}`);
}

process.exit(result.status ?? 1);
