/**
 * Append every commit in the current push range to CHANGELOG.md under [Unreleased].
 *
 * Triggered by `.github/workflows/changelog.yml` on every push to main.
 * Runnable locally with `bun scripts/append-changelog.ts --dry-run`.
 *
 * Behavior (see ADR-0037):
 * - Range: when GHA env vars `PUSH_BEFORE` and `PUSH_AFTER` are present, the
 *   script processes every commit in `git log PUSH_BEFORE..PUSH_AFTER --reverse`
 *   (oldest to newest, so the changelog reflects chronological order). Without
 *   those env vars, falls back to processing only HEAD. This matters for
 *   Rebase merges (default per ADR-0026), which push multiple commits in a
 *   single push event — without range processing only the last would land in
 *   CHANGELOG.
 * - For each commit: parses the subject as a Conventional Commit using the
 *   same regex as `scripts/check-commit-msg.ts`. Refuses to run if a subject
 *   is not a valid CC.
 * - Maps the type to a Keep-a-Changelog section:
 *     feat   → Added
 *     perf   → Changed
 *     fix    → Fixed
 *     refactor → Changed
 *     revert → Removed
 *   `docs`, `style`, `test`, `build`, `ci`, `chore` are skipped silently.
 * - Skips a commit if its body contains `[skip changelog]` ON ITS OWN LINE
 *   (matching with `^\s*\[skip changelog\]\s*$` per-line). Mentioning the
 *   tag inside prose ("Honors [skip changelog] in body") is fine.
 * - Marks the bullet with `**(BREAKING)**` when the subject has `!:` or the
 *   body contains `BREAKING CHANGE:`.
 * - Idempotent: if the commit sha already appears in CHANGELOG.md, that
 *   commit is a no-op. Useful for replays / manual reruns.
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
// Skip-tag must appear on its own line (with optional surrounding whitespace).
// Matching anywhere in the body would false-positive on prose mentions of the
// tag — that bug bit us on the workflow's first live run.
const SKIP_TAG_RE = /^\s*\[skip changelog\]\s*$/m;
// Sentinel sha that GHA passes for the initial push to a new branch (no prior
// commit to compare against).
const ZERO_SHA = '0000000000000000000000000000000000000000';

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

export function bodyHasSkipTag(body: string): boolean {
  return SKIP_TAG_RE.test(body);
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
    if (!newBlock.endsWith('\n')) newBlock += '\n';
  }

  const normalizedBlock = newBlock.replace(/\n+$/, '\n') + (blockEnd < content.length ? '\n' : '');

  const updated = content.slice(0, blockStart) + normalizedBlock + content.slice(blockEnd);
  return { content: updated, changed: true };
}

// ────────────────────────────────────────────────────────────────────────────
// Side-effecting helpers (git, fs, env)
// ────────────────────────────────────────────────────────────────────────────

interface CommitInfo {
  sha: string;
  shortSha: string;
  subject: string;
  body: string;
}

function readCommit(sha: string): CommitInfo {
  const fullSha = execSync(`git rev-parse "${sha}"`).toString().trim();
  const shortSha = execSync(`git rev-parse --short "${sha}"`).toString().trim();
  const subject = execSync(`git log -1 --format=%s "${sha}"`).toString().trim();
  const body = execSync(`git log -1 --format=%b "${sha}"`).toString();
  return { sha: fullSha, shortSha, subject, body };
}

/**
 * Determine which commits to process. In CI on a push event, GHA exposes
 * `before` and `after` shas of the push range — process every commit in
 * `before..after` (chronological order). Locally or when env vars are
 * absent, fall back to processing HEAD only.
 */
function commitsToProcess(): string[] {
  const before = process.env.PUSH_BEFORE?.trim();
  const after = process.env.PUSH_AFTER?.trim();

  if (!before || !after || before === ZERO_SHA) {
    // No range available (initial push, branch creation, or local invocation).
    return [execSync('git rev-parse HEAD').toString().trim()];
  }

  const log = execSync(`git log --reverse --format=%H "${before}..${after}"`).toString().trim();
  if (!log) return [];
  return log.split('\n');
}

