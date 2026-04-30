/**
 * Throwaway tests for scripts/append-changelog.ts.
 * Will move to vitest once US-T01 lands.
 *
 * Run: bun scripts/_test-append-changelog.ts
 */
import { parseSubject, buildBullet, insertBullet, bodyHasSkipTag } from './append-changelog';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    pass++;
  } else {
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
    fail++;
  }
}

function group(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

// ────────────────────────────────────────────────────────────────────────────

group('parseSubject', () => {
  const a = parseSubject('feat(identity): forgot-password backend (US-033-i)');
  check('parses feat with scope', a !== null && a.type === 'feat' && a.scope === 'identity');
  check('extracts description', a?.description === 'forgot-password backend (US-033-i)');
  check('not breaking by default', a?.breaking === false);

  const b = parseSubject('fix: a small fix');
  check('parses fix without scope', b !== null && b.type === 'fix' && b.scope === undefined);

  const c = parseSubject('feat(identity)!: new auth flow');
  check('parses bang as breaking', c?.breaking === true);

  const d = parseSubject('not a conventional commit');
  check('rejects non-CC', d === null);

  const e = parseSubject('chore: tidy');
  check('parses chore', e?.type === 'chore');
});

group('buildBullet', () => {
  const commit = {
    sha: 'abc123def456',
    shortSha: 'abc123d',
    type: 'feat',
    scope: 'identity',
    breaking: false,
    description: 'something new',
  };
  const repo = 'https://github.com/lucasidev/plan-b';

  const bullet = buildBullet(commit, repo, false);
  check(
    'feat with scope and link',
    bullet === '- something new (identity) — [`abc123d`](https://github.com/lucasidev/plan-b/commit/abc123def456)',
    `got: ${bullet}`,
  );

  const noScope = buildBullet({ ...commit, scope: undefined }, repo, false);
  check('omits scope when missing', !noScope.includes('()') && noScope.includes('something new — '));

  const breakingFromBang = buildBullet({ ...commit, breaking: true }, repo, false);
  check('marks BREAKING from bang', breakingFromBang.endsWith('**(BREAKING)**'));

  const breakingFromBody = buildBullet(commit, repo, true);
  check('marks BREAKING from body', breakingFromBody.endsWith('**(BREAKING)**'));

  const noRepo = buildBullet({ ...commit, scope: undefined }, '', false);
  check(
    'handles missing repo url',
    noRepo === '- something new — `abc123d`',
    `got: ${noRepo}`,
  );
});

group('insertBullet — empty Unreleased', () => {
  const input = `# Changelog

## [Unreleased]
`;
  const result = insertBullet(input, 'Added', '- new thing — abc123', 'fullsha');
  check('changed=true', result.changed === true);
  check('contains subsection', result.content.includes('### Added'));
  check('contains bullet', result.content.includes('- new thing — abc123'));
});

group('insertBullet — existing subsection appends', () => {
  const input = `# Changelog

## [Unreleased]

### Added

- existing one — sha1
`;
  const result = insertBullet(input, 'Added', '- new one — sha2', 'sha2-long');
  check('changed=true', result.changed === true);
  check('keeps existing', result.content.includes('- existing one — sha1'));
  check('appends new', result.content.includes('- new one — sha2'));
  const idxExisting = result.content.indexOf('existing one');
  const idxNew = result.content.indexOf('new one');
  check('order: existing then new', idxExisting < idxNew && idxExisting !== -1);
});

group('insertBullet — different subsection creates new', () => {
  const input = `# Changelog

## [Unreleased]

### Added

- a feat — sha-feat
`;
  const result = insertBullet(input, 'Fixed', '- a fix — sha-fix', 'sha-fix-long');
  check('keeps Added', result.content.includes('### Added') && result.content.includes('a feat'));
  check('creates Fixed', result.content.includes('### Fixed') && result.content.includes('a fix'));
  const idxAdded = result.content.indexOf('### Added');
  const idxFixed = result.content.indexOf('### Fixed');
  check('Added before Fixed', idxAdded < idxFixed && idxAdded !== -1);
});

group('insertBullet — idempotent on same sha', () => {
  const input = `# Changelog

## [Unreleased]

### Added

- a thing — abc123def
`;
  const result = insertBullet(input, 'Added', '- a thing — abc123def', 'abc123def');
  check('changed=false', result.changed === false);
  check('content unchanged', result.content === input);
});

group('insertBullet — Unreleased before older versioned section', () => {
  const input = `# Changelog

## [Unreleased]

### Added

- recent — sha-r

## [0.1.0]

### Added

- old — sha-old
`;
  const result = insertBullet(input, 'Added', '- another — sha-new', 'sha-new-long');
  const idxNewBullet = result.content.indexOf('another');
  const idxVersioned = result.content.indexOf('## [0.1.0]');
  check('inserts under Unreleased, not under [0.1.0]', idxNewBullet < idxVersioned && idxNewBullet !== -1);
  check('preserves [0.1.0] section', result.content.includes('- old — sha-old'));
});

group('bodyHasSkipTag', () => {
  // Skip-tag must be on its own line. This is the bug we fixed in workflow run #1:
  // the previous impl used body.includes('[skip changelog]') which matched the tag
  // anywhere — including in prose like "Honors [skip changelog] in body".
  check('matches tag on its own line', bodyHasSkipTag('something\n[skip changelog]\n'));
  check('matches tag with trailing whitespace', bodyHasSkipTag('something\n  [skip changelog]  \n'));
  check('matches tag at end of body without trailing newline', bodyHasSkipTag('something\n[skip changelog]'));
  check('matches tag at start of body', bodyHasSkipTag('[skip changelog]\nsomething'));
  check(
    'does NOT match tag in prose (sentence)',
    !bodyHasSkipTag('Honors [skip changelog] tag in the body for opt-out.'),
  );
  check(
    'does NOT match tag inside backticks in prose',
    !bodyHasSkipTag('Skips when body has `[skip changelog]` token.'),
  );
  check('empty body returns false', !bodyHasSkipTag(''));
});

// ────────────────────────────────────────────────────────────────────────────

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
