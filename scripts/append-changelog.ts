/**
 * Append the latest commit on HEAD to CHANGELOG.md under [Unreleased].
 *
 * Triggered by `.github/workflows/changelog.yml` on every push to main.
 * Runnable locally for testing with `bun scripts/append-changelog.ts --dry-run`.
 *
 * Behavior (see ADR-0037):
 * - Reads HEAD commit (sha, subject, body) via `git log`.
 * - Parses the subject as a Conventional Commit using the same regex as
 *   `scripts/check-commit-msg.ts`. Refuses to run if the subject is not a
 *   valid CC.
 * - Maps the type to a Keep-a-Changelog section:
 *     feat   → Added
 *     perf   → Changed
 *     fix    → Fixed
 *     refactor → Changed
 *     revert → Removed
 *   `docs`, `style`, `test`, `build`, `ci`, `chore` are skipped silently.
 * - Skips if the body contains `[skip changelog]`.
 * - Marks the bullet with `**(BREAKING)**` when the subject has `!:` or the
 *   body contains `BREAKING CHANGE:`.
 * - Idempotent: if the commit sha already appears in CHANGELOG.md, the
 *   script is a no-op. Useful for replays / manual reruns.
 *
 * Versioning is intentionally out of scope. ADR-0038 covers it.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ────────────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────────────

const CHANGELOG_PATH = resolve(process.cwd(), 'CHANGELOG.md');
const UNRELEASED_HEADER = '## [Unreleased]';
const SKIP_TAG = '[skip changelog]';

// Same regex as scripts/check-commit-msg.ts. Captures: type, optional scope, optional bang, description.
const CONVENTIONAL_COMMIT_RE =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\(([a-z0-9-]+)\))?(!)?: (.{1,72})/;

const TYPE_TO_SECTION: Record<string, string> = {
  feat: 'Added',
  perf: 'Changed',
  fix: 'Fixed',
  refactor: 'Changed',
  revert: 'Removed',
};

const SKIP_TYPES = new Set(['docs', 'style', 'test', 'build', 'ci', 'chore']);

// ────────────────────────────────────────────────────────────────────────────
// Pure parsing / formatting helpers (testable without git or fs)
// ────────────────────────────────────────────────────────────────────────────

export interface ParsedCommit {
  sha: string;
  shortSha: string;
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

export function parseSubject(subject: string): Omit<ParsedCommit, 'sha' | 'shortSha'> | null {
  const match = CONVENTIONAL_COMMIT_RE.exec(subject);
  if (!match) return null;
  const [, type, scope, bang, description] = match;
  return {
    type,
    scope: scope || undefined,
    breaking: bang === '!',
    description,
  };
}

export function buildBullet(commit: ParsedCommit, repoUrl: string, breakingFromBody: boolean): string {
  const scopePart = commit.scope ? ` (${commit.scope})` : '';
  const linkPart = repoUrl
    ? ` — [\`${commit.shortSha}\`](${repoUrl}/commit/${commit.sha})`
    : ` — \`${commit.shortSha}\``;
  const isBreaking = commit.breaking || breakingFromBody;
  const breakingPart = isBreaking ? ' **(BREAKING)**' : '';
  return `- ${commit.description}${scopePart}${linkPart}${breakingPart}`;
}

/**
 * Inserts a bullet under `[Unreleased] > <section>`. Idempotent: if the
 * commit sha already appears in the file, returns the input unchanged.
 *
 * The structure assumed:
 *
 *   ## [Unreleased]
 *
 *   ### Added
 *   - bullet
 *   - bullet
 *
 *   ### Fixed
 *   - bullet
 *
 *   ## [next section, optional]
 */
