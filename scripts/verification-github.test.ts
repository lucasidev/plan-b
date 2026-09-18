import assert from 'node:assert/strict';
import test from 'node:test';
import { dockerImage, history, jobEvidence } from './lib/verification-github.ts';
import { decide } from './lib/verification-policy.ts';

test('recupera evidencia del PR mergeado con rama borrada e incluye intentos fallidos', async () => {
  const hash = 'a'.repeat(64);
  const job = {
    name: 'Backend (.NET 10)',
    conclusion: 'success',
    started_at: '2026-09-18T00:00:00Z',
    completed_at: '2026-09-18T00:01:00Z',
    html_url: 'https://github.com/owner/repo/actions/runs/1',
    steps: [{ name: `Evidence backend ${hash}`, conclusion: 'success' }],
  };
  const responses: Record<string, unknown> = {
    'commits/merged/pulls': [
      {
        number: 42,
        merged_at: '2026-09-18',
        base: { ref: 'main' },
        head: { ref: 'deleted-branch' },
      },
    ],
    'actions/workflows/ci.yml/runs?per_page=30': {
      workflow_runs: [
        {
          id: 1,
          event: 'pull_request',
          head_sha: 'original',
          head_branch: 'deleted-branch',
          head_repository: { full_name: 'owner/repo' },
          pull_requests: [],
        },
      ],
    },
    'commits/original/pulls': [{ number: 42 }],
    'actions/runs/1/jobs?filter=all&per_page=100': {
      total_count: 2,
      jobs: [job, { ...job, conclusion: 'failure', completed_at: '2026-09-18T00:02:00Z' }],
    },
  };
  const seen: string[] = [];
  const jobs = await history('owner/repo', 'test-token', 'merged', undefined, async (url) => {
    const path = url.replace('https://api.github.com/repos/owner/repo/', '');
    seen.push(path);
    assert.ok(path in responses, `Unexpected request ${path}`);
    return Response.json(responses[path]);
  });
  assert.equal(jobs.length, 2);
  assert.ok(seen.includes('commits/original/pulls'));
  const evidence = jobs.flatMap((item) => {
    const result = jobEvidence('backend', item);
    return result ? [result] : [];
  });
  assert.equal(
    decide({ affected: true, fingerprint: hash, evidence, now: Date.parse('2026-09-18T00:03:00Z') })
      .state,
    'run',
  );
});

test('API fallida no entrega evidencia utilizable', async () => {
  await assert.rejects(
    history(
      'owner/repo',
      'test-token',
      'head',
      undefined,
      async () => new Response('', { status: 403 }),
    ),
    /unavailable/,
  );
});

test('un fallo sin marcador invalida evidencia anterior de cualquier input', () => {
  const job = {
    name: 'Backend (.NET 10)',
    conclusion: 'cancelled',
    started_at: '2026-09-18T00:01:00Z',
    completed_at: '2026-09-18T00:02:00Z',
    html_url: 'url',
    steps: [],
  };
  const evidence = jobEvidence('backend', job);
  assert.ok(evidence);
  assert.equal(evidence.fingerprint, '*');
  assert.equal(
    decide({
      affected: true,
      fingerprint: 'a',
      evidence: [{ ...evidence, fingerprint: 'a', outcome: 'success', completedAt: 1 }, evidence],
    }).state,
    'run',
  );
});

test('resuelve y valida digest OCI antes de usar una imagen como evidencia', async () => {
  const image = await dockerImage('library/redis', '7-alpine', async (url, init) => {
    if (url.startsWith('https://auth.docker.io/'))
      return Response.json({ token: 'registry-token' });
    assert.equal(init?.method, 'HEAD');
    return new Response(null, { headers: { 'docker-content-digest': `sha256:${'b'.repeat(64)}` } });
  });
  assert.equal(image, `library/redis@sha256:${'b'.repeat(64)}`);
  await assert.rejects(
    dockerImage('library/redis', '7-alpine', async (url) =>
      new URL(url).origin === 'https://auth.docker.io'
        ? Response.json({ token: 'test' })
        : new Response(null),
    ),
    /digest unavailable/,
  );
});
