/**
 * Cross-platform dev runner: spawns backend (dotnet watch) and frontend (bun dev)
 * in parallel, line-prefixes their output, and shuts both down cleanly on Ctrl+C
 * or SIGTERM, killing the whole process tree (Next workers, dotnet sub-procs).
 *
 * Replaces a bash recipe that broke on Windows when cygpath wasn't on PATH. Per
 * the project convention all scripts are TypeScript run via bun.
 *
 * Usage: bun scripts/dev.ts
 */

import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const IS_WIN = process.platform === 'win32';

type Service = {
  name: string;
  color: (s: string) => string;
  cwd: string;
  command: string;
  args: string[];
};

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const magenta = (s: string) => `\x1b[35m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const services: Service[] = [
  {
    name: 'backend',
    color: cyan,
    cwd: resolve(ROOT, 'backend/host/Planb.Api'),
    command: 'dotnet',
    args: ['watch', 'run'],
  },
  {
    name: 'frontend',
    color: magenta,
    cwd: resolve(ROOT, 'frontend'),
    command: 'bun',
    args: ['dev'],
  },
];

function prefixStream(
  service: Service,
  stream: NodeJS.ReadableStream,
  sink: NodeJS.WritableStream,
) {
  const tag = service.color(`[${service.name}]`);
  let buffer = '';
  stream.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) sink.write(`${tag} ${line}\n`);
  });
  stream.on('end', () => {
    if (buffer.length > 0) sink.write(`${tag} ${buffer}\n`);
  });
}

function start(service: Service): ChildProcess {
  // shell:true on Windows is required so dotnet.cmd / bun.cmd shims resolve.
  // On Unix we spawn directly and put the child in its own process group so we
  // can later signal the whole group atomically.
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: IS_WIN,
    detached: !IS_WIN,
    env: {
      ...process.env,
      // Both Next (via Chalk) and most Node tooling honor FORCE_COLOR; dotnet
      // typically writes plain when stdout is piped so this is a frontend-only
      // win, but it also doesn't hurt the backend.
      FORCE_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (child.stdout) prefixStream(service, child.stdout, process.stdout);
  if (child.stderr) prefixStream(service, child.stderr, process.stderr);
  child.on('error', (err) => {
    process.stderr.write(red(`[${service.name}] failed to start: ${err.message}\n`));
  });
  return child;
}

/**
 * Terminate a child and every grand-child. Required on Windows because
 * `child.kill()` only signals the direct cmd.exe wrapper, leaving Next worker
 * `node.exe` processes orphaned with the dev server port still bound. On Unix
 * we created the child as its own process group leader so we can `kill -SIGTERM
 * -<pgid>` (passing a negative pid to process.kill).
 */
function killTree(child: ChildProcess) {
  if (child.exitCode !== null || child.killed || !child.pid) return;
  if (IS_WIN) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

const children = services.map((s) => ({ service: s, child: start(s) }));

let shuttingDown = false;

function killAll() {
  for (const { child } of children) killTree(child);
}

// Ctrl+C: in addition to the OS console propagating to the foreground group,
// we forcibly kill the tree because on Windows the cmd.exe wrappers do not
// reliably forward CTRL_C_EVENT to grand-children spawned by bun/dotnet.
process.on('SIGINT', () => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(dim('\nShutting down (Ctrl+C)...\n'));
  killAll();
});

// SIGTERM from process managers, `kill <pid>` or our test harness.
process.on('SIGTERM', () => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(dim('\nShutting down (SIGTERM)...\n'));
  killAll();
});

let pendingExits = children.length;
let firstFailureCode = 0;
for (const { service, child } of children) {
  child.on('exit', (code, signal) => {
    pendingExits -= 1;
    const status = code !== null ? `code ${code}` : signal ? `signal ${signal}` : '?';
    process.stdout.write(
      `${service.color(`[${service.name}]`)} ${dim(`exited (${status})`)}\n`,
    );
    if (typeof code === 'number' && code !== 0 && firstFailureCode === 0) {
      firstFailureCode = code;
    }
    // If one service dies first while the other is still running, take the
    // rest with it. Half the stack alone is rarely what anyone wants.
    if (!shuttingDown && pendingExits > 0) {
      shuttingDown = true;
      process.stdout.write(
        dim(`${service.name} exited first; stopping the rest...\n`),
      );
      killAll();
    }
    if (pendingExits === 0) process.exit(firstFailureCode);
  });
}
