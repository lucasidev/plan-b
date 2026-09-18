import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';
import { consumes, groups, jobNames } from './lib/verification-policy.ts';

const { parse } = createRequire(resolve('frontend/package.json'))('yaml');
type Step = { name?: string; run?: string; env?: Record<string, string> };
type Job = {
  name: string;
  if?: string;
  needs?: string | string[];
  steps: Step[];
  outputs?: Record<string, string>;
};
const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as {
  on: Record<string, unknown>;
  jobs: Record<string, Job>;
};
const { jobs } = workflow;
const consumers = {
  backend_unit: 'backend-unit',
  backend: 'backend',
  frontend: 'frontend_checks',
  tooling: 'tooling',
  e2e: 'e2e',
};

function enabled(
  id: string,
  outputs: Record<string, string>,
  result = 'success',
  cancelled = false,
) {
  const expression = jobs[id].if;
  assert.ok(expression);
  return Boolean(
    new Function(
      'needs',
      'cancelled',
      `return (${expression.replace(/^\$\{\{\s*|\s*\}\}$/g, '')});`,
    )({ changes: { outputs, result } }, () => cancelled),
  );
}

test('el YAML consume la política compartida y conserva nombres requeridos', () => {
  assert.ok(jobs.changes.steps.some((step) => step.run === 'bun scripts/verify-ci.ts'));
  for (const group of groups) {
    assert.equal(jobs[consumers[group]].name, jobNames[group]);
    assert.equal(jobs.changes.outputs?.[group], `\${{ steps.select.outputs.${group} }}`);
    assert.ok(
      jobs[consumers[group]].steps.some(
        (step) =>
          step.name === `Evidence ${group} \${{ needs.changes.outputs.${group}_fingerprint }}`,
      ),
    );
  }
  assert.equal(jobs.frontend.name, 'Frontend (Next.js 15 / Bun)');
  assert.deepEqual(jobs.frontend.needs, ['changes', 'frontend_checks', 'tooling']);
  assert.ok('workflow_dispatch' in workflow.on);
});

for (const [path, selected] of [
  ['docs/engineering/testing.md', []],
  ['scripts/run-check.ts', ['tooling']],
  ['scripts/run-e2e.ts', ['tooling']],
  ['scripts/check-migrations.ts', ['backend_unit', 'tooling']],
  ['scripts/check-flaky.ts', ['tooling', 'e2e']],
  ['frontend/src/app/page.tsx', ['frontend', 'e2e']],
  ['frontend/e2e/home.spec.ts', ['frontend', 'e2e']],
  ['frontend/bun.lock', ['frontend', 'tooling', 'e2e']],
  ['backend/host/Planb.Api/Program.cs', ['backend_unit', 'backend', 'e2e']],
  ['.claude/skills/ship/SKILL.md', ['tooling']],
  ['.github/workflows/docs-links.yml', ['tooling']],
  ['unknown-runtime.config', groups],
  ['.github/workflows/ci.yml', groups],
  ['scripts/lib/verification-policy.ts', groups],
] as const) {
  test(`${path}: selecciona consumidores y no otras suites`, () => {
    const outputs = Object.fromEntries(
      groups.map((group) => [group, String(consumes(group, path))]),
    );
    for (const group of groups)
      assert.equal(
        enabled(consumers[group], outputs),
        (selected as readonly string[]).includes(group),
        group,
      );
  });
}

for (const result of ['failure', 'skipped', 'cancelled']) {
  test(`selector ${result}: una omisión no aprueba checks`, () => {
    for (const group of groups) {
      assert.equal(enabled(consumers[group], { [group]: 'false' }, result), true);
      assert.equal(enabled(consumers[group], {}, result), true);
      assert.equal(enabled(consumers[group], {}, result, true), false);
    }
  });
}

test('un output ausente con selector verde también conserva la ejecución', () => {
  for (const group of groups) {
    assert.equal(enabled(consumers[group], {}), true);
    assert.equal(enabled(consumers[group], { [group]: 'false' }), false);
  }
});
