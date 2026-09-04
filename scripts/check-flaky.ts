#!/usr/bin/env bun
/**
 * Gate de la cuarentena de flakes (issue #422). Dos partes:
 *
 * 1. Todo `test.fixme(` y todo tag `@flaky` en la suite E2E lleva, en un comentario pegado en
 *    las 3 líneas de arriba, hasta cuándo vive (`hasta YYYY-MM-DD`) y el issue que lo explica
 *    (`#NNN`). Sin esa marca, o con la fecha ya pasada, la cuarentena se volvió permanente sin
 *    que nadie lo decidiera: eso es lo que hace fallar este gate.
 * 2. Si ya corrió la suite con el reporter `json` (`frontend/test-results/results.json`, solo en
 *    CI), lista los tests que Playwright marcó `flaky` (pasaron recién en el reintento del
 *    proyecto `@flaky`). Esa lista informa, nunca rompe el build: la cuarentena vencida es lo
 *    único que gatea.
 *
 * Uso: bun scripts/check-flaky.ts
 */

import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const rel = (f: string) => f.split(sep).join('/');

// 1. cuarentena sin marcar o vencida ────────────────────────────────────────────────────────
const MARK = /test\.fixme\(|@flaky/;
const HASTA = /hasta\s+(\d{4}-\d{2}-\d{2})/;
const ISSUE = /#\d+/;

type StaleFinding = { file: string; line: number; reason: string };

const today = new Date().toISOString().slice(0, 10);
const staleFindings: StaleFinding[] = [];

const specFiles = globSync('frontend/e2e/**/*.spec.ts', { cwd: ROOT });
for (const specFile of specFiles) {
  const lines = readFileSync(resolve(ROOT, specFile), 'utf-8').split('\n');
  lines.forEach((line, i) => {
    if (!MARK.test(line)) return;

    // Solo cuenta lo que está adentro de un comentario, no cualquier texto de esas 3 líneas.
    const commentWindow = lines
      .slice(Math.max(0, i - 3), i)
      .filter((l) => l.trim().startsWith('//'))
      .join(' ');
    const hastaMatch = commentWindow.match(HASTA);
    const hasIssue = ISSUE.test(commentWindow);

    if (!hastaMatch || !hasIssue) {
      const reason =
        !hastaMatch && !hasIssue
          ? 'sin "hasta YYYY-MM-DD" ni issue #NNN'
          : !hastaMatch
            ? 'sin "hasta YYYY-MM-DD"'
            : 'sin issue #NNN';
      staleFindings.push({ file: rel(specFile), line: i + 1, reason });
      return;
    }
    if (hastaMatch[1] < today) {
      staleFindings.push({
        file: rel(specFile),
        line: i + 1,
        reason: `vencida (hasta ${hastaMatch[1]})`,
      });
    }
  });
}

if (staleFindings.length > 0) {
  console.log('Cuarentena sin marcar o vencida:');
  for (const f of staleFindings) {
    console.log(`  ${f.file}:${f.line} ${f.reason}`);
  }
} else {
  console.log(`check-flaky: ${specFiles.length} specs escaneados, cuarentena al día.`);
}

// 2. tests que la última corrida marcó flaky (informativo, no gatea) ───────────────────────────
type PwTest = { status: string };
type PwSpec = { title: string; file: string; tests: PwTest[] };
type PwSuite = { suites?: PwSuite[]; specs?: PwSpec[] };
type PwReport = { suites: PwSuite[] };

function collectSpecs(suite: PwSuite, out: PwSpec[]): void {
  for (const spec of suite.specs ?? []) out.push(spec);
  for (const child of suite.suites ?? []) collectSpecs(child, out);
}

const RESULTS_PATH = resolve(ROOT, 'frontend/test-results/results.json');
if (existsSync(RESULTS_PATH)) {
  const report = JSON.parse(readFileSync(RESULTS_PATH, 'utf-8')) as PwReport;
  const specs: PwSpec[] = [];
  for (const suite of report.suites) collectSpecs(suite, specs);

  const flaky = specs.filter((s) => s.tests.some((t) => t.status === 'flaky'));
  if (flaky.length > 0) {
    console.log(`\nCuarentena activa en la última corrida (${flaky.length} flaky):`);
    for (const s of flaky) {
      console.log(`  ${s.file} :: ${s.title}`);
      if (process.env.CI) {
        console.log(`::warning::flaky test: ${s.title} (${s.file})`);
      }
    }
  }
}

process.exit(staleFindings.length > 0 ? 1 : 0);
