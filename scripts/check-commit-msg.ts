/**
 * Validates a commit message follows Conventional Commits format, and that its
 * subject and body are in the language the repo assigns to each.
 *
 * Usage: bun scripts/check-commit-msg.ts <path-to-commit-msg-file>
 * Invoked by lefthook's commit-msg hook, and by commits.yml over every commit
 * in a PR.
 */

import { existsSync, readFileSync } from 'node:fs';
import { detectLanguage } from './lib/detect-language.ts';

const CONVENTIONAL_COMMIT_RE =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{1,72}/;

const VALID_TYPES =
  'feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert';

// El subject va en inglés y el body en español: el primero es un identificador
// de una línea, del mismo lado que los del código; el segundo es prosa, del
// mismo lado que los comentarios. La regla y su razón están en
// docs/engineering/git-workflow.md (filas 17-20 y el párrafo "Por qué el
// título va en inglés y el cuerpo en español").
//
// Dependabot escribe todo en inglés, subject y body, y no hay dónde
// configurarle el idioma. pr-title.yml ya lo exime por la misma razón.
const BOT_SCOPES = /^build\(deps(-dev)?\):/;

function fail(firstLine: string): never {
  console.error('');
  console.error('Error: Commit message must follow Conventional Commits.');
  console.error('');
  console.error('  <type>(<scope>): <description>');
  console.error('');
  console.error(`Types: ${VALID_TYPES}.`);
  console.error('Scope is optional. Use ! for breaking changes (e.g. feat!: ...).');
  console.error('');
  console.error(`Got: ${firstLine}`);
  process.exit(1);
}

function failLanguage(description: string): never {
  console.error('');
  console.error('Error: the commit subject reads as Spanish, and it goes in English.');
  console.error('');
  console.error('  Subject, branch and PR title are one-line identifiers: English.');
  console.error('  Commit body, PR body and docs are prose: Spanish.');
  console.error('  See docs/engineering/git-workflow.md.');
  console.error('');
  console.error(`Got: ${description}`);
  process.exit(1);
}

const msgFile = process.argv[2];
if (!msgFile || !existsSync(msgFile)) {
  console.error('Error: expected path to commit message file as argument');
  process.exit(1);
}

const raw = readFileSync(msgFile, 'utf-8');
const firstLine = raw.split('\n')[0].trim();

if (!CONVENTIONAL_COMMIT_RE.test(firstLine)) {
  fail(firstLine);
}

if (!BOT_SCOPES.test(firstLine)) {
  const description = firstLine.replace(/^[a-z]+(\([^)]*\))?!?: /, '');
  if (detectLanguage(description) === 'es') {
    failLanguage(description);
  }

  // El body avisa pero no bloquea: es largo, cita mensajes de error y salida de
  // herramientas en inglés, y el heurístico se midió sobre subjects. Un aviso
  // que se lee al momento alcanza; bloquear acá costaría más de lo que ahorra.
  const body = raw
    .split('\n')
    .slice(1)
    .filter((l) => !l.startsWith('#'))
    .join('\n')
    .split('diff --git')[0]
    .trim();

  if (body && detectLanguage(body) === 'en') {
    console.warn('');
    console.warn('Aviso: el body del commit parece estar en inglés, y va en español.');
    console.warn('El subject es identificador (inglés); el body es prosa (español).');
    console.warn('');
  }
}
