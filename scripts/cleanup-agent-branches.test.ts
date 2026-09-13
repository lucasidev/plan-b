import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { canDeleteBranch, countCherryLines, parseActiveBranches } from './cleanup-agent-branches';

describe('cleanup-agent-branches', () => {
  test('recognizes branches owned by active worktrees', () => {
    const branches = parseActiveBranches(`worktree C:/repo
HEAD abc
branch refs/heads/main

worktree C:/repo/.worktrees/agent
HEAD def
branch refs/heads/worktree-agent-123
`);

    assert.deepEqual(branches, new Set(['main', 'worktree-agent-123']));
  });

  test('a single unique patch prevents deletion', () => {
    const counts = countCherryLines(`- abc already-integrated
+ def still-unique
`);

    assert.equal(
      canDeleteBranch({ branch: 'worktree-agent-123', active: false, ...counts }),
      false,
    );
  });

  test('an inactive branch with no unique patches can be deleted', () => {
    const counts = countCherryLines(`- abc integrated-by-rebase
- def integrated-by-squash
`);

    assert.equal(canDeleteBranch({ branch: 'worktree-agent-123', active: false, ...counts }), true);
  });

  test('an active branch is never deleted even when its patches are integrated', () => {
    assert.equal(
      canDeleteBranch({
        branch: 'worktree-agent-123',
        active: true,
        uniqueCommits: 0,
        equivalentCommits: 2,
      }),
      false,
    );
  });
});
