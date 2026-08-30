/**
 * Primitivas compartidas por los dos modos que levantan el stack (backend + frontend) contra una
 * base de Postgres efímera propia: `run-e2e.ts` (corre Playwright) y `run-scratch.ts` (recorrer la
 * app a mano sin ensuciar la base de dev).
 *
 * Nació cuando el segundo consumidor (`run-scratch.ts`) necesitó exactamente lo mismo que ya vivía
 * en `run-e2e.ts`: la sonda de puerto, el drop/create de la base, el spawn de backend y frontend
 * con la connection string inyectada, y la espera a que el DevSeed termine. Lo que NO vive acá es
 * lo que diverge entre los dos modos (qué base usan, si siembran el corpus de demo, qué hacen
 * después de arrancar): eso lo decide cada script.
 */

import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
const BACKEND = resolve(ROOT, 'backend');
export const FRONTEND = resolve(ROOT, 'frontend');

/** Nombre fijo del container de Postgres que levanta `just infra-up` (ver docker-compose.yml). */
export const POSTGRES_CONTAINER = 'planb-postgres';

/**
 * Los mismos puertos que usa `just dev`, no unos libres cualquiera: son los puertos reales de la
 * app. Por eso ningún modo efímero puede convivir con el stack de dev arriba.
 */
export const BACKEND_PORT = 5000;
export const FRONTEND_PORT = 3000;

export const HEALTH_ATTEMPTS = 60;
export const FRONTEND_ATTEMPTS = 60;
const SEED_ATTEMPTS = 45;

/** Persona sembrada por el DevSeed. Su sign-in es el proxy de "seed listo" (igual que CI). */
const LUCIA = { email: 'lucia.mansilla@gmail.com', password: 'lucia.mansilla.12' };

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
 * Corta con un mensaje explicando el porqué si el backend o el frontend ya tienen algo escuchando
 * en su puerto. Los dos modos pisan a propósito los mismos puertos que `just dev` (misma URL, cero
 * fricción para levantarlos), así que ninguno puede convivir con el stack de dev arriba.
 */
export async function requireFreePorts(
  ports: readonly (readonly [port: number, label: string])[],
  who: string,
): Promise<boolean> {
  for (const [port, label] of ports) {
    if (await isPortInUse(port)) {
      console.error(`El puerto ${port} está ocupado (${label}).`);
      console.error('');
      console.error(`  ${who} levanta su propio stack contra una base efímera, así que el`);
      console.error('  stack de dev tiene que estar abajo. Cortá `just dev` y reintentá.');
      return false;
    }
  }
  return true;
}

/**
 * Reemplaza el `Database=` de la connection string del `.env`, preservando host, puerto y
 * credenciales. Se hace así y no armando la cadena de cero para no duplicar (ni filtrar) la
 * password que ya vive en el `.env`.
 */
export function withDatabase(connectionString: string, database: string): string {
  if (/(^|;)\s*Database\s*=/i.test(connectionString)) {
    return connectionString.replace(/(^|;)(\s*)Database\s*=[^;]*/i, `$1$2Database=${database}`);
  }
  return `${connectionString.replace(/;?\s*$/, '')};Database=${database}`;
}

/**
 * Lee la connection string de dev del entorno (la genera `just setup` en `.env`). Los dos modos la
 * usan como base para armar la suya: `withDatabase` le pisa el nombre de la base por la efímera.
 */
export function requireDevConnectionString(): string | undefined {
  const value = process.env.ConnectionStrings__Planb;
  if (!value) {
    console.error(
      'Falta ConnectionStrings__Planb en el env. Corré `just setup` para generar .env.',
    );
  }
  return value;
}

/**
 * Mata el árbol de procesos. En Windows hace falta `taskkill /T`: matar el `dotnet run` o el `bun
 * dev` padre deja vivo al hijo real (`Planb.Api`, los workers de Next), y ese hijo se queda con el
 * puerto tomado y con los DLL bloqueados para el próximo build.
 */
