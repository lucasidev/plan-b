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
 * Ej: `bun scripts/run-e2e.ts`
 *     `bun scripts/run-e2e.ts e2e/plan/plan.spec.ts`
 *     `bun scripts/run-e2e.ts --grep "guardar la combinación"`
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';
import { detectContainerRuntime } from './detect-container.ts';

const ROOT = resolve(import.meta.dirname, '..');
const BACKEND = resolve(ROOT, 'backend');
const FRONTEND = resolve(ROOT, 'frontend');

/** Nombre fijo, no aleatorio: queremos poder inspeccionarla después de un fallo. */
const DB_NAME = 'planb_e2e';
const POSTGRES_CONTAINER = 'planb-postgres';
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;

/** Persona sembrada por el DevSeed. Su sign-in es el proxy de "seed listo" (igual que CI). */
const LUCIA = { email: 'lucia.mansilla@gmail.com', password: 'lucia.mansilla.12' };

const HEALTH_ATTEMPTS = 60;
const SEED_ATTEMPTS = 45;
const FRONTEND_ATTEMPTS = 60;

const children: ChildProcess[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Sonda de CONEXIÓN, no de bind. `find-port.ts` responde otra pregunta ("¿puedo bindear este
 * puerto?", que es la correcta para buscar uno libre) probando `listen` sobre 127.0.0.1, y eso da
 * falso negativo cuando el proceso que molesta está bindeado a `::`: en Windows el listen sobre
 * 127.0.0.1 puede tener éxito igual. Pasó de verdad: un `next dev` de `just dev` quedó vivo, el
 * chequeo dijo "libre", el frontend de la corrida falló con EADDRINUSE y los tests corrieron contra
 * el frontend de dev apuntado al backend efímero. Un stack mezclado que además daba verde.
 *
 * Preguntar "¿hay alguien atendiendo acá?" con un connect detecta al listener sin importar en qué
 * familia de direcciones esté bindeado.
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((res) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const done = (inUse: boolean) => {
      socket.destroy();
      res(inUse);
    };
    socket.setTimeout(1500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/**
 * Reemplaza el `Database=` de la connection string del `.env`, preservando host, puerto y
 * credenciales. Se hace así y no armando la cadena de cero para no duplicar (ni filtrar) la
 * password que ya vive en el `.env`.
 */
function withDatabase(connectionString: string, database: string): string {
  if (/(^|;)\s*Database\s*=/i.test(connectionString)) {
    return connectionString.replace(/(^|;)(\s*)Database\s*=[^;]*/i, `$1$2Database=${database}`);
  }
  return `${connectionString.replace(/;?\s*$/, '')};Database=${database}`;
}

/**
 * Mata el árbol de procesos. En Windows hace falta `taskkill /T`: matar el `dotnet run` o el `bun
 * dev` padre deja vivo al hijo real (`Planb.Api`, los workers de Next), y ese hijo se queda con el
 * puerto tomado y con los DLL bloqueados para el próximo build.
 */
function killTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }
}

function cleanup(): void {
  for (const child of children) {
    killTree(child);
  }
  children.length = 0;
}

function psql(containerCmd: string, database: string, sql: string) {
  return spawnSync(
    containerCmd,
    ['exec', POSTGRES_CONTAINER, 'psql', '-U', 'planb', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { encoding: 'utf8' },
  );
}

/**
 * Espera a que `url` conteste, abortando si el proceso que la tiene que servir murió antes.
 *
 * Ese chequeo del proceso no es paranoia: sin él, un 200 de OTRO servidor en el mismo puerto se
 * lee como éxito. Es la mitad complementaria de `isPortInUse`, y las dos juntas son lo que hace que
 * "arrancó bien" signifique lo que dice.
 */
async function waitForHttp(
  url: string,
  attempts: number,
  label: string,
  child: ChildProcess,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (child.exitCode !== null) {
      console.error(`  El proceso del ${label} murió (código ${child.exitCode}) antes de atender.`);
      return false;
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        console.log(`  ${label} listo (${i + 1}s).`);
        return true;
      }
    } catch {
      // Todavía no atiende: es el caso esperado en los primeros intentos.
    }
    await sleep(1000);
  }
  return false;
}

/** Espera a que el DevSeed haya materializado las personas, sondeando un sign-in real. */
async function waitForSeed(): Promise<boolean> {
  for (let i = 0; i < SEED_ATTEMPTS; i++) {
    try {
      const res = await fetch(`http://localhost:${BACKEND_PORT}/api/identity/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(LUCIA),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        console.log(`  seed listo (${i + 1} intentos).`);
        return true;
      }
    } catch {
      // Idem: el host puede estar sirviendo y el seeder todavía a mitad de camino.
    }
    await sleep(2000);
  }
  return false;
}

async function main(): Promise<number> {
  const playwrightArgs = process.argv.slice(2);

  // ── 1. Puertos libres ────────────────────────────────────────────────────────
  for (const [port, who] of [
    [BACKEND_PORT, 'backend'],
    [FRONTEND_PORT, 'frontend'],
  ] as const) {
    if (await isPortInUse(port)) {
      console.error(`El puerto ${port} está ocupado (${who}).`);
      console.error('');
      console.error('  La suite E2E levanta su propio stack contra una base efímera, así que el');
      console.error('  stack de dev tiene que estar abajo. Cortá `just dev` y reintentá.');
      return 1;
    }
  }

  const devConnection = process.env.ConnectionStrings__Planb;
  if (!devConnection) {
    console.error('Falta ConnectionStrings__Planb en el env. Corré `just setup` para generar .env.');
    return 1;
  }

  const containerCmd = detectContainerRuntime();

  // ── 2. Base efímera ──────────────────────────────────────────────────────────
  const probe = psql(containerCmd, 'postgres', 'SELECT 1');
  if (probe.status !== 0) {
    console.error(`No pude hablarle a Postgres en el container ${POSTGRES_CONTAINER}.`);
    console.error('  Levantá la infra con `just infra-up` y reintentá.');
    console.error(probe.stderr?.trim() ?? '');
    return 1;
  }

  console.log(`Recreando la base efímera ${DB_NAME}...`);
  // El WITH (FORCE) desconecta sesiones colgadas de una corrida anterior que murió a mitad.
  const drop = psql(containerCmd, 'postgres', `DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`);
  if (drop.status !== 0) {
    console.error(`No pude dropear ${DB_NAME}:`);
    console.error(drop.stderr?.trim() ?? '');
    return 1;
  }
  const create = psql(containerCmd, 'postgres', `CREATE DATABASE ${DB_NAME} OWNER planb`);
  if (create.status !== 0) {
    console.error(`No pude crear ${DB_NAME}:`);
    console.error(create.stderr?.trim() ?? '');
    return 1;
  }

  const e2eConnection = withDatabase(devConnection, DB_NAME);

  // ── 3. Backend ───────────────────────────────────────────────────────────────
  console.log(`Levantando el backend en :${BACKEND_PORT} contra ${DB_NAME}...`);
  const backend = spawn(
    'dotnet',
    ['run', '--no-build', '--project', 'host/Planb.Api'],
    {
      cwd: BACKEND,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: 'Development',
        ASPNETCORE_URLS: `http://localhost:${BACKEND_PORT}`,
        ConnectionStrings__Planb: e2eConnection,
        ConnectionStrings__PlanbWolverine: e2eConnection,
        // Sin PLANB_SEED_CORPUS, igual que CI: el corpus es devex de `just dev`, no de los tests.
        PLANB_SEED_CORPUS: '',
      },
      stdio: ['ignore', 'ignore', 'inherit'],
      detached: process.platform !== 'win32',
      shell: process.platform === 'win32',
    },
  );
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
  const frontend = spawn('bun', ['dev'], {
    cwd: FRONTEND,
    env: { ...process.env, PORT: String(FRONTEND_PORT) },
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: process.platform !== 'win32',
    shell: process.platform === 'win32',
  });
  children.push(frontend);

  if (
    !(await waitForHttp(`http://localhost:${FRONTEND_PORT}`, FRONTEND_ATTEMPTS, 'frontend', frontend))
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