export function insertBullet(
  content: string,
  section: string,
  bullet: string,
  sha: string,
): { content: string; changed: boolean; reason?: string } {
  if (content.includes(sha)) {
    return { content, changed: false, reason: 'sha already in CHANGELOG' };
  }

  const unreleasedIdx = content.indexOf(UNRELEASED_HEADER);
  if (unreleasedIdx === -1) {
    throw new Error(`CHANGELOG.md is missing "${UNRELEASED_HEADER}"`);
  }

  // Slice off the [Unreleased] block. It ends at the next top-level "## " or EOF.
  const blockStart = unreleasedIdx + UNRELEASED_HEADER.length;
  const restAfterHeader = content.slice(blockStart);
  const nextTopLevelMatch = restAfterHeader.match(/\n## (?!\[Unreleased\])/);
  const blockEnd =
    nextTopLevelMatch && nextTopLevelMatch.index !== undefined
      ? blockStart + nextTopLevelMatch.index
      : content.length;
  const block = content.slice(blockStart, blockEnd);

  const subsectionHeader = `### ${section}`;
  const subIdx = block.indexOf(subsectionHeader);

  let newBlock: string;
  if (subIdx === -1) {
    // Subsection does not exist yet. Append it after the last existing subsection
    // (or right after the [Unreleased] header if there are no subsections).
    const trimmed = block.replace(/\s+$/, '');
    newBlock = `${trimmed}\n\n${subsectionHeader}\n\n${bullet}\n`;
  } else {
    // Subsection exists. Insert bullet at the end of the subsection (before the
    // next "### " or before block end).
    const subBodyStart = subIdx + subsectionHeader.length;
    const subRest = block.slice(subBodyStart);
    const nextSubMatch = subRest.match(/\n### /);
    const subEnd =
      nextSubMatch && nextSubMatch.index !== undefined
        ? subBodyStart + nextSubMatch.index
        : block.length;
    const subBody = block.slice(subBodyStart, subEnd).replace(/\s+$/, '');
    newBlock =
      block.slice(0, subBodyStart) +
      `${subBody}\n${bullet}\n` +
      block.slice(subEnd);
    // Normalize trailing whitespace: ensure exactly one blank line before next section.
    if (!newBlock.endsWith('\n')) newBlock += '\n';
  }

  // Ensure the block ends with a single blank line before the next section.
  const normalizedBlock = newBlock.replace(/\n+$/, '\n') + (blockEnd < content.length ? '\n' : '');

  const updated = content.slice(0, blockStart) + normalizedBlock + content.slice(blockEnd);
  return { content: updated, changed: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Side-effecting helpers (git, fs, env)
// ────────────────────────────────────────────────────────────────────────────

function readLastCommit(): { sha: string; shortSha: string; subject: string; body: string } {
  const sha = execSync('git rev-parse HEAD').toString().trim();
  const shortSha = execSync('git rev-parse --short HEAD').toString().trim();
  const subject = execSync('git log -1 --format=%s HEAD').toString().trim();
  const body = execSync('git log -1 --format=%b HEAD').toString();
  return { sha, shortSha, subject, body };
}

function inferRepoUrl(): string {
  const server = process.env.GITHUB_SERVER_URL?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (server && repo) return `${server}/${repo}`;

  // Fallback: parse from `git remote get-url origin`.
  try {
    const remote = execSync('git remote get-url origin').toString().trim();
    // SSH form: git@github.com:owner/repo.git → https://github.com/owner/repo
    // HTTPS form: https://github.com/owner/repo(.git)? → https://github.com/owner/repo
    const match = /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?\/?$/.exec(remote);
    if (match) return `https://github.com/${match[1]}`;
  } catch {
    // origin not configured; tolerable for local runs
  }
  return '';
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const { sha, shortSha, subject, body } = readLastCommit();

  if (body.includes(SKIP_TAG)) {
    console.log(`[skip] body contains "${SKIP_TAG}" (commit ${shortSha})`);
    return;
  }

  const parsed = parseSubject(subject);
  if (!parsed) {
    console.error(
      `[fail] HEAD commit subject is not a valid Conventional Commit:\n  "${subject}"\n` +
        `  Expected format: <type>(<scope>): <description>`,
    );
    process.exit(1);
  }

  if (SKIP_TYPES.has(parsed.type)) {
    console.log(`[skip] type "${parsed.type}" does not appear in CHANGELOG (commit ${shortSha})`);
    return;
  }

  const section = TYPE_TO_SECTION[parsed.type];
  if (!section) {
    console.log(`[skip] no Keep-a-Changelog mapping for type "${parsed.type}"`);
    return;
  }

  const breakingFromBody = /^BREAKING CHANGE:/m.test(body);
  const repoUrl = inferRepoUrl();
  const bullet = buildBullet({ ...parsed, sha, shortSha }, repoUrl, breakingFromBody);

  const original = readFileSync(CHANGELOG_PATH, 'utf-8');
  const result = insertBullet(original, section, bullet, sha);

  if (!result.changed) {
    console.log(`[skip] ${result.reason ?? 'no change'} (commit ${shortSha})`);
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] would append to "${section}":\n  ${bullet}\n`);
    console.log('--- updated CHANGELOG.md ---');
    console.log(result.content);
    return;
  }

  writeFileSync(CHANGELOG_PATH, result.content);
  console.log(`[ok] appended to "${section}":\n  ${bullet}`);
}

// Allow `import { ... }` from a future test file without auto-running main.
if (import.meta.main) {
  main();
}
