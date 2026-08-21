/**
 * Corre la suite E2E contra una base de datos efímera, igual que el job `e2e` de `ci.yml`.
 *
 * El problema que resuelve: localmente la suite corría contra la base de dev, así que cada corrida
 * dejaba usuarios, reseñas, borradores y cuentas dadas de baja acumulados. Eso no era solo desorden:
 * los specs no podían afirmar datos concretos porque no podían confiar en el estado (el docstring de
 * `e2e/plan/plan.spec.ts` lo dice explícito), o sea que la suite era más débil de lo que podía ser.
 * En CI el problema no existe porque el service container arranca con una `planb_test` limpia en cada
 * corrida; este script le da al local la misma garantía.
 *
 * Lo que hace, en orden:
 *   1. Exige que los puertos del backend y del frontend estén libres. Si el stack de dev está
 *      arriba, corta: correr contra "lo que hubiera levantado" es justamente la ambigüedad que
 *      estamos sacando.
 *   2. Dropea y recrea la base efímera. El drop va al ARRANQUE y no al final a propósito: la
 *      frescura queda garantizada igual, la base sobrevive para inspeccionar si un spec falla, y no
 *      hay orden de limpieza que se pueda romper cuando algo explota en el medio.
 *   3. Levanta el backend apuntado a esa base. En Development, Wolverine crea el schema y los
 *      seeders siembran el catálogo y las personas.
 *   4. Espera igual que CI: primero `/health`, y después un sign-in real de Lucía. El health
 *      responde 200 antes de que el seeder termine, así que por sí solo no alcanza.
 *   5. Levanta el frontend y corre Playwright, forwardeando los args que reciba.
 *
 * Deliberadamente NO setea `PLANB_SEED_CORPUS`: el job de CI tampoco lo hace, y la idea es que local
 * y CI vean lo mismo. El corpus de reseñas es data de devex para `just dev`, no para los tests.
 *
 * La sonda de puerto, el drop/create de la base, el spawn de backend/frontend y la espera al
 * DevSeed viven en `scripts/lib/dev-stack.ts`: las comparte con `run-scratch.ts`, que levanta el
 * mismo stack pero para recorrer la app a mano (base `planb_scratch`, corpus de demo sembrado, sin
 * Playwright).
 *
 * Ej: `bun scripts/run-e2e.ts`
 *     `bun scripts/run-e2e.ts e2e/plan/plan.spec.ts`
 *     `bun scripts/run-e2e.ts --grep "guardar la combinación"`
 */

import { type ChildProcess, spawnSync } from 'node:child_process';
import { detectContainerRuntime } from './detect-container.ts';
import {
  BACKEND_PORT,
  buildFrontend,
  FRONTEND,
  FRONTEND_ATTEMPTS,
  FRONTEND_PORT,
  HEALTH_ATTEMPTS,
  killTree,
  POSTGRES_CONTAINER,
  recreateDatabase,
  requireDevConnectionString,
  requireFreePorts,
  spawnBackend,
  spawnFrontend,
  waitForHttp,
  waitForSeed,
  withDatabase,
} from './lib/dev-stack.ts';

/** Nombre fijo, no aleatorio: queremos poder inspeccionarla después de un fallo. */
const DB_NAME = 'planb_e2e';

const children: ChildProcess[] = [];

function cleanup(): void {
  for (const child of children) {
    killTree(child);
  }
  children.length = 0;
}

async function main(): Promise<number> {
  const rawArgs = process.argv.slice(2);

  // `--build` corre la suite contra un build de producción (`next build` + `next start`) en vez
  // del dev server, que es lo que hace CI. No es un lujo: el dev server tolera cosas que el build
  // no, y al revés. Un bug de desync entre la URL y el contenido de `/plan` pasaba en verde local
  // y fallaba en CI, y perseguirlo con `next dev` era imposible porque ahí no se reproduce.
  //
  // El default sigue siendo dev: es varios minutos más rápido y alcanza para el 90% de los casos.
  // Cuando CI falla y local no, ese es el momento de usar esto.
  const useBuild = rawArgs.includes('--build');
  const playwrightArgs = rawArgs.filter((a) => a !== '--build');

  // ── 1. Puertos libres ────────────────────────────────────────────────────────
  if (
    !(await requireFreePorts(
      [
        [BACKEND_PORT, 'backend'],
        [FRONTEND_PORT, 'frontend'],
      ],
      'La suite E2E',
    ))
  ) {
    return 1;
  }

  const devConnection = requireDevConnectionString();
  if (!devConnection) {
    return 1;
  }

  const containerCmd = detectContainerRuntime();

  // ── 2. Base efímera ──────────────────────────────────────────────────────────
  if (!(await recreateDatabase(containerCmd, DB_NAME))) {
    return 1;
  }

  const e2eConnection = withDatabase(devConnection, DB_NAME);

  // ── 3. Backend ───────────────────────────────────────────────────────────────
  console.log(`Levantando el backend en :${BACKEND_PORT} contra ${DB_NAME}...`);
  // Sin PLANB_SEED_CORPUS, igual que CI: el corpus es devex de `just dev`, no de los tests.
  const backend = spawnBackend(e2eConnection, '');
  children.push(backend);

  if (
    !(await waitForHttp(
      `http://localhost:${BACKEND_PORT}/health`,
      HEALTH_ATTEMPTS,
      'backend',
      backend,
    ))
  ) {
    console.error(`El backend nunca respondió /health en ${HEALTH_ATTEMPTS}s.`);
    return 1;
  }
  if (!(await waitForSeed())) {
    console.error('El DevSeed nunca terminó: el sign-in de Lucía no devolvió 200.');
    return 1;
  }

  // ── 4. Frontend ──────────────────────────────────────────────────────────────
  if (useBuild) {
    console.log('Buildeando el frontend (modo --build, como CI)...');
    const built = await buildFrontend();
    if (built !== 0) {
      console.error('El build del frontend falló.');
      return 1;
    }
  }

  console.log(
    `Levantando el frontend en :${FRONTEND_PORT}${useBuild ? ' (build de producción)' : ''}...`,
  );
  const frontend = spawnFrontend(useBuild ? 'start' : 'dev');
  children.push(frontend);

  if (
    !(await waitForHttp(
      `http://localhost:${FRONTEND_PORT}`,
      FRONTEND_ATTEMPTS,
      'frontend',
      frontend,
    ))
  ) {
    console.error(`El frontend nunca respondió en ${FRONTEND_ATTEMPTS}s.`);
    return 1;
  }

  // ── 5. Playwright ────────────────────────────────────────────────────────────
  console.log('Corriendo Playwright...\n');
  const run = spawnSync('bunx', ['playwright', 'test', ...playwrightArgs], {
    cwd: FRONTEND,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: `http://localhost:${FRONTEND_PORT}` },
    stdio: 'inherit',
    shell: true,
  });

  if (run.status !== 0) {
    console.log('');
    console.log(`La base ${DB_NAME} queda en pie para inspeccionar el estado del fallo:`);
    console.log(`  ${containerCmd} exec -it ${POSTGRES_CONTAINER} psql -U planb -d ${DB_NAME}`);
  }

  return run.status ?? 1;
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
