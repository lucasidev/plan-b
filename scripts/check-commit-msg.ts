/**
 * Validates a commit message follows Conventional Commits format.
 *
 * Usage: bun scripts/check-commit-msg.ts <path-to-commit-msg-file>
 * Invoked by lefthook's commit-msg hook.
 */

import { existsSync, readFileSync } from 'node:fs';

const CONVENTIONAL_COMMIT_RE =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: .{1,72}/;

const VALID_TYPES =
  'feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert';

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

const msgFile = process.argv[2];
if (!msgFile || !existsSync(msgFile)) {
  console.error('Error: expected path to commit message file as argument');
  process.exit(1);
}

const firstLine = readFileSync(msgFile, 'utf-8').split('\n')[0].trim();

if (!CONVENTIONAL_COMMIT_RE.test(firstLine)) {
  fail(firstLine);
}
