import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
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
