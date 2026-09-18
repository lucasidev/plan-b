import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { digest, type Snapshot } from './verification-policy.ts';

export function git(root: string, ...args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  }).trimEnd();
}

export function tree(root: string, ref: string): Snapshot {
  const result: Snapshot = {};
  for (const entry of git(root, 'ls-tree', '-r', '-z', ref).split('\0').filter(Boolean)) {
    const match = /^(\d+) (blob|commit) ([a-f0-9]+)\t(.+)$/.exec(entry);
    if (!match) throw new Error('Unrecognized git tree entry');
    result[match[4]] = `${match[1]}:${match[3]}`;
  }
  return result;
}

/** Incluye staged, unstaged, nuevos archivos y borrados; nunca usa solo HEAD en local. */
export function workingTree(root: string): Snapshot {
  const result: Snapshot = {};
  const paths = git(root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z');
  for (const path of new Set(paths.split('\0').filter(Boolean))) {
    const absolute = resolve(root, path);
    try {
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) throw new Error(`Unsupported submodule: ${path}`);
      result[path] = digest([
        stat.mode & 0o111,
        stat.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute).toString('base64'),
      ]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return result;
}

export function localChanges(root: string, from: string): string[] {
  const base = git(root, 'merge-base', from, 'HEAD');
  return [
    ...new Set(
      [
        ...git(root, 'diff', '--name-only', '--no-renames', '-z', base).split('\0'),
        ...git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0'),
      ].filter(Boolean),
    ),
  ];
}