export function killTree(child: ChildProcess): void {
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

function psql(containerCmd: string, database: string, sql: string) {
  return spawnSync(
    containerCmd,
    [
      'exec',
      POSTGRES_CONTAINER,
      'psql',
      '-U',
      'planb',
      '-d',
      database,
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { encoding: 'utf8' },
  );
}

/**
 * El WITH (FORCE) desconecta sesiones colgadas de una corrida anterior que murió a mitad. Separada
 * de `recreateDatabase` porque el modo scratch la necesita sola: al cortar, dropea sin volver a
 * crear (el punto de ese modo es no dejar rastro).
 */
export function dropDatabase(containerCmd: string, dbName: string) {
  return psql(containerCmd, 'postgres', `DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
}

/**
 * Dropea y recrea `dbName` desde cero, primero verificando que Postgres responda. Devuelve false
 * (imprimiendo el motivo) ante cualquier falla; el caller corta con ese código.
 */
export async function recreateDatabase(containerCmd: string, dbName: string): Promise<boolean> {
  const probe = psql(containerCmd, 'postgres', 'SELECT 1');
  if (probe.status !== 0) {
    console.error(`No pude hablarle a Postgres en el container ${POSTGRES_CONTAINER}.`);
    console.error('  Levantá la infra con `just infra-up` y reintentá.');
    console.error(probe.stderr?.trim() ?? '');
    return false;
  }

  console.log(`Recreando la base efímera ${dbName}...`);
  const drop = dropDatabase(containerCmd, dbName);
  if (drop.status !== 0) {
    console.error(`No pude dropear ${dbName}:`);
    console.error(drop.stderr?.trim() ?? '');
    return false;
  }
  const create = psql(containerCmd, 'postgres', `CREATE DATABASE ${dbName} OWNER planb`);
  if (create.status !== 0) {
    console.error(`No pude crear ${dbName}:`);
    console.error(create.stderr?.trim() ?? '');
    return false;
  }
  return true;
}

/**
 * Espera a que `url` conteste, abortando si el proceso que la tiene que servir murió antes.
 *
 * Ese chequeo del proceso no es paranoia: sin él, un 200 de OTRO servidor en el mismo puerto se
 * lee como éxito. Es la mitad complementaria de `isPortInUse`, y las dos juntas son lo que hace que
 * "arrancó bien" signifique lo que dice.
 */
export async function waitForHttp(
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
export async function waitForSeed(): Promise<boolean> {
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

/**
 * Levanta el backend contra `connectionString`. `seedCorpus` viaja como `PLANB_SEED_CORPUS`: E2E lo
 * deja vacío para no ensuciarle los asserts de conteo a los specs, scratch lo prende porque su punto
 * es tener datos para explorar. Hoy la diferencia no se nota: ningún código del backend lee esa
 * variable todavía, así que los dos modos siembran lo mismo (personas y catálogo, sin reseñas). El
 * seeder que la va a leer es el del issue #374.
 */
export function spawnBackend(connectionString: string, seedCorpus: string): ChildProcess {
  return spawn('dotnet', ['run', '--no-build', '--project', 'host/Planb.Api'], {
    cwd: BACKEND,
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: `http://localhost:${BACKEND_PORT}`,
      ConnectionStrings__Planb: connectionString,
      ConnectionStrings__PlanbWolverine: connectionString,
      PLANB_SEED_CORPUS: seedCorpus,
    },
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: process.platform !== 'win32',
    shell: process.platform === 'win32',
  });
}

/**
 * `next build` del frontend. Se corre antes de `spawnFrontend('start')`, igual que en CI.
 * Devuelve el exit code para que el caller decida; no tira.
 */
export function buildFrontend(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('bun', ['run', 'build'], {
      cwd: FRONTEND,
      env: { ...process.env },
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

/**
 * Levanta el frontend. `mode: 'start'` sirve un build de producción, que es lo que hace CI
 * (`bun next start`); `dev` levanta el dev server con Turbopack, que es más rápido pero tolera
 * cosas distintas. Requiere que el build ya exista: ver `buildFrontend`.
 */
export function spawnFrontend(mode: 'dev' | 'start' = 'dev'): ChildProcess {
  const command = mode === 'start' ? ['next', 'start', '-p', String(FRONTEND_PORT)] : ['dev'];
  return spawn('bun', command, {
    cwd: FRONTEND,
    env: { ...process.env, PORT: String(FRONTEND_PORT) },
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: process.platform !== 'win32',
    shell: process.platform === 'win32',
  });
}
