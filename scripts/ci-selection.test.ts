import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';

// Reutilizamos los parsers instalados por frontend; no hay un detector paralelo en producción.
const requireFrontend = createRequire(resolve('frontend/package.json'));
const { parse } = requireFrontend('yaml');
const picomatch = requireFrontend('picomatch');
type Step = { name?: string; if?: string; with?: Record<string, string> };
type Job = { if?: string; needs?: string; outputs?: Record<string, string>; steps: Step[] };
const { jobs } = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as {
  jobs: Record<string, Job>;
};
const filters = parse(
  jobs.changes.steps.find((step) => step.with?.filters)?.with?.filters,
) as Record<string, string[]>;

function select(paths: string[], result = 'success', cancelled = false) {
  const filterOutputs = Object.fromEntries(
    Object.entries(filters).map(([key, patterns]) => [
      key,
      String(paths.some(picomatch(patterns, { dot: true }))),
    ]),
  );
  const outputs = Object.fromEntries(
    Object.entries(jobs.changes.outputs ?? {}).map(([key, expression]) => {
      const output = expression.match(/^\$\{\{ steps\.filter\.outputs\.(\w+) \}\}$/)?.[1];
      assert.ok(output && output in filterOutputs, `Unknown detector output: ${expression}`);
      return [key, result === 'success' ? filterOutputs[output] : ''];
    }),
  );
  // Las condiciones actuales solo usan igualdad de strings, &&, || y estas dos funciones.
  // Evaluamos el YAML real: cambiar un if o su output debe romper los casos de selección.
  const enabled = (expression?: string) =>
    expression === undefined ||
    new Function(
      'needs',
      'cancelled',
      'always',
      `return (${expression.replace(/^\$\{\{\s*|\s*\}\}$/g, '')});`,
    )(
      { changes: { result, outputs } },
      () => cancelled,
      () => true,
    );
  const jobRuns = (name: string) => Boolean(enabled(jobs[name].if));
  const stepRuns = (name: string) => {
    const step = jobs.frontend.steps.find((candidate) => candidate.name === name);
    assert.ok(step, `Missing step: ${name}`);
    return jobRuns('frontend') && Boolean(enabled(step.if));
  };
  return { jobRuns, stepRuns };
}

const frontendSteps = ['Lint', 'Typecheck', 'Build', 'Test', 'Upload coverage'];
const toolingSteps = [
  'Install',
  'Lint scripts',
  'Typecheck scripts',
  'Test scripts',
  'Agent config in sync',
];

for (const path of [
  'scripts/run-check.ts',
  'scripts/run-e2e.ts',
  'scripts/lib/dev-stack.ts',
  'biome.json',
  '.claude/workflows/deep-review.js',
  '.claude/agents/reviewer.md',
  '.claude/settings.json',
  '.codex/agents/reviewer.toml',
  '.agents/hooks/guard-tool-budget.mjs',
  'AGENTS.md',
  'CLAUDE.md',
]) {
  test(`herramientas: ${path} verifica el harness sin levantar producto`, () => {
    const { jobRuns, stepRuns } = select([path]);
    for (const step of toolingSteps) assert.equal(stepRuns(step), true, step);
    for (const step of frontendSteps) assert.equal(stepRuns(step), false, step);
    for (const job of ['backend-unit', 'backend', 'e2e']) assert.equal(jobRuns(job), false, job);
  });
}

test('documentación y workflows ajenos no levantan el stack', () => {
  const { jobRuns } = select([
    'docs/engineering/agent-workflow.md',
    '.github/workflows/docs-links.yml',
  ]);
  for (const job of ['frontend', 'backend-unit', 'backend', 'e2e'])
    assert.equal(jobRuns(job), false);
});

for (const path of [
  'frontend/src/app/page.tsx',
  'frontend/e2e/home.spec.ts',
  'frontend/playwright.config.ts',
  'frontend/bun.lock',
  'frontend/package.json',
]) {
  test(`frontend: ${path} conserva build, tests y E2E`, () => {
    const { jobRuns, stepRuns } = select([path]);
    for (const step of [...frontendSteps, ...toolingSteps])
      assert.equal(stepRuns(step), true, step);
    assert.equal(jobRuns('e2e'), true);
    assert.equal(jobRuns('backend'), false);
  });
}

test('backend activa sus suites y E2E sin el job de frontend', () => {
  const { jobRuns } = select(['backend/host/Planb.Api/Program.cs']);
  for (const job of ['backend-unit', 'backend', 'e2e']) assert.equal(jobRuns(job), true);
  assert.equal(jobRuns('frontend'), false);
});

test('el script de migraciones conserva el job que lo ejecuta sin levantar E2E', () => {
  const { jobRuns } = select(['scripts/check-migrations.ts']);
  assert.equal(jobRuns('backend-unit'), true);
  assert.equal(jobRuns('frontend'), true);
  assert.equal(jobRuns('e2e'), false);
});

test('el consumidor del reporte de Playwright activa herramientas y E2E', () => {
  const { jobRuns, stepRuns } = select(['scripts/check-flaky.ts']);
  assert.equal(jobRuns('e2e'), true);
  for (const step of toolingSteps) assert.equal(stepRuns(step), true);
  for (const step of frontendSteps) assert.equal(stepRuns(step), false);
});

test('cambios mixtos conservan la cobertura de producto', () => {
  const { jobRuns, stepRuns } = select(['scripts/run-check.ts', 'frontend/src/app/page.tsx']);
  assert.equal(jobRuns('e2e'), true);
  assert.equal(stepRuns('Build'), true);
});

for (const [paths, result] of [
  [['.github/workflows/ci.yml'], 'success'],
  [[], 'failure'],
  [[], 'skipped'],
] as const) {
  test(`workflow modificado o detector ${result}: conserva todas las gates`, () => {
    const { jobRuns, stepRuns } = select([...paths], result);
    for (const job of ['frontend', 'backend-unit', 'backend', 'e2e'])
      assert.equal(jobRuns(job), true, job);
    for (const step of [...frontendSteps, ...toolingSteps])
      assert.equal(stepRuns(step), true, step);
  });
}

test('una corrida cancelada no inicia jobs de producto', () => {
  const { jobRuns } = select(['.github/workflows/ci.yml'], 'failure', true);
  for (const job of ['frontend', 'backend-unit', 'backend', 'e2e'])
    assert.equal(jobRuns(job), false);
});
