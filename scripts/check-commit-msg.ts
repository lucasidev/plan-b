/**
 * Validates a commit message:
 *   1. Follows Conventional Commits format (type(scope): description).
 *   2. Has no em-dash (U+2014) anywhere in subject or body. Convención del proyecto:
 *      reemplazar por coma, dos puntos, paréntesis o frase separada. Misma regla
 *      que react-doctor enforcea sobre JSX text via design-no-em-dash-in-jsx-text.
 *
 * Usage: bun scripts/check-commit-msg.ts <path-to-commit-msg-file>
 * Invoked by lefthook's commit-msg hook.
 */

import { existsSync, readFileSync } from 'node:fs';

const CONVENTIONAL_COMMIT_RE =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{1,72}/;

const VALID_TYPES =
  'feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert';

// U+2014 EM DASH. NO incluimos U+2013 EN DASH porque sí lo usamos legítimamente
// como placeholder visual de "campo vacío" (ej. tablas de import preview).
const EM_DASH = '—';

function failConventional(firstLine: string): never {
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

function failEmDash(rawMessage: string): never {
  // Mostrar las líneas con em-dash + un caret que marca la posición exacta,
  // así el dev edita sin tener que cazar el caracter a ojo.
  const offendingLines = rawMessage
    .split('\n')
    .map((line, idx) => ({ line, idx, pos: line.indexOf(EM_DASH) }))
    .filter((entry) => entry.pos !== -1);

  console.error('');
  console.error(
    `Error: Commit message contains em-dash (${EM_DASH}). Replace with comma, colon, parens or split into separate sentences.`,
  );
  console.error('');
  for (const { line, idx, pos } of offendingLines) {
    console.error(`  L${idx + 1}: ${line}`);
    console.error(`        ${' '.repeat(pos)}^`);
  }
  console.error('');
  process.exit(1);
}

const msgFile = process.argv[2];
if (!msgFile || !existsSync(msgFile)) {
  console.error('Error: expected path to commit message file as argument');
  process.exit(1);
}

const rawMessage = readFileSync(msgFile, 'utf-8');
const firstLine = rawMessage.split('\n')[0].trim();

if (!CONVENTIONAL_COMMIT_RE.test(firstLine)) {
  failConventional(firstLine);
}

// Chequeo de em-dash sobre TODO el mensaje (subject + body), no solo la primera línea.
// `git commit` agrega comments de ayuda (líneas que arrancan con `#`) al file que pasa
// al hook; los ignoramos al chequear para no falso-positivear si git decide usar el
// caracter en su help text.
const messageWithoutComments = rawMessage
  .split('\n')
  .filter((line) => !line.startsWith('#'))
  .join('\n');

if (messageWithoutComments.includes(EM_DASH)) {
  failEmDash(messageWithoutComments);
}
