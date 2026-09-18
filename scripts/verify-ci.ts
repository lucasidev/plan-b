import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { git, tree } from './lib/verification-git.ts';
import { dockerImage, history, jobEvidence } from './lib/verification-github.ts';
import { changedPaths, consumes, decide, fingerprint, groups } from './lib/verification-policy.ts';

export async function main(impactOnly = false): Promise<void> {
  const root = resolve(import.meta.dirname, '..');
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? '', 'utf8'));
  const output = process.env.GITHUB_OUTPUT;
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!output || !summary || !process.env.GITHUB_REPOSITORY) throw new Error('Missing CI context');
  const snapshot = tree(root, 'HEAD');
  const base = event.pull_request?.base?.sha ?? event.before;
  // Dispatch manual siempre fuerza todo; no depende de un diff vacío en main.
  const force =
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' || process.env.VERIFY_FULL === 'true';
  const paths =
    base && !/^0+$/.test(base) ? changedPaths(tree(root, base), snapshot) : Object.keys(snapshot);
  const needsDotnet =
    force ||
    paths.some(
      (path) =>
        consumes('backend_unit', path) || consumes('backend', path) || consumes('e2e', path),
    );
  const needsServices =
    force || paths.some((path) => consumes('backend', path) || consumes('e2e', path));
  if (impactOnly) {
    appendFileSync(output, `need_dotnet=${needsDotnet}\n`);
    return;
  }
  const bun = process.versions.bun;
  const dotnet = needsDotnet
    ? execFileSync('dotnet', ['--version'], {
        cwd: resolve(root, 'backend'),
        encoding: 'utf8',
      }).trim()
    : '';
  const [postgres, mailpit, redis] = needsServices
    ? await Promise.all([
        dockerImage('pgvector/pgvector', 'pg17'),
        dockerImage('axllent/mailpit', 'v1.29'),
        dockerImage('library/redis', '7-alpine'),
      ])
    : ['', '', ''];
  const context = {
    image: process.env.ImageVersion,
    os: process.env.ImageOS,
    arch: process.arch,
    bun,
    dotnet,
    postgres,
    mailpit,
    redis,
  };
  if (!context.image || !bun) throw new Error('Unknown runner/runtime version');
  // Ante una API inaccesible no se reutiliza nada; el detector de impacto sigue sirviendo.
  let jobs: Awaited<ReturnType<typeof history>> = [];
  try {
    if (!force)
      jobs = await history(
        process.env.GITHUB_REPOSITORY,
        process.env.GH_TOKEN ?? '',
        process.env.GITHUB_SHA ?? '',
        event.pull_request?.number,
      );
  } catch (error) {
    console.warn(String(error));
  }
  const lines = ['| Check | Decisión | Motivo / evidencia |', '|---|---|---|'];
  const outputs = [
    `bun_version=${bun}`,
    `dotnet_version=${dotnet}`,
    `runner_image=${context.image}`,
    `postgres_image=${postgres}`,
    `mailpit_image=${mailpit}`,
    `redis_image=${redis}`,
  ];
  let savedMs = 0;
  for (const group of groups) {
    const { image, os, arch } = context;
    const environment = {
      image,
      os,
      arch,
      bun: group !== 'backend' ? bun : undefined,
      dotnet: ['backend_unit', 'backend', 'e2e'].includes(group) ? dotnet : undefined,
      services: ['backend', 'e2e'].includes(group) ? { postgres, mailpit, redis } : undefined,
    };
    const hash = fingerprint(group, snapshot, environment);
    const evidence = jobs.flatMap((job) => {
      const item = jobEvidence(group, job);
      return item ? [item] : [];
    });
    const decision = decide({
      affected: paths.some((path) => consumes(group, path)),
      fingerprint: hash,
      evidence,
      force,
    });
    outputs.push(`${group}=${decision.state === 'run'}`, `${group}_fingerprint=${hash}`);
    lines.push(
      `| ${group} | ${decision.state} | ${decision.evidence ? `[${decision.reason}](${decision.evidence.url})` : decision.reason} |`,
    );
    savedMs += decision.evidence?.durationMs ?? 0;
  }
  lines.push(
    '',
    `Commit inspeccionado: ${git(root, 'rev-parse', 'HEAD')}.`,
    `Tiempo previo de los jobs reutilizados: ${(savedMs / 60_000).toFixed(1)} minutos de runner (referencia, no ahorro facturado).`,
  );
  // Publica las decisiones juntas: un error previo no deja outputs parciales de omisión.
  appendFileSync(output, `${outputs.join('\n')}\n`);
  appendFileSync(summary, `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
}

if (import.meta.main) await main(process.argv.includes('--impact'));
