/**
 * Tails compose logs across services or for a specific one. Replaces a bash
 * recipe that used `[ -z ... ]` and would fail on Windows without bash.
 *
 * Usage:
 *   bun scripts/infra-logs.ts <container-cmd>          # all services
 *   bun scripts/infra-logs.ts <container-cmd> postgres # one service
 *
 * <container-cmd> is whatever the Justfile resolved (`podman` or `docker`),
 * passed in as the first argument.
 */

import { spawn } from 'node:child_process';

const [containerCmd, service] = process.argv.slice(2);

if (!containerCmd) {
  process.stderr.write(
    'Usage: bun scripts/infra-logs.ts <container-cmd> [service]\n',
  );
  process.exit(1);
}

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
