import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { localChanges, tree, workingTree } from './lib/verification-git.ts';
import { decide } from './lib/verification-policy.ts';
import { readEvidence, receiptPath, writeEvidence } from './lib/verification-receipts.ts';
import { main, parseArgs } from './verify.ts';

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'planb-verify-test-'));
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  git('init', '-q');
  mkdirSync(resolve(root, 'scripts'));
  writeFileSync(
    resolve(root, 'scripts/witness.test.ts'),
    'import { test, expect } from "bun:test"; test("witness", () => expect(true).toBe(true));',
  );
  git('add', '.');
  git(
    '-c',
    'user.name=Verification Test',
    '-c',
    'user.email=verify@example.invalid',
    '-c',
    'core.hooksPath=',
    'commit',
    '-qm',
    'test',
  );
  return { root, git, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

test('staged, unstaged, nuevos y eliminados cambian la evidencia local', () => {
  const repo = fixture();
  try {
    const before = workingTree(repo.root);
    assert.ok(tree(repo.root, 'HEAD')['scripts/witness.test.ts']);
    writeFileSync(resolve(repo.root, 'scripts/witness.test.ts'), 'changed');
    repo.git('add', '.');
    writeFileSync(resolve(repo.root, 'new.ts'), 'new');
    assert.deepEqual(localChanges(repo.root, 'HEAD').sort(), ['new.ts', 'scripts/witness.test.ts']);
    assert.notDeepEqual(workingTree(repo.root), before);
    rmSync(resolve(repo.root, 'scripts/witness.test.ts'));
    assert.equal(workingTree(repo.root)['scripts/witness.test.ts'], undefined);
  } finally {
    repo.dispose();
  }
});

test('el runner reutiliza verde, conserva fallo y no certifica --plan ni --ci-only', async () => {
  const repo = fixture();
  const args = ['--only', 'scripts-test', '--from', 'HEAD'];
  const folder = resolve(repo.root, '.git/planb-verification');
  const receipts = () => JSON.stringify(readEvidence(folder, 'scripts-test'));
  try {
    assert.equal(await main(args, repo.root), 0);
    const first = receipts();
    assert.equal(await main(args, repo.root), 0);
    assert.equal(receipts(), first);
    writeFileSync(resolve(repo.root, 'README.md'), 'docs only');
    assert.equal(await main(args, repo.root), 0);
    assert.equal(receipts(), first);
    writeFileSync(
      resolve(repo.root, 'scripts/witness.test.ts'),
      'throw new Error("intentional failure");',
    );
    assert.equal(await main([...args, '--plan'], repo.root), 0);
    assert.equal(await main([...args, '--ci-only'], repo.root), 0);
    assert.equal(receipts(), first);
    assert.equal(await main(args, repo.root), 1);
    assert.equal(
      readEvidence(folder, 'scripts-test').sort((a, b) => b.completedAt - a.completedAt)[0].outcome,
      'failure',
    );
    assert.equal(await main(args, repo.root), 1);
  } finally {
    repo.dispose();
  }
});

test('opciones desconocidas o incompletas fallan antes de ejecutar', () => {
  for (const args of [['--no-tests'], ['--only'], ['--only', 'typo'], ['--full', '--only', 'docs']])
    assert.throws(() => parseArgs(args));
});

test('dos ejecuciones no pisan sus resultados y el fallo gana un empate', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'planb-verification-receipts-'));
  try {
    const first = receiptPath(root, 'test');
    const second = receiptPath(root, 'test');
    const evidence = {
      fingerprint: 'a',
      outcome: 'failure',
      completedAt: Date.now(),
      url: 'log',
      durationMs: 1,
    };
    writeEvidence(first, evidence);
    writeEvidence(second, { ...evidence, outcome: 'success' });
    assert.equal(readEvidence(root, 'test').length, 2);
    assert.equal(
      decide({ affected: true, fingerprint: 'a', evidence: readEvidence(root, 'test') }).state,
      'run',
    );
    writeEvidence(second, {
      ...evidence,
      completedAt: evidence.completedAt + 1,
      outcome: 'success',
    });
    assert.equal(readEvidence(root, 'test').length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
