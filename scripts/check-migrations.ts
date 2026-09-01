#!/usr/bin/env bun
/**
 * ¿Hay un cambio en el modelo de EF Core que nadie migró?
 *
 * Existe porque el agujero era real y silencioso: cambiar un `ToTable`, una columna o un índice en
 * una configuración **compila y formatea igual**, y el desfasaje entre el modelo y las migraciones
 * recién aparece cuando un test de integración toca esa tabla. Una tabla sin cobertura de
 * integración lo dejaba pasar hasta el deploy, donde el schema real lo aplica `migrate-db`.
 *
 * Corre `dotnet ef migrations has-pending-model-changes` por DbContext, que devuelve exit distinto
 * de cero cuando el snapshot del modelo no coincide con las migraciones acumuladas.
 *
 * Necesita el proyecto compilado: usa `--no-build` para no volver a compilar la solución entera.
 * En CI va después del paso de Build, con la misma configuración.
 *
 * Uso: bun scripts/check-migrations.ts [--configuration Release]
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BACKEND = resolve(ROOT, 'backend');

/** Un DbContext por módulo, cada uno con su schema propio (ADR-0017). */
const CONTEXTS = [
  { module: 'identity', name: 'Identity' },
  { module: 'academic', name: 'Academic' },
  { module: 'reviews', name: 'Reviews' },
] as const;

const configIndex = process.argv.indexOf('--configuration');
const configuration = configIndex === -1 ? 'Debug' : (process.argv[configIndex + 1] ?? 'Debug');

const pending: string[] = [];
const failed: string[] = [];

for (const { module, name } of CONTEXTS) {
  const result = spawnSync(
    'dotnet',
    [
      'ef',
      'migrations',
      'has-pending-model-changes',
      '--project',
      `modules/${module}/src/Planb.${name}.Infrastructure`,
      '--startup-project',
      'host/Planb.Api',
      '--context',
      `${name}DbContext`,
      '--configuration',
      configuration,
      '--no-build',
    ],
    { cwd: BACKEND, encoding: 'utf8' },
  );

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  // El comando devuelve 1 tanto por "hay cambios pendientes" como por no poder correr (proyecto
  // sin compilar, contexto mal escrito). Distinguirlos importa: lo segundo no es un hallazgo.
  if (result.status === 0) {
    console.log(`  ${name}DbContext: sin cambios pendientes`);
  } else if (/changes have been made to the model/i.test(output)) {
    pending.push(name);
    console.error(`  ${name}DbContext: HAY CAMBIOS SIN MIGRAR`);
  } else {
    failed.push(name);
    console.error(`  ${name}DbContext: no se pudo chequear`);
    console.error(output.trim().split('\n').slice(-5).join('\n'));
  }
}

if (pending.length > 0) {
  console.error(
    `\ncheck-migrations: ${pending.join(', ')} tiene${pending.length > 1 ? 'n' : ''} cambios de` +
      ' modelo sin migración.\n' +
      'Generala con: just migrate-add <modulo> <Nombre>',
  );
  process.exit(1);
}

if (failed.length > 0) {
  console.error('\ncheck-migrations: el chequeo no pudo correr. ¿Está compilado el backend?');
  process.exit(1);
}

console.log('check-migrations: el modelo y las migraciones están en sync.');
