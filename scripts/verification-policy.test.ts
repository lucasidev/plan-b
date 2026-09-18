import assert from 'node:assert/strict';
import test from 'node:test';
import { eligible, jobEvidence } from './lib/verification-github.ts';
import {
  changedPaths,
  decide,
  type Evidence,
  fingerprint,
  maxAgeMs,
} from './lib/verification-policy.ts';

const files = {
  'backend/A.cs': 'a',
  'frontend/src/page.tsx': 'b',
  'docs/readme.md': 'c',
  '.github/workflows/ci.yml': 'w',
};
const hash = fingerprint('backend', files, { runtime: '10.0.1' });
const green: Evidence = {
  fingerprint: hash,
  outcome: 'success',
  completedAt: 1000,
  url: 'https://github.com/owner/repo/actions/runs/1',
  durationMs: 200,
};

test('un commit de docs o frontend conserva el resultado backend; un rebase sin cambios también', () => {
  assert.equal(
    fingerprint(
      'backend',
      { ...files, 'docs/readme.md': 'new', 'frontend/src/page.tsx': 'new' },
      { runtime: '10.0.1' },
    ),
    hash,
  );
  assert.equal(
    decide({ affected: true, fingerprint: hash, evidence: [green], now: 2000 }).state,
    'reuse',
  );
});

test('código, dependencias, workflow, entorno y borrados invalidan el check', () => {
  for (const update of [
    { 'backend/A.cs': 'new' },
    { 'backend/packages.lock.json': 'new' },
    { '.github/workflows/ci.yml': 'new' },
  ] as Record<string, string>[]) {
    assert.notEqual(fingerprint('backend', { ...files, ...update }, { runtime: '10.0.1' }), hash);
  }
  assert.notEqual(fingerprint('backend', files, { runtime: '10.0.2' }), hash);
  const removed = { ...files } as Record<string, string>;
  delete removed['backend/A.cs'];
  assert.notEqual(fingerprint('backend', removed, { runtime: '10.0.1' }), hash);
  assert.deepEqual(changedPaths(files, removed), ['backend/A.cs']);
});

for (const outcome of ['failure', 'cancelled', 'timed_out', 'incomplete', null]) {
  test(`${outcome} posterior invalida el verde, incluso con diff vacío`, () => {
    const evidence = [green, { ...green, outcome, completedAt: 1100 }];
    for (const affected of [false, true])
      assert.equal(decide({ affected, fingerprint: hash, evidence, now: 2000 }).state, 'run');
  });
}

test('un verde posterior a un fallo es válido, pero vencido, futuro o forzado se ejecuta', () => {
  const evidence = [{ ...green, outcome: 'failure', completedAt: 500 }, green];
  assert.equal(decide({ affected: true, fingerprint: hash, evidence, now: 2000 }).state, 'reuse');
  for (const now of [999, 1000 + maxAgeMs])
    assert.equal(decide({ affected: true, fingerprint: hash, evidence, now }).state, 'run');
  assert.equal(decide({ affected: false, fingerprint: hash, evidence, force: true }).state, 'run');
  assert.equal(decide({ affected: true, fingerprint: hash, evidence: [] }).state, 'run');
});

test('solo main y el PR correspondiente del mismo repositorio aportan evidencia', () => {
  const run = {
    id: 1,
    head_sha: 'abcdef',
    event: 'pull_request',
    head_branch: 'branch',
    head_repository: { full_name: 'owner/repo' },
    pull_requests: [{ number: 42 }],
  };
  assert.equal(eligible(run, 'owner/repo', [42]), true);
  assert.equal(eligible(run, 'owner/repo', [43]), false);
  assert.equal(eligible(run, 'fork/repo', [42]), false);
  assert.equal(eligible({ ...run, event: 'push', head_branch: 'main' }, 'owner/repo'), true);
  assert.equal(eligible({ ...run, event: 'workflow_dispatch' }, 'owner/repo', [42]), false);
});

test('un job omitido, sin marcador o parcial no es evidencia verde', () => {
  const job = {
    name: 'Backend (.NET 10)',
    conclusion: 'success',
    started_at: '2026-09-18T00:00:00Z',
    completed_at: '2026-09-18T00:01:00Z',
    html_url: green.url,
    steps: [{ name: `Evidence backend ${hash}`, conclusion: 'success' }],
  };
  assert.equal(jobEvidence('backend', job)?.outcome, 'success');
  assert.equal(jobEvidence('backend', { ...job, steps: [] }), undefined);
  assert.equal(
    jobEvidence('backend', { ...job, steps: [{ ...job.steps[0], conclusion: 'skipped' }] })
      ?.outcome,
    'incomplete',
  );
  assert.equal(jobEvidence('backend', { ...job, conclusion: 'failure' })?.outcome, 'failure');
});
