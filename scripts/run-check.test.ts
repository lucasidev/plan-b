import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { main, readTail, runCheck } from './run-check.ts';

test('conserva stdout, stderr y el exit code aunque falle al principio de un log grande', async () => {
  const result = await runCheck(
    [
      process.execPath,
      '-e',
      'console.error("early failure"); console.log("x".repeat(50000)); process.exit(7)',
    ],
    process.cwd(),
  );
  try {
    assert.equal(result.exitCode, 7);
    const full = readFileSync(result.logPath, 'utf8');
    assert.match(full, /early failure/);
    assert.ok(full.length > 50000);
    assert.ok(readTail(result.logPath).length < 6100);
    assert.match(readTail(result.logPath), /log completo/);
  } finally {
    rmSync(dirname(result.logPath), { recursive: true, force: true });
  }
});

test('un ejecutable inexistente no se convierte en verde', async () => {
  const result = await runCheck(['planb-nonexistent-check-executable'], process.cwd());
  try {
    assert.equal(result.exitCode, 127);
    assert.ok(result.launchError);
  } finally {
    rmSync(dirname(result.logPath), { recursive: true, force: true });
  }
});

test('los argumentos se pasan literalmente, sin interpretación de shell', async () => {
  const literal = 'a b; $(echo unexpected) "quoted"';
  const result = await runCheck(
    [process.execPath, '-e', 'console.log(process.argv[1])', literal],
    process.cwd(),
  );
  try {
    assert.equal(result.exitCode, 0);
    assert.equal(readFileSync(result.logPath, 'utf8').trim(), literal);
  } finally {
    rmSync(dirname(result.logPath), { recursive: true, force: true });
  }
});

test('el wrapper propaga el fallo del proceso al invocante, no solo al resumen', () => {
  const result = spawnSync(
    process.execPath,
    [resolve('scripts/run-check.ts'), '--', process.execPath, '-e', 'process.exit(9)'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 9);
  assert.match(result.stdout, /ROJO: exit 9/);
  const logPath = result.stdout.match(/Log completo: (.+)/)?.[1]?.trim();
  assert.ok(logPath);
  rmSync(dirname(logPath), { recursive: true, force: true });
});

test('sin comando o con opciones desconocidas no ejecuta nada', async () => {
  assert.equal(await main([]), 2);
  assert.equal(await main(['--']), 2);
  assert.equal(await main(['--unknown', '--', 'bun']), 2);
  assert.equal(await main(['--cwd']), 2);
  assert.equal(await main(['--cwd', '--', 'bun']), 2);
});

test('un check verde voluminoso no vuelca el log al contexto', () => {
  const result = spawnSync(
    process.execPath,
    [
      resolve('scripts/run-check.ts'),
      '--',
      process.execPath,
      '-e',
      'console.log("verbose-marker".repeat(5000))',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /VERDE: exit 0/);
  // El resumen incluye el comando, pero nunca la salida repetida del proceso.
  assert.ok(result.stdout.length < 1000);
  const logPath = result.stdout.match(/Log completo: (.+)/)?.[1]?.trim();
  assert.ok(logPath);
  try {
    assert.ok(readFileSync(logPath, 'utf8').length > 60000);
  } finally {
    rmSync(dirname(logPath), { recursive: true, force: true });
  }
});

test('un proceso interrumpido no cuenta como éxito', async () => {
  const result = await runCheck(
    [process.execPath, '-e', 'process.kill(process.pid, "SIGTERM")'],
    process.cwd(),
  );
  try {
    assert.notEqual(result.exitCode, 0);
  } finally {
    rmSync(dirname(result.logPath), { recursive: true, force: true });
  }
});

test('cancelar el check corta su árbol y devuelve fallo aunque el padre fuera a salir verde', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'planb-check-cancel-'));
  const ready = join(directory, 'ready.json');
  const controller = new AbortController();
  const leaf = 'setTimeout(() => {}, 4000)';
  const parent = `
    const { spawn } = require('node:child_process');
    const { writeFileSync } = require('node:fs');
    const leaf = spawn(process.execPath, ['-e', ${JSON.stringify(leaf)}], { stdio: 'ignore' });
    writeFileSync(process.argv[1], JSON.stringify({ parent: process.pid, leaf: leaf.pid }));
    setTimeout(() => process.exit(0), 2000);
  `;
  let result: Awaited<ReturnType<typeof runCheck>> | undefined;
  try {
    const running = runCheck(
      [process.execPath, '-e', parent, ready],
      process.cwd(),
      controller.signal,
    );
    const deadline = Date.now() + 5000;
    while (!existsSync(ready) && Date.now() < deadline) await delay(20);
    assert.ok(existsSync(ready), 'Child did not start');
    const pids = JSON.parse(readFileSync(ready, 'utf8')) as { parent: number; leaf: number };
    controller.abort(130);
    result = await running;
    assert.equal(result.exitCode, 130);
    for (const pid of [pids.parent, pids.leaf]) {
      // taskkill y la recolección del grupo POSIX pueden terminar después del evento exit.
      let alive = true;
      const exitDeadline = Date.now() + 2000;
      while (alive && Date.now() < exitDeadline) {
        try {
          process.kill(pid, 0);
          await delay(20);
        } catch {
          alive = false;
        }
      }
      assert.equal(alive, false, `Process ${pid} survived cancellation`);
    }
  } finally {
    controller.abort(130);
    if (result) rmSync(dirname(result.logPath), { recursive: true, force: true });
    rmSync(directory, { recursive: true, force: true });
  }
});

for (const [signal, expected] of [
  ['SIGINT', 130],
  ['SIGTERM', 143],
] as const) {
  test(`main propaga ${signal} a la cancelación y sale con ${expected}`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'planb-check-signal-'));
    const ready = join(directory, 'ready');
    const command = [
      process.execPath,
      '-e',
      'require("node:fs").writeFileSync(process.argv[1], "ready"); setTimeout(() => {}, 3000)',
      ready,
    ];
    // Emisión dentro de un proceso aislado: Windows no entrega SIGTERM con process.kill.
    const harness = `
      const { main } = await import(${JSON.stringify(resolve('scripts/run-check.ts').replaceAll('\\', '/'))});
      const timer = setInterval(() => {
        if (require('node:fs').existsSync(${JSON.stringify(ready)})) {
          clearInterval(timer);
          process.emit(${JSON.stringify(signal)});
        }
      }, 20);
      process.exitCode = await main(${JSON.stringify(command)});
      clearInterval(timer);
    `;
    const result = spawnSync(process.execPath, ['-e', harness], {
      encoding: 'utf8',
      timeout: 6000,
    });
    const logPath = result.stdout?.match(/Log completo: (.+)/)?.[1]?.trim();
    try {
      assert.equal(result.status, expected, result.stderr);
      assert.match(result.stdout, new RegExp(`ROJO: exit ${expected}`));
    } finally {
      if (logPath) rmSync(dirname(logPath), { recursive: true, force: true });
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

test('una cancelación previa no llega a lanzar el comando', async () => {
  const controller = new AbortController();
  controller.abort(143);
  const result = await runCheck(
    [process.execPath, '-e', 'console.log("unexpected")'],
    process.cwd(),
    controller.signal,
  );
  try {
    assert.equal(result.exitCode, 143);
    assert.equal(readFileSync(result.logPath, 'utf8'), '');
  } finally {
    rmSync(dirname(result.logPath), { recursive: true, force: true });
  }
});
