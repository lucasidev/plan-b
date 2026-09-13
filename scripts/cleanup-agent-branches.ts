#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type BranchState = {
  branch: string;
  active: boolean;
  uniqueCommits: number;
  equivalentCommits: number;
  error?: string;
};

type GitResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const EPHEMERAL_BRANCH_PREFIX = 'worktree-agent-';

function runGit(args: string[], cwd: string): GitResult {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

export function parseActiveBranches(porcelain: string): Set<string> {
  const prefix = 'branch refs/heads/';
  return new Set(
    porcelain
      .split(/\r?\n/)
      .filter((line) => line.startsWith(prefix))
      .map((line) => line.slice(prefix.length)),
  );
}

export function countCherryLines(output: string): {
  uniqueCommits: number;
  equivalentCommits: number;
} {
  const lines = output.split(/\r?\n/).filter(Boolean);
  return {
    uniqueCommits: lines.filter((line) => line.startsWith('+ ')).length,
    equivalentCommits: lines.filter((line) => line.startsWith('- ')).length,
  };
}

export function canDeleteBranch(state: BranchState): boolean {
  return !state.active && !state.error && state.uniqueCommits === 0;
}

function repositoryRoot(cwd: string): string | null {
  const result = runGit(['rev-parse', '--show-toplevel'], cwd);
  return result.status === 0 ? result.stdout.trim() : null;
}

function listStates(root: string, base: string): BranchState[] {
  const worktrees = runGit(['worktree', 'list', '--porcelain'], root);
  const refs = runGit(
    ['for-each-ref', '--format=%(refname:short)', `refs/heads/${EPHEMERAL_BRANCH_PREFIX}*`],
    root,
  );
  if (worktrees.status !== 0 || refs.status !== 0) return [];

  const active = parseActiveBranches(worktrees.stdout);
  const branches = refs.stdout.split(/\r?\n/).filter(Boolean);
  return branches.map((branch) => {
    if (active.has(branch)) {
      return { branch, active: true, uniqueCommits: 0, equivalentCommits: 0 };
    }

    const cherry = runGit(['cherry', base, branch], root);
    if (cherry.status !== 0) {
      return {
        branch,
        active: false,
        uniqueCommits: 0,
        equivalentCommits: 0,
        error: cherry.stderr.trim() || 'git cherry failed',
      };
    }

    return { branch, active: false, ...countCherryLines(cherry.stdout) };
  });
}

function printReport(states: BranchState[], base: string): void {
  const safe = states.filter(canDeleteBranch);
  const active = states.filter((state) => state.active);
  const unique = states.filter((state) => !state.active && state.uniqueCommits > 0);
  const errors = states.filter((state) => state.error);

  console.log(`Base: ${base}`);
  console.log(`Borrables: ${safe.length}`);
  for (const state of safe) console.log(`  delete ${state.branch}`);
  console.log(`Activas: ${active.length}`);
  for (const state of active) console.log(`  keep   ${state.branch}`);
  console.log(`Con commits únicos: ${unique.length}`);
  for (const state of unique)
    console.log(`  keep   ${state.branch} (${state.uniqueCommits} commit(s) único(s))`);
  for (const state of errors) console.log(`  error  ${state.branch}: ${state.error}`);
}

function runHook(root: string): void {
  const safe = listStates(root, 'HEAD').filter(canDeleteBranch);
  if (safe.length === 0) {
    console.log('{}');
    return;
  }

  const sample = safe
    .slice(0, 5)
    .map((state) => state.branch)
    .join(', ');
  const suffix = safe.length > 5 ? ` y ${safe.length - 5} más` : '';
  console.log(
    JSON.stringify({
      decision: 'block',
      reason: `Quedaron ramas efímeras ya integradas: ${sample}${suffix}. Ejecutá \`bun scripts/cleanup-agent-branches.ts --base HEAD --apply\` antes de cerrar.`,
    }),
  );
}

function main(): void {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : 'HEAD';
  const hook = args.includes('--hook');
  const apply = args.includes('--apply');

  let cwd = process.cwd();
  if (hook) {
    try {
      const input = JSON.parse(readFileSync(0, 'utf8')) as { cwd?: string };
      if (input.cwd) cwd = input.cwd;
    } catch {
      console.log('{}');
      return;
    }
  }

  const root = repositoryRoot(cwd);
  if (!root || !base) {
    if (hook) console.log('{}');
    else console.error('No se pudo resolver el repositorio o la base.');
    process.exitCode = hook ? 0 : 1;
    return;
  }

  if (hook) {
    runHook(root);
    return;
  }

  const states = listStates(root, base);
  printReport(states, base);
  if (!apply) return;

  let failed = false;
  for (const state of states.filter(canDeleteBranch)) {
    const deletion = runGit(['branch', '-D', '--', state.branch], root);
    if (deletion.status !== 0) {
      failed = true;
      console.error(`No se pudo borrar ${state.branch}: ${deletion.stderr.trim()}`);
    }
  }
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.main) main();
