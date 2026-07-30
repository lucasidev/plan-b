/**
 * Levanta el stack completo (backend + frontend) contra una base de Postgres efímera propia, para
 * recorrer la app a mano sin ensuciar la base de dev.
 *
 * El problema que resuelve: `just dev` es la única forma de levantar el stack localmente, y corre
 * contra la base de dev. Cada usuario, cursada o borrador que se crea explorando queda ahí para
 * siempre. No es hipotético: hoy mismo una cursada de prueba y dos períodos lectivos basura
 * quedaron pegados en la base de dev de alguien que solo quería mirar la app andando.
 *
 * Comparte con `run-e2e.ts` (vía `scripts/lib/dev-stack.ts`) la sonda de puerto, el drop/create de
 * la base, el spawn de backend/frontend y la espera al DevSeed. Lo que cambia:
 *   - Base propia, `planb_scratch`, nunca `planb_e2e`: así una corrida de este modo no le pisa la
 *     base a una corrida de E2E que esté en curso (o viceversa).
 *   - Sí siembra el corpus de demo (`PLANB_SEED_CORPUS=1`): alguien explorando a mano necesita
 *     personas, cursadas y reseñas para mirar, a diferencia de los tests, que arman sus propios
 *     datos.
 *   - No corre ninguna suite: una vez arriba, imprime las URLs y las personas sembradas, y queda
 *     esperando. La única salida es Ctrl+C.
 *   - Al cortar, a diferencia de E2E (que deja `planb_e2e` en pie para poder inspeccionar un
 *     fallo), dropea la base. El punto de este modo es no dejar rastro.
 *
 * Ej: `bun scripts/run-scratch.ts` (o `just dev-scratch`)
 */

import type { ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectContainerRuntime } from './detect-container.ts';
import {
  BACKEND_PORT,
  FRONTEND_ATTEMPTS,
  FRONTEND_PORT,
  HEALTH_ATTEMPTS,
  ROOT,
  dropDatabase,
  killTree,
  recreateDatabase,
  requireDevConnectionString,
  requireFreePorts,
  spawnBackend,
  spawnFrontend,
  waitForHttp,
  waitForSeed,
  withDatabase,
} from './lib/dev-stack.ts';

/** Nunca `planb_e2e`: este modo no puede pisarle la base a una corrida de E2E concurrente. */
const DB_NAME = 'planb_scratch';

const PERSONAS_PATH = resolve(ROOT, 'backend/host/Planb.Api/seed-data/personas.json');

interface PersonaConfig {
  Email: string;
  Password: string;
  DisplayName: string;
}

/** Mismo shape que liga `SeedPersonasOptions` en el host: sección `Seed`, lista `Personas`. */
function loadPersonas(): PersonaConfig[] {
  const parsed = JSON.parse(readFileSync(PERSONAS_PATH, 'utf8')) as {
    Seed: { Personas: PersonaConfig[] };
  };
  return parsed.Seed.Personas;
}

function printReadyBanner(personas: PersonaConfig[]): void {
  const mailpitUiPort = process.env.MAILPIT_UI_PORT ?? '8025';
  const nameWidth = Math.max(...personas.map((p) => p.DisplayName.length));
  const emailWidth = Math.max(...personas.map((p) => p.Email.length));

  console.log('');
  console.log('Stack de exploración arriba:');
  console.log(`  Frontend:  http://localhost:${FRONTEND_PORT}`);
  console.log(`  Backend:   http://localhost:${BACKEND_PORT}`);
  console.log(`  Mailpit:   http://localhost:${mailpitUiPort}`);
  console.log('');
  console.log('Personas sembradas:');
  for (const persona of personas) {
    console.log(
      `  ${persona.DisplayName.padEnd(nameWidth)}  ${persona.Email.padEnd(emailWidth)}  ${persona.Password}`,
    );
  }
  console.log('');
  console.log(`Ctrl+C corta el stack y dropea ${DB_NAME}: no queda rastro.`);
}

const children: ChildProcess[] = [];
let containerCmd: string | undefined;
let dbCreated = false;

function cleanup(): void {
  for (const child of children) {
    killTree(child);
  }
  children.length = 0;

  // Dropea la base que este proceso creó, sea que el usuario cortó con Ctrl+C o que un fallo a
  // mitad de camino nos hizo salir antes: el punto del modo scratch es no dejar rastro en ningún
  // caso, no solo en el feliz.
  if (dbCreated && containerCmd) {
    console.log(`Dropeando ${DB_NAME}...`);
    const drop = dropDatabase(containerCmd, DB_NAME);
    if (drop.status !== 0) {
      console.error(`No pude dropear ${DB_NAME}:`);
      console.error(drop.stderr?.trim() ?? '');
    }
    dbCreated = false;
  }
}

async function main(): Promise<number> {
  // ── 1. Puertos libres ────────────────────────────────────────────────────────
  if (
    !(await requireFreePorts(
      [
        [BACKEND_PORT, 'backend'],
        [FRONTEND_PORT, 'frontend'],
      ],
      'El modo scratch',
    ))
  ) {
    return 1;
  }

  const devConnection = requireDevConnectionString();
  if (!devConnection) {
    return 1;
  }

  containerCmd = detectContainerRuntime();

  // ── 2. Base efímera ──────────────────────────────────────────────────────────
  if (!(await recreateDatabase(containerCmd, DB_NAME))) {
    return 1;
  }
  dbCreated = true;

  const scratchConnection = withDatabase(devConnection, DB_NAME);

  // ── 3. Backend ───────────────────────────────────────────────────────────────
  console.log(`Levantando el backend en :${BACKEND_PORT} contra ${DB_NAME}...`);
  // A diferencia de E2E: acá sí sembramos el corpus de demo, porque el punto de este modo es
  // tener datos para explorar.
  const backend = spawnBackend(scratchConnection, '1');
  children.push(backend);

  if (
    !(await waitForHttp(`http://localhost:${BACKEND_PORT}/health`, HEALTH_ATTEMPTS, 'backend', backend))
  ) {
    console.error(`El backend nunca respondió /health en ${HEALTH_ATTEMPTS}s.`);
    return 1;
  }
  if (!(await waitForSeed())) {
    console.error('El DevSeed nunca terminó: el sign-in de Lucía no devolvió 200.');
    return 1;
  }

  // ── 4. Frontend ──────────────────────────────────────────────────────────────
  console.log(`Levantando el frontend en :${FRONTEND_PORT}...`);
  const frontend = spawnFrontend();
  children.push(frontend);

  if (
    !(await waitForHttp(`http://localhost:${FRONTEND_PORT}`, FRONTEND_ATTEMPTS, 'frontend', frontend))
  ) {
    console.error(`El frontend nunca respondió en ${FRONTEND_ATTEMPTS}s.`);
    return 1;
  }

  printReadyBanner(loadPersonas());

  // Cuelga a propósito: a diferencia de E2E (que corre Playwright y termina solo), acá el punto es
  // que el stack quede arriba para que alguien lo recorra. La única salida es Ctrl+C, que dispara
  // el handler de SIGINT/SIGTERM de más abajo (mata backend/frontend y dropea la base).
  await new Promise<void>(() => {});
  return 0; // inalcanzable: el await de arriba nunca resuelve.
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    cleanup();
    process.exit(130);
  });
}

let exitCode = 1;
try {
  exitCode = await main();
} finally {
  cleanup();
}
process.exit(exitCode);
