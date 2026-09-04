#!/usr/bin/env bun
/**
 * Lo afectado (#423): antes de pushear un cambio chico recién commiteado, señal rápida de qué
 * testear sin correr la suite entera. Reemplaza la lógica que vivía inline en el Justfile
 * (`backend-test-affected`, `frontend-test-affected`, `test-affected`), escrita en sintaxis de
 * PowerShell: la regla del proyecto es que la lógica de scripts vive en TypeScript con bun, que
 * es lo que corre igual en Windows y en Linux.
 *
 * `dotnet-affected` y `vitest --changed` comparan contra commits, no contra el working tree: el
 * cambio tiene que estar commiteado para que aparezca como afectado.
 *
 * Uso:
 *   bun scripts/test-affected.ts                 backend y frontend
 *   bun scripts/test-affected.ts --backend        solo backend
 *   bun scripts/test-affected.ts --frontend       solo frontend
 *   bun scripts/test-affected.ts --from <ref>     ref base del diff (default origin/main)
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BACKEND = resolve(ROOT, 'backend');
const FRONTEND = resolve(ROOT, 'frontend');

/** dotnet-affected devuelve este código cuando no hay proyectos backend afectados: no es una falla. */
const NO_PROJECTS_AFFECTED = 166;

const args = process.argv.slice(2);
const fromIndex = args.indexOf('--from');
const from = fromIndex === -1 ? 'origin/main' : (args[fromIndex + 1] ?? 'origin/main');
const wantsBackend = args.includes('--backend');
const wantsFrontend = args.includes('--frontend');
// Sin `--backend` ni `--frontend`, corren los dos.
const runBackend = wantsBackend || !wantsFrontend;
const runFrontend = wantsFrontend || !wantsBackend;

/**
 * El manifest de local tools vive en `backend/.config/dotnet-tools.json`: dotnet lo encuentra
 * subiendo directorios desde el cwd, así que el comando corre desde `backend/` (con
 * `--repository-path ..` apuntando a la raíz del repo, donde vive el `.git`); correrlo desde la
 * raíz no encuentra la herramienta. Sin proyectos backend afectados (ej. un PR 100% frontend) sale
 * con 166: no es una falla, no hay nada que testear.
 */
function backendAffected(): boolean {
  const affected = spawnSync(
    'dotnet',
    [
      'affected',
      '--repository-path',
      '..',
      '--output-dir',
      'backend',
      '--from',
      from,
      '--to',
      'HEAD',
      '--format',
      'Traversal',
    ],
    { cwd: BACKEND, stdio: 'inherit' },
  );

  if (affected.status === NO_PROJECTS_AFFECTED) {
    console.log('backend-test-affected: sin proyectos backend afectados');
    return true;
  }
  if (affected.status !== 0) {
    return false;
  }

  const test = spawnSync('dotnet', ['test', 'affected.proj'], { cwd: BACKEND, stdio: 'inherit' });
  return test.status === 0;
}

/**
 * `passWithNoTests` está en false (vitest.config.ts): cero archivos afectados (ej. un PR 100%
 * backend) sale con 1 y el mensaje "No test files found", no es una falla real.
 */
function frontendAffected(): boolean {
  const run = spawnSync('bunx', ['vitest', 'run', '--changed', from], {
    cwd: FRONTEND,
    encoding: 'utf8',
    shell: true,
  });

  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  console.log(output);

  if (run.status === 0) return true;
  if (output.includes('No test files found')) {
    console.log('frontend-test-affected: sin archivos frontend afectados');
    return true;
  }
  return false;
}

const results: boolean[] = [];
if (runBackend) results.push(backendAffected());
if (runFrontend) results.push(frontendAffected());

process.exit(results.every(Boolean) ? 0 : 1);
