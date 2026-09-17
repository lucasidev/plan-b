import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { doctorEnvironment, runReactDoctor } from './run-react-doctor.ts';

const repoRoot = resolve(import.meta.dirname, '..');

test('el entorno del hook conserva la raíz y las rutas relativas desde frontend', () => {
  const gitDir = spawnSync('git', ['rev-parse', '--absolute-git-dir'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(gitDir.status, 0, gitDir.stderr);
  const inherited = { ...process.env, GIT_DIR: gitDir.stdout.trim() };
  const result = spawnSync('git', ['rev-parse', '--show-toplevel', '--show-prefix'], {
    cwd: join(repoRoot, 'frontend'),
    env: doctorEnvironment(repoRoot, inherited),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const [root, prefix] = result.stdout.trim().split(/\r?\n/);
  assert.equal(resolve(root), repoRoot);
  assert.equal(prefix, 'frontend/');
  assert.equal(inherited.GIT_DIR, gitDir.stdout.trim());
});

for (const exitCode of [0, 7]) {
  test(`ejecuta el scanner instalado con su gate y propaga exit ${exitCode}`, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'planb-react-doctor-'));
    try {
      const binDirectory = join(fixture, 'frontend/node_modules/react-doctor/bin');
      mkdirSync(binDirectory, { recursive: true });
      writeFileSync(
        join(binDirectory, 'react-doctor.js'),
        `const assert = require('node:assert/strict');
const path = require('node:path');
assert.equal(process.cwd(), path.join(process.env.GIT_WORK_TREE, 'frontend'));
assert.deepEqual(process.argv.slice(2), [
  '--scope', 'changed', '--base', 'origin/main', '--blocking', 'error', '--no-score', '--yes'
]);
process.exitCode = ${exitCode};`,
      );
      assert.equal(runReactDoctor(fixture), exitCode);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
}

test('la raíz explícita no descarta las otras variables del proceso', () => {
  const inherited = { PATH: 'runtime', GIT_DIR: 'metadata', GIT_WORK_TREE: 'wrong-root' };
  assert.deepEqual(doctorEnvironment(repoRoot, inherited), {
    ...inherited,
    GIT_WORK_TREE: repoRoot,
  });
  assert.equal(inherited.GIT_WORK_TREE, 'wrong-root');
});
