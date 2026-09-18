import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { git, localChanges, workingTree } from './lib/verification-git.ts';
import {
  consumes,
  decide,
  digest,
  type Evidence,
  fingerprint,
  type Group,
  type Snapshot,
} from './lib/verification-policy.ts';
import { readEvidence, receiptPath, writeEvidence } from './lib/verification-receipts.ts';
import { readTail, runCheck } from './run-check.ts';

interface Check {
  id: string;
  group?: Group;
  command: string[];
  cwd?: string;
  optional?: boolean;
  fresh?: boolean;
}
export const checks: Check[] = [
  {
    id: 'backend-build',
    group: 'backend_unit',
    command: ['dotnet', 'build', '--nologo', '--verbosity', 'quiet'],
    cwd: 'backend',
  },
  {
    id: 'backend-unit',
    group: 'backend_unit',
    command: ['dotnet', 'test', '--filter', 'FullyQualifiedName!~Planb.IntegrationTests'],
    cwd: 'backend',
    optional: true,
  },
  {
    id: 'backend-integration',
    group: 'backend',
    command: ['dotnet', 'test', 'tests/Planb.IntegrationTests'],
    cwd: 'backend',
    optional: true,
    fresh: true,
  },
  { id: 'frontend-lint', group: 'frontend', command: ['bun', 'run', 'lint'], cwd: 'frontend' },
  {
    id: 'frontend-types',
    group: 'frontend',
    command: ['bun', 'run', 'typecheck'],
    cwd: 'frontend',
  },
  { id: 'frontend-unit', group: 'frontend', command: ['bun', 'run', 'test'], cwd: 'frontend' },
  {
    id: 'frontend-build',
    group: 'frontend',
    command: ['bun', 'run', 'build'],
    cwd: 'frontend',
    optional: true,
  },
  { id: 'react-doctor', group: 'frontend', command: ['bun', 'scripts/run-react-doctor.ts'] },
  {
    id: 'scripts-lint',
    group: 'tooling',
    command: ['bun', 'frontend/node_modules/@biomejs/biome/bin/biome', 'check', 'scripts'],
  },
  {
    id: 'scripts-types',
    group: 'tooling',
    command: [
      'bun',
      'frontend/node_modules/typescript/bin/tsc',
      '--noEmit',
      '-p',
      'scripts/tsconfig.json',
    ],
  },
  { id: 'scripts-test', group: 'tooling', command: ['bun', 'test', 'scripts/'] },
  {
    id: 'agent-config',
    group: 'tooling',
    command: ['bun', 'scripts/check-agent-config.ts', '--strict'],
    optional: true,
  },
  { id: 'docs', command: ['bun', 'scripts/check-docs.ts'] },
  {
    id: 'e2e',
    group: 'e2e',
    command: ['bun', 'scripts/run-e2e.ts', '--build'],
    optional: true,
    fresh: true,
  },
];

function generatedTypes(root: string): Snapshot {
  const files: Snapshot = {};
  const folder = resolve(root, 'frontend/.next/types');
  if (existsSync(folder)) {
    for (const path of readdirSync(folder, { recursive: true, withFileTypes: true })) {
      if (path.isFile()) {
        const absolute = join(path.parentPath, path.name);
        files[absolute.slice(folder.length)] = digest(readFileSync(absolute).toString('base64'));
      }
    }
  }
  return files;
}

function localInputs(root: string, check: Check) {
  const inputs: Snapshot = {};
  for (const folder of [root, resolve(root, 'frontend')]) {
    if (!existsSync(folder)) continue;
    for (const name of readdirSync(folder).filter((name) => name.startsWith('.env'))) {
      const path = resolve(folder, name);
      if (statSync(path).isFile()) inputs[path] = digest(readFileSync(path).toString('base64'));
    }
  }
  // El lockfile no demuestra qué versión está instalada en una máquina local.
  const packages = (folder: string) => {
    if (!existsSync(folder)) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = resolve(folder, entry.name);
      if (entry.name.startsWith('@')) {
        packages(path);
        continue;
      }
      const manifest = resolve(path, 'package.json');
      if (existsSync(manifest))
        inputs[manifest] = digest([
          readFileSync(manifest).toString('base64'),
          statSync(manifest).mtimeMs,
        ]);
      packages(resolve(path, 'node_modules'));
    }
  };
  if (check.cwd !== 'backend') packages(resolve(root, 'frontend/node_modules'));
  if (check.id === 'frontend-types') {
    const nextEnv = resolve(root, 'frontend/next-env.d.ts');
    if (existsSync(nextEnv)) inputs[nextEnv] = digest(readFileSync(nextEnv).toString('base64'));
    Object.assign(inputs, generatedTypes(root));
  }
  return inputs;
}

