#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export function doctorEnvironment(repoRoot: string, inherited = process.env): NodeJS.ProcessEnv {
  // El hook hereda GIT_DIR: sin una raíz explícita, Git toma frontend/ como worktree.
  return { ...inherited, GIT_WORK_TREE: repoRoot };
}

export function runReactDoctor(repoRoot = resolve(import.meta.dirname, '..')): number {
  const frontend = resolve(repoRoot, 'frontend');
  const result = spawnSync(
    'node',
    [
      resolve(frontend, 'node_modules/react-doctor/bin/react-doctor.js'),
      '--scope',
      'changed',
      '--base',
      'origin/main',
      '--blocking',
      'error',
      '--no-score',
      '--yes',
    ],
    { cwd: frontend, env: doctorEnvironment(repoRoot), stdio: 'inherit', windowsHide: true },
  );
  if (result.error) console.error(result.error.message);
  return result.status ?? 1;
}

if (import.meta.main) process.exitCode = runReactDoctor();
