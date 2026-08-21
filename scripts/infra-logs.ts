/**
 * Tails compose logs across services or for a specific one. Replaces a bash
 * recipe that used `[ -z ... ]` and would fail on Windows without bash.
 *
 * Usage:
 *   bun scripts/infra-logs.ts          # all services
 *   bun scripts/infra-logs.ts postgres # one service
 *
 * El runtime lo detecta este script, igual que db-prune, run-e2e y run-scratch.
 * Antes lo recibía como argumento desde una variable global del Justfile, que
 * just evaluaba antes de correr cualquier receta: con el daemon apagado rompía
 * también las 32 recetas que no tocan un container.
 */

import { spawn } from 'node:child_process';
import { detectContainerRuntime } from './detect-container.ts';

const [service] = process.argv.slice(2);
const containerCmd = detectContainerRuntime();

const args = ['compose', 'logs', '-f'];
if (service) args.push(service);

const child = spawn(containerCmd, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

// Forward Ctrl+C explicitly. On Linux the console group does it for us, but
// being explicit keeps the behavior identical on Windows where signals are
// emulated.
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});