function inferRepoUrl(): string {
  const server = process.env.GITHUB_SERVER_URL?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (server && repo) return `${server}/${repo}`;

  try {
    const remote = execSync('git remote get-url origin').toString().trim();
    const match = /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?\/?$/.exec(remote);
    if (match) return `https://github.com/${match[1]}`;
  } catch {
    // origin not configured; tolerable for local runs
  }
  return '';
}

// ────────────────────────────────────────────────────────────────────────────
// Per-commit processing (returns the new file content + a status, no I/O)
// ────────────────────────────────────────────────────────────────────────────

interface ProcessResult {
  content: string;
  changed: boolean;
  reason: string;
  shortSha: string;
}

export function processCommit(
  commit: CommitInfo,
  repoUrl: string,
  changelog: string,
): ProcessResult {
  const { sha, shortSha, subject, body } = commit;

  if (bodyHasSkipTag(body)) {
    return {
      content: changelog,
      changed: false,
      reason: 'body contains "[skip changelog]" on its own line',
      shortSha,
    };
  }

  const parsed = parseSubject(subject);
  if (!parsed) {
    throw new Error(`Commit ${shortSha} subject is not a valid Conventional Commit: "${subject}"`);
  }

  if (SKIP_TYPES.has(parsed.type)) {
    return {
      content: changelog,
      changed: false,
      reason: `type "${parsed.type}" does not appear in CHANGELOG`,
      shortSha,
    };
  }

  const section = TYPE_TO_SECTION[parsed.type];
  if (!section) {
    return {
      content: changelog,
      changed: false,
      reason: `no Keep-a-Changelog mapping for type "${parsed.type}"`,
      shortSha,
    };
  }

  const breakingFromBody = /^BREAKING CHANGE:/m.test(body);
  const bullet = buildBullet({ ...parsed, sha, shortSha }, repoUrl, breakingFromBody);
  const insertResult = insertBullet(changelog, section, bullet, sha);

  if (!insertResult.changed) {
    return {
      content: changelog,
      changed: false,
      reason: insertResult.reason ?? 'no change',
      shortSha,
    };
  }

  return {
    content: insertResult.content,
    changed: true,
    reason: `appended to "${section}"`,
    shortSha,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main(): void {
  const dryRun = process.argv.includes('--dry-run');

  const shas = commitsToProcess();
  if (shas.length === 0) {
    console.log('No commits in range. Nothing to do.');
    return;
  }

  console.log(`Processing ${shas.length} commit(s)`);

  const repoUrl = inferRepoUrl();
  const original = readFileSync(CHANGELOG_PATH, 'utf-8');
  let working = original;
  let appended = 0;

  for (const sha of shas) {
    const commit = readCommit(sha);
    const result = processCommit(commit, repoUrl, working);
    if (result.changed) {
      working = result.content;
      appended++;
      console.log(`  [ok]   ${result.shortSha}: ${result.reason}`);
    } else {
      console.log(`  [skip] ${result.shortSha}: ${result.reason}`);
    }
  }

  if (working === original) {
    console.log('No CHANGELOG.md changes.');
    return;
  }

  if (dryRun) {
    console.log(`\n[dry-run] would append ${appended} bullet(s).`);
    console.log('--- updated CHANGELOG.md ---');
    console.log(working);
    return;
  }

  writeFileSync(CHANGELOG_PATH, working);
  console.log(`\nAppended ${appended} bullet(s) to CHANGELOG.md`);
}

// Allow `import { ... }` from a future test file without auto-running main.
if (import.meta.main) {
  try {
    main();
  } catch (err) {
    console.error(`[fail] ${(err as Error).message}`);
    process.exit(1);
  }
}
