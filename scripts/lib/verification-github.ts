import { type Evidence, type Group, jobNames } from './verification-policy.ts';

interface Run {
  id: number;
  head_sha: string;
  event: string;
  head_branch: string;
  head_repository: { full_name: string } | null;
  pull_requests: { number: number }[];
}
interface Job {
  name: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
  steps?: { name: string; conclusion: string | null }[];
}

export function eligible(run: Run, repository: string, prs: number[] = []): boolean {
  return (
    run.head_repository?.full_name === repository &&
    ((run.event === 'push' && run.head_branch === 'main') ||
      (run.event === 'pull_request' && run.pull_requests.some((item) => prs.includes(item.number))))
  );
}

export function jobEvidence(group: Group, job: Job): Evidence | undefined {
  if (job.name !== jobNames[group]) return;
  const marker = job.steps?.find((step) => step.name.startsWith(`Evidence ${group} `));
  const hash = marker?.name.slice(`Evidence ${group} `.length);
  const validHash = hash && /^[a-f0-9]{64}$/.test(hash);
  if (!validHash && ['success', 'skipped'].includes(job.conclusion ?? '')) return;
  const completedAt = Date.parse(job.completed_at ?? job.started_at) || Date.now();
  return {
    // Sin fingerprint, un fallo o ejecución parcial posterior invalida cualquier verde anterior.
    fingerprint: validHash ? hash : '*',
    outcome: marker?.conclusion === 'success' ? job.conclusion : 'incomplete',
    completedAt,
    url: job.html_url,
    durationMs: Math.max(0, completedAt - Date.parse(job.started_at)),
  };
}

type Request = (url: string, init?: RequestInit) => Promise<Response>;

export async function history(
  repository: string,
  token: string,
  head: string,
  pr?: number,
  request: Request = fetch,
) {
  async function api<T>(path: string): Promise<T> {
    const response = await request(`https://api.github.com/repos/${repository}/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`GitHub evidence unavailable: ${response.status}`);
    return (await response.json()) as T;
  }
  type Pull = {
    number: number;
    merged_at: string | null;
    base: { ref: string };
    head: { ref: string };
  };
  const pulls = pr
    ? [await api<Pull>(`pulls/${pr}`)]
    : (await api<Pull[]>(`commits/${head}/pulls`)).filter(
        (item) => item.merged_at && item.base.ref === 'main',
      );
  const prs = pulls.map((item) => item.number);
  const { workflow_runs: runs } = await api<{ workflow_runs: Run[] }>(
    'actions/workflows/ci.yml/runs?per_page=30',
  );
  // Incluye intentos anteriores del run actual. Sus consumidores actuales esperan este selector.
  // GitHub vacía pull_requests de runs antiguos al borrar la rama. La asociación por commit
  // conserva la procedencia del PR sin confiar solamente en un nombre de rama reutilizable.
  const associated = await Promise.all(
    runs.map(async (run) => {
      if (
        run.head_repository?.full_name !== repository ||
        run.event !== 'pull_request' ||
        run.pull_requests.length ||
        !pulls.some((pull) => pull.head.ref === run.head_branch)
      )
        return run;
      return {
        ...run,
        pull_requests: await api<{ number: number }[]>(`commits/${run.head_sha}/pulls`),
      };
    }),
  );
  const candidates = associated.filter((run) => eligible(run, repository, prs)).slice(0, 10);
  const results = await Promise.all(
    candidates.map(async (run) => {
      const response = await api<{ total_count: number; jobs: Job[] }>(
        `actions/runs/${run.id}/jobs?filter=all&per_page=100`,
      );
      if (response.total_count > 100) throw new Error('Evidence history truncated');
      return response.jobs;
    }),
  );
  return results.flat();
}

/** Resuelve los tags públicos antes de decidir: una imagen nueva invalida su evidencia. */
export async function dockerImage(
  repository: string,
  tag: string,
  request: Request = fetch,
): Promise<string> {
  const auth = await request(
    `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:pull`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!auth.ok) throw new Error(`Registry authorization failed: ${auth.status}`);
  const { token } = (await auth.json()) as { token: string };
  const response = await request(`https://registry-1.docker.io/v2/${repository}/manifests/${tag}`, {
    method: 'HEAD',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:
        'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json',
    },
    signal: AbortSignal.timeout(15_000),
  });
  const hash = response.headers.get('docker-content-digest');
  if (!response.ok || !hash || !/^sha256:[a-f0-9]{64}$/.test(hash))
    throw new Error('Image digest unavailable');
  return `${repository}@${hash}`;
}
