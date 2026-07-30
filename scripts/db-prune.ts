/**
 * Barre las bases `planb_*` huérfanas: quedan de corridas de tests o de sesiones scratch que no
 * llegaron a correr su propio cleanup (un proceso matado a la fuerza a mitad de camino, por
 * ejemplo, o el bug que dejaba IdentityDatabaseTests sin dropear nunca su base). No hay nada que
 * las borre sola: esta es la receta manual de mantenimiento para ese residuo.
 *
 * Match: `LIKE 'planb\_%'`. El `_` de LIKE es wildcard de un caracter, así que va escapado (si no,
 * matchearía cualquier `planbX...`, no solo las que arrancan con el separador real). Excluye
 * exactamente `planb`, la base de desarrollo: a diferencia de `db-reset` (que SÍ la dropea y
 * recrea de cero), esta receta no la toca. Todo lo demás que matchee es candidato: efímeras de
 * test, de un `dev-scratch` sin cerrar bien, de una corrida de E2E vieja.
 *
 * Ej: `bun scripts/db-prune.ts` (o `just db-prune`)
 */

import { spawnSync } from 'node:child_process';
import { detectContainerRuntime } from './detect-container.ts';
import { POSTGRES_CONTAINER, dropDatabase } from './lib/dev-stack.ts';

interface OrphanDatabase {
  name: string;
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/** Lista las bases `planb_*` huérfanas (todo menos `planb`) con su tamaño en bytes. */
function listOrphans(containerCmd: string): OrphanDatabase[] | undefined {
  const query =
    "SELECT datname, pg_database_size(datname) FROM pg_database " +
    "WHERE datname LIKE 'planb\\_%' AND datname <> 'planb' ORDER BY datname";

  const result = spawnSync(
    containerCmd,
    [
      'exec',
      POSTGRES_CONTAINER,
      'psql',
      '-U',
      'planb',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
      '-F',
      '|',
      '-c',
      query,
    ],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    console.error(`No pude hablarle a Postgres en el container ${POSTGRES_CONTAINER}.`);
    console.error('  Levantá la infra con `just infra-up` y reintentá.');
    console.error(result.stderr?.trim() ?? '');
    return undefined;
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name, bytes] = line.split('|');
      return { name, bytes: Number(bytes) };
    });
}

function main(): number {
  const containerCmd = detectContainerRuntime();

  const orphans = listOrphans(containerCmd);
  if (orphans === undefined) {
    return 1;
  }

  if (orphans.length === 0) {
    console.log('No hay bases huérfanas para barrer.');
    return 0;
  }

  const totalBytes = orphans.reduce((sum, db) => sum + db.bytes, 0);
  console.log(`Encontré ${orphans.length} base(s) huérfana(s), ${formatBytes(totalBytes)} en total:`);
  for (const db of orphans) {
    console.log(`  ${db.name} (${formatBytes(db.bytes)})`);
  }
  console.log('');

  let dropped = 0;
  const failed: string[] = [];
  for (const db of orphans) {
    const drop = dropDatabase(containerCmd, db.name);
    if (drop.status === 0) {
      dropped++;
    } else {
      failed.push(db.name);
      console.error(`No pude dropear ${db.name}:`);
      console.error(drop.stderr?.trim() ?? '');
    }
  }

  console.log(`Listo: ${dropped}/${orphans.length} base(s) borrada(s), ${formatBytes(totalBytes)} liberados.`);
  if (failed.length > 0) {
    console.error(`Fallaron: ${failed.join(', ')}`);
    return 1;
  }
  return 0;
}

process.exit(main());
