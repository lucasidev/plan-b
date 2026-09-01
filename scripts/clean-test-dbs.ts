#!/usr/bin/env bun
/**
 * Dropea las bases efímeras que dejaron corridas de tests interrumpidas.
 *
 * Cada clase de test de integración crea su propia base (`planb_<label>_<guid>`) y la dropea al
 * terminar (ADR-0027). Ese drop vive en el `DisposeAsync` de la fixture, así que **no corre si el
 * proceso muere antes**: un timeout, un Ctrl+C, Postgres caído a mitad. Cada una de esas deja una
 * base para siempre, porque el guid del nombre no se repite y ningún drop posterior la pisa.
 *
 * Antes de esto la única salida era `just infra-reset`, que vuela el volumen entero y obliga a
 * resembrar el catálogo.
 *
 * **Salta las que están en uso.** Una base con conexiones abiertas es la de una corrida que está
 * pasando ahora mismo, posiblemente en otra terminal. Dropearla con FORCE la mataría a mitad.
 *
 * Uso: bun scripts/clean-test-dbs.ts [--dry-run]
 */

import { detectContainerRuntime } from './detect-container.ts';
import { psql } from './lib/dev-stack.ts';

/**
 * `planb_<label>_<32 hex>`: el nombre que arma la fixture. El patrón es exacto a propósito, para
 * no rozar `planb` (la de desarrollo), `planb_e2e` ni `planb_scratch`.
 */
const TEST_DB_PATTERN = '^planb_[a-z]+_[0-9a-f]{32}$';

const dryRun = process.argv.includes('--dry-run');
const containerCmd = detectContainerRuntime();

const listed = psql(
  containerCmd,
  'postgres',
  `SELECT d.datname,
          (SELECT count(*) FROM pg_stat_activity a WHERE a.datname = d.datname) AS conns
     FROM pg_database d
    WHERE d.datname ~ '${TEST_DB_PATTERN}'
    ORDER BY d.datname;`,
);

if (listed.status !== 0) {
  console.error('No pude hablarle a Postgres. ¿Está levantada la infra (`just infra-up`)?');
  console.error(listed.stderr?.trim() ?? '');
  process.exit(1);
}

const rows = (listed.stdout ?? '')
  .split('\n')
  .map((line) => line.split('|').map((cell) => cell.trim()))
  .filter(([name, conns]) => name?.startsWith('planb_') && conns !== undefined)
  .map(([name, conns]) => ({ name: name as string, conns: Number(conns) }));

if (rows.length === 0) {
  console.log('clean-test-dbs: no quedó ninguna base de test huérfana.');
  process.exit(0);
}

const inUse = rows.filter((r) => r.conns > 0);
const orphans = rows.filter((r) => r.conns === 0);

for (const { name, conns } of inUse) {
  console.log(`  ${name}: en uso (${conns} conexiones), no se toca`);
}

for (const { name } of orphans) {
  if (dryRun) {
    console.log(`  ${name}: se dropearía`);
    continue;
  }
  const dropped = psql(containerCmd, 'postgres', `DROP DATABASE IF EXISTS "${name}"`);
  if (dropped.status === 0) {
    console.log(`  ${name}: dropeada`);
  } else {
    console.error(`  ${name}: no se pudo dropear`);
    console.error(dropped.stderr?.trim() ?? '');
  }
}

const verb = dryRun ? 'se dropearían' : 'dropeadas';
console.log(`clean-test-dbs: ${orphans.length} ${verb}, ${inUse.length} en uso.`);
