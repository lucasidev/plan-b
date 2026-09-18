import { createHash } from 'node:crypto';

export const groups = ['backend_unit', 'backend', 'frontend', 'tooling', 'e2e'] as const;
export type Group = (typeof groups)[number];
export type Snapshot = Record<string, string>;
export const jobNames: Record<Group, string> = {
  backend_unit: 'Backend unit (.NET 10)',
  backend: 'Backend (.NET 10)',
  frontend: 'Frontend checks',
  tooling: 'Tooling checks',
  e2e: 'E2E (Playwright)',
};

export function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function shared(path: string): boolean {
  return (
    path === '.github/workflows/ci.yml' ||
    path.startsWith('scripts/verify') ||
    path.startsWith('scripts/lib/verification-') ||
    ['.gitattributes', '.gitignore', '.editorconfig', 'global.json', 'NuGet.Config'].includes(path)
  );
}

function known(path: string): boolean {
  return (
    /^(backend\/|frontend\/|scripts\/|docs\/|\.github\/|\.agents\/|\.claude\/|\.codex\/|deploy\/|k6\/)/.test(
      path,
    ) ||
    /\.md$/i.test(path) ||
    [
      'biome.json',
      'Justfile',
      'lefthook.yml',
      'docker-compose.yml',
      '.dockerignore',
      '.env.example',
      '.env.stage.local.example',
      '.gitmodules',
      'LICENSE',
    ].includes(path)
  );
}

/** Un path desconocido conserva todas las verificaciones hasta clasificar su consumidor. */
export function consumes(group: Group, path: string): boolean {
  if (shared(path) || !known(path)) return true;
  const backend = path.startsWith('backend/');
  const frontend = path.startsWith('frontend/');
  switch (group) {
    case 'backend_unit':
      return backend || path === 'scripts/check-migrations.ts';
    case 'backend':
      return backend;
    case 'frontend':
      return frontend;
    case 'e2e':
      return backend || frontend || path === 'scripts/check-flaky.ts';
    case 'tooling':
      return (
        path.startsWith('scripts/') ||
        path.startsWith('.agents/') ||
        path.startsWith('.claude/') ||
        path.startsWith('.codex/') ||
        path.startsWith('.github/') ||
        [
          'biome.json',
          'AGENTS.md',
          'CLAUDE.md',
          'lefthook.yml',
          'Justfile',
          'frontend/package.json',
          'frontend/bun.lock',
        ].includes(path)
      );
  }
}

export function changedPaths(before: Snapshot, after: Snapshot): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((path) => before[path] !== after[path])
    .sort();
}

export function fingerprint(group: Group, snapshot: Snapshot, context: unknown): string {
  return digest([
    group,
    context,
    Object.entries(snapshot)
      .filter(([path]) => consumes(group, path))
      .sort(([a], [b]) => a.localeCompare(b, 'en')),
  ]);
}

export interface Evidence {
  fingerprint: string;
  outcome: string | null;
  completedAt: number;
  url: string;
  durationMs: number;
}

export interface Decision {
  state: 'run' | 'reuse' | 'not-applicable';
  reason: string;
  evidence?: Evidence;
}

export const maxAgeMs = 24 * 60 * 60 * 1000;

export function decide(options: {
  affected: boolean;
  fingerprint: string;
  evidence?: Evidence[];
  force?: boolean;
  now?: number;
}): Decision {
  if (options.force) return { state: 'run', reason: 'ejecución forzada' };
  // Un fallo posterior invalida un verde anterior con los mismos inputs.
  const latest = options.evidence
    ?.filter((item) => item.fingerprint === options.fingerprint || item.fingerprint === '*')
    .sort(
      (a, b) =>
        b.completedAt - a.completedAt ||
        Number(a.outcome === 'success') - Number(b.outcome === 'success'),
    )[0];
  if (latest && latest.outcome !== 'success') {
    return { state: 'run', reason: 'la evidencia más reciente no es verde' };
  }
  if (!options.affected) return { state: 'not-applicable', reason: 'sin cambios en sus inputs' };
  const age = (options.now ?? Date.now()) - (latest?.completedAt ?? 0);
  if (latest && age >= 0 && age < maxAgeMs) {
    return {
      state: 'reuse',
      reason: 'mismos inputs y entorno, evidencia vigente',
      evidence: latest,
    };
  }
  return { state: 'run', reason: 'sin evidencia verde vigente para estos inputs y entorno' };
}
