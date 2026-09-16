#!/usr/bin/env bun
/** Guarda la salida completa fuera del contexto; el código de salida sigue siendo el del check. */
import { spawn } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { killTree } from './lib/process-tree.ts';

export function readTail(path: string, maxBytes = 6_000): string {
  const fd = openSync(path, 'r');
  try {
    const size = statSync(path).size;
    const buffer = Buffer.alloc(Math.min(size, maxBytes));
    const count = readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length));
    return `${size > maxBytes ? '[... salida anterior en el log completo ...]\n' : ''}${buffer.subarray(0, count).toString('utf8')}`;
  } finally {
    closeSync(fd);
  }
}

export async function runCheck(command: string[], cwd: string, signal?: AbortSignal) {
  if (!command[0]) throw new Error('Missing command');
  const logPath = join(mkdtempSync(join(tmpdir(), 'planb-check-')), 'output.log');
  const fd = openSync(logPath, 'w');
  const started = Date.now();
  let launchError: string | undefined;
  let exitCode: number;
  let removeAbortListener = () => {};
  try {
    exitCode = await new Promise<number>((done) => {
      if (signal?.aborted) {
        done(signal.reason === 130 ? 130 : 143);
        return;
      }
      const child = spawn(command[0], command.slice(1), {
        cwd,
        shell: false,
        windowsHide: true,
        // Un grupo propio permite cerrar también los nietos al cancelar en POSIX.
        detached: process.platform !== 'win32',
        stdio: ['ignore', fd, fd],
      });
      let interruptedCode: number | undefined;
      const abort = () => {
        if (child.exitCode !== null || child.signalCode !== null) return;
        interruptedCode = signal?.reason === 130 ? 130 : 143;
        killTree(child);
      };
      signal?.addEventListener('abort', abort, { once: true });
      removeAbortListener = () => signal?.removeEventListener('abort', abort);
      child.once('error', (error) => {
        launchError = error.message;
        done(interruptedCode ?? 127);
      });
      child.once('exit', (code) => done(interruptedCode ?? code ?? 1));
    });
  } finally {
    removeAbortListener();
    closeSync(fd);
  }
  return { exitCode, logPath, durationMs: Date.now() - started, launchError };
}

export async function main(args: string[]): Promise<number> {
  const hasCwd = args[0] === '--cwd';
  const cwdArg = hasCwd ? args[1] : undefined;
  const remainder = args.slice(hasCwd ? 2 : 0);
  // Bun consume el primer `--` después del script cuando no hay opciones previas.
  const command = remainder[0] === '--' ? remainder.slice(1) : remainder;
  if (
    (hasCwd && (!cwdArg || cwdArg.startsWith('--'))) ||
    !command[0] ||
    command[0].startsWith('-')
  ) {
    console.error('Uso: bun scripts/run-check.ts [--cwd directorio] -- ejecutable [argumentos]');
    return 2;
  }
  const cwd = resolve(cwdArg ?? '.');
  const controller = new AbortController();
  const interrupt = () => controller.abort(130);
  const terminate = () => controller.abort(143);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  let result: Awaited<ReturnType<typeof runCheck>>;
  try {
    result = await runCheck(command, cwd, controller.signal);
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
  }
  console.log(
    `${result.exitCode === 0 ? 'VERDE' : 'ROJO'}: exit ${result.exitCode}, ${(result.durationMs / 1000).toFixed(1)}s\nComando: ${JSON.stringify(command)}\nDirectorio: ${cwd}\nLog completo: ${result.logPath}`,
  );
  if (result.launchError) console.error(result.launchError);
  if (result.exitCode !== 0) console.error(readTail(result.logPath));
  return result.exitCode;
}

if (import.meta.main) process.exitCode = await main(process.argv.slice(2));
