/**
 * Corre `<runtime> compose <args>` con el runtime que elige detect-container.ts.
 *
 * Existe porque el Justfile tenía la detección en una variable global
 * (`container_cmd := ` con backticks), y just evalúa las asignaciones antes de
 * correr cualquier receta: con el daemon del container apagado fallaban 39 de
 * las 40 recetas, incluidas las 32 que no tocan un container (lint, tests,
 * docs, migraciones). Detectar acá adentro hace que el chequeo de daemon pase
 * solo cuando un comando de compose se va a ejecutar de verdad, que es el
 * único momento en que hace falta y el único en que su error sirve.
 *
 * Uso: bun scripts/compose.ts down -v
 */

import { spawnSync } from 'node:child_process';
import { detectContainerRuntime } from './detect-container.ts';

const runtime = detectContainerRuntime();
const result = spawnSync(runtime, ['compose', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