export function parseArgs(args: string[]) {
  const options = {
    plan: false,
    force: false,
    full: false,
    ciOnly: false,
    from: 'origin/main',
    only: [] as string[],
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--plan') options.plan = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--full') {
      options.full = true;
      options.force = true;
    } else if (arg === '--ci-only') options.ciOnly = true;
    else if (
      (arg === '--from' || arg === '--only') &&
      args[index + 1] &&
      !args[index + 1].startsWith('--')
    ) {
      const value = args[++index];
      if (arg === '--from') options.from = value;
      else options.only = value.split(',');
    } else throw new Error(`Unknown or incomplete option: ${arg}`);
  }
  for (const id of options.only)
    if (!checks.some((check) => check.id === id)) throw new Error(`Unknown check: ${id}`);
  if (options.full && options.only.length) throw new Error('--full cannot be combined with --only');
  return options;
}

export async function main(
  args: string[],
  root = resolve(import.meta.dirname, '..'),
): Promise<number> {
  const options = parseArgs(args);
  if (process.env.PLANB_VERIFY_MODE === 'ci') options.ciOnly = true;
  const selected = checks.filter((check) =>
    options.only.length ? options.only.includes(check.id) : options.full || !check.optional,
  );
  let paths: string[] | undefined;
  try {
    paths = localChanges(root, options.from);
  } catch {
    console.warn('No se pudo calcular el diff: se conservan todos los checks seleccionados.');
  }
  const cache = resolve(root, git(root, 'rev-parse', '--git-path', 'planb-verification'));
  const runtime: Record<string, string> = {
    bun: process.versions.bun ?? '',
    node: execFileSync('node', ['--version'], { encoding: 'utf8', windowsHide: true }).trim(),
    platform: process.platform,
    arch: process.arch,
  };
  const environment = Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => !/^(GIT_|LEFTHOOK|PWD$|OLDPWD$|SHLVL$|_$)/.test(key))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  let failed = false;
  const controller = new AbortController();
  const interrupt = () => controller.abort(130);
  const terminate = () => controller.abort(143);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  try {
    for (const check of selected) {
      const affected =
        options.only.length > 0 ||
        !paths ||
        paths.some((path) =>
          check.group
            ? consumes(check.group, path) ||
              (check.id === 'react-doctor' && path === 'scripts/run-react-doctor.ts')
            : path.startsWith('docs/') ||
              path.endsWith('.md') ||
              path.startsWith('scripts/check-docs') ||
              path === 'scripts/lib/detect-language.ts',
        );
      if (affected && check.cwd === 'backend' && !runtime.dotnet) {
        runtime.dotnet = execFileSync('dotnet', ['--version'], {
          cwd: resolve(root, 'backend'),
          encoding: 'utf8',
          windowsHide: true,
        }).trim();
      }
      const contextForCheck = () => ({
        command: check.command,
        cwd: check.cwd,
        runtime: { ...runtime, dotnet: check.cwd === 'backend' ? runtime.dotnet : undefined },
        environment,
        localInputs: localInputs(root, check),
        runner:
          check.id === 'react-doctor'
            ? digest(readFileSync(resolve(root, 'scripts/run-react-doctor.ts')).toString('base64'))
            : undefined,
        base: check.id === 'react-doctor' ? git(root, 'rev-parse', 'origin/main') : undefined,
      });
      const context = contextForCheck();
      const snapshot = workingTree(root);
      const hash = check.group
        ? fingerprint(check.group, snapshot, context)
        : digest([snapshot, context]);
      const evidence = readEvidence(cache, check.id);
      const decision = decide({
        affected,
        fingerprint: hash,
        evidence,
        force: options.force || (affected && check.fresh),
      });
      const deferred = options.ciOnly && decision.state === 'run';
      console.log(
        `${check.id}: ${deferred ? 'deferred-to-ci' : decision.state} (${decision.reason})${decision.evidence ? `\n  Evidencia: ${decision.evidence.url}` : ''}`,
      );
      if (decision.state !== 'run' || options.plan || options.ciOnly) continue;
      mkdirSync(cache, { recursive: true });
      const path = receiptPath(cache, check.id);
      const receipt: Evidence = {
        fingerprint: hash,
        outcome: 'incomplete',
        completedAt: Date.now(),
        url: '',
        durationMs: 0,
      };
      writeEvidence(path, receipt);
      const result = await runCheck(
        check.command,
        resolve(root, check.cwd ?? '.'),
        controller.signal,
      );
      const after = workingTree(root);
      const afterContext = contextForCheck();
      const stable = check.group
        ? fingerprint(check.group, after, afterContext) === hash
        : digest([after, afterContext]) === hash;
      receipt.outcome = result.exitCode === 0 && stable ? 'success' : 'failure';
      receipt.completedAt = Date.now();
      receipt.url = result.logPath;
      receipt.durationMs = result.durationMs;
      writeEvidence(path, receipt);
      console.log(
        `  ${receipt.outcome}: ${(result.durationMs / 1000).toFixed(1)}s, log: ${result.logPath}`,
      );
      if (receipt.outcome !== 'success') {
        failed = true;
        console.error(
          stable
            ? readTail(result.logPath)
            : 'Los inputs cambiaron durante el check; el resultado no se conserva como verde.',
        );
      }
      if (controller.signal.aborted) return Number(controller.signal.reason);
    }
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
  }
  return failed ? 1 : 0;
}

if (import.meta.main) process.exitCode = await main(process.argv.slice(2));
