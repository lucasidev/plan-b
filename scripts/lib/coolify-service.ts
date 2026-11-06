// Coolify 4.6.0: GET expone el Compose con read:sensitive; PATCH recibe base64 UTF-8.
declare const Bun: { YAML: { parse(text: string): unknown; stringify(value: unknown): string } };

export interface ServiceSpec {
  uuid: string;
  name: string;
  serviceName: string;
  image: string;
  allowedImageRepositories: readonly string[];
}
export interface PreparedService {
  spec: ServiceSpec;
  originalRaw: string;
  compose: Record<string, unknown>;
  updatedRaw: string;
}
export interface Runtime {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  signal?: AbortSignal;
}
export interface Timeouts {
  serviceMs: number;
  probeMs: number;
  pollMs: number;
  requestMs: number;
}
export class DeploymentError extends Error {}
export function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new DeploymentError(`Missing required environment variable: ${name}.`);
  return value;
}
export function parseUrl(value: string, name: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search)
      throw new Error();
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new DeploymentError(`Invalid URL: ${name}.`);
  }
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new DeploymentError('Invalid Coolify configuration.');
  return value as Record<string, unknown>;
}
function repository(image: unknown): string {
  if (typeof image !== 'string' || !/^[a-z0-9][a-z0-9./:_@-]+$/.test(image))
    throw new DeploymentError('Invalid image reference.');
  return image.split('@')[0].replace(/:[^/]+$/, '');
}
export function stringifyCompose(compose: Record<string, unknown>): string {
  try {
    return Bun.YAML.stringify(compose);
  } catch {
    throw new DeploymentError('Cannot serialize Compose.');
  }
}
function validateIdentity(spec: ServiceSpec): void {
  if (
    !/^[a-zA-Z0-9-]{16,64}$/.test(spec.uuid) ||
    !/^[a-zA-Z0-9_-]+$/.test(spec.serviceName) ||
    !spec.name
  )
    throw new DeploymentError('Invalid service identity.');
}
export function preflightCompose(payload: unknown, spec: ServiceSpec): PreparedService {
  validateIdentity(spec);
  const data = record(payload);
  if (data.uuid !== spec.uuid || data.name !== spec.name)
    throw new DeploymentError('Coolify resource identity mismatch.');
  if (
    !Array.isArray(data.applications) ||
    data.applications.length !== 1 ||
    record(data.applications[0]).name !== spec.serviceName ||
    !Array.isArray(data.databases) ||
    data.databases.length !== 0
  )
    throw new DeploymentError('Expected one application and no databases.');
  if (typeof data.docker_compose_raw !== 'string' || !data.docker_compose_raw.trim())
    throw new DeploymentError('Compose unavailable; token needs read:sensitive.');
  let compose: Record<string, unknown>;
  try {
    compose = record(Bun.YAML.parse(data.docker_compose_raw));
  } catch {
    throw new DeploymentError('Invalid Compose YAML.');
  }
  const services = record(compose.services);
  if (
    Object.keys(services).length !== 1 ||
    !Object.hasOwn(services, spec.serviceName) ||
    compose.include
  )
    throw new DeploymentError('Expected exactly the configured Compose service.');
  const service = record(services[spec.serviceName]);
  if (
    service.build ||
    service.extends ||
    (service.scale !== undefined && service.scale !== 1) ||
    (service.deploy &&
      record(service.deploy).replicas !== undefined &&
      record(service.deploy).replicas !== 1)
  )
    throw new DeploymentError('Builds, extensions and replicas are unsupported.');
  if (
    !/@sha256:[a-f0-9]{64}$/.test(spec.image) ||
    !spec.allowedImageRepositories.includes(repository(spec.image)) ||
    !spec.allowedImageRepositories.includes(repository(service.image))
  )
    throw new DeploymentError('Image must use an allowed repository and an immutable digest.');
  service.image = spec.image;
  service.pull_policy = 'always';
  return {
    spec,
    originalRaw: data.docker_compose_raw,
    compose,
    updatedRaw: stringifyCompose(compose),
  };
}

export class CoolifyClient {
  readonly runtime: Runtime;
  readonly timeouts: Timeouts;
  private readonly url: string;
  constructor(
    private readonly config: { url: string; token: string },
    runtime: Partial<Runtime> = {},
    timeouts: Partial<Timeouts> = {},
  ) {
    this.url = parseUrl(config.url, 'COOLIFY_URL');
    if (
      new URL(this.url).pathname !== '/' ||
      new URL(this.url).protocol !== 'https:' ||
      !config.token
    )
      throw new DeploymentError('Coolify requires an HTTPS origin and a token.');
    this.runtime = {
      fetch: (url, init) => fetch(url, init),
      sleep: (ms) => new Promise((done) => setTimeout(done, ms)),
      now: Date.now,
      ...runtime,
    };
    this.timeouts = {
      serviceMs: 600_000,
      probeMs: 300_000,
      pollMs: 5_000,
      requestMs: 15_000,
      ...timeouts,
    };
  }
  private checkCancellation(): void {
    if (this.runtime.signal?.aborted) throw new DeploymentError('Deployment cancelled.');
  }
  private signal(): AbortSignal {
    const timeout = AbortSignal.timeout(this.timeouts.requestMs);
    return this.runtime.signal ? AbortSignal.any([timeout, this.runtime.signal]) : timeout;
  }
  private async request(
    spec: ServiceSpec,
    suffix = '',
    method = 'GET',
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    validateIdentity(spec);
    this.checkCancellation();
    let response: Response;
    try {
      response = await this.runtime.fetch(`${this.url}/api/v1/services/${spec.uuid}${suffix}`, {
        method,
        redirect: 'error',
        signal: this.signal(),
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new DeploymentError('Coolify request failed or timed out.');
    }
    // El cuerpo puede contener Compose, environment, credenciales anidadas o logs.
    if (response.status === 404 && suffix.startsWith('/logs?')) return { logs: '' };
    if (!response.ok) throw new DeploymentError(`Coolify request failed: HTTP ${response.status}.`);
    try {
      return record(await response.json());
    } catch {
      throw new DeploymentError('Invalid Coolify JSON response.');
    }
  }
  async prepare(spec: ServiceSpec): Promise<PreparedService> {
    return preflightCompose(await this.request(spec), spec);
  }
  async get(spec: ServiceSpec): Promise<{ status: string; raw: string }> {
    const data = await this.request(spec);
    const prepared = preflightCompose(data, spec);
    const application = record((data.applications as unknown[])[0]);
    if (typeof application.status !== 'string')
      throw new DeploymentError('Missing application status.');
    return { status: application.status, raw: prepared.originalRaw };
  }
  async waitFor(
    label: string,
    predicate: () => Promise<boolean>,
    timeoutMs = this.timeouts.serviceMs,
  ): Promise<void> {
    const deadline = this.runtime.now() + timeoutMs;
    while (this.runtime.now() < deadline) {
      this.checkCancellation();
      if (await predicate()) {
        this.checkCancellation();
        return;
      }
      const signal = this.runtime.signal;
      await new Promise<void>((resolve, reject) => {
        const abort = () => reject(new DeploymentError('Deployment cancelled.'));
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) abort();
        this.runtime
          .sleep(this.timeouts.pollMs)
          .then(resolve, reject)
          .finally(() => signal?.removeEventListener('abort', abort));
      });
    }
    throw new DeploymentError(`Timed out waiting for ${label}.`);
  }
  async stop(prepared: PreparedService): Promise<void> {
    const current = await this.get(prepared.spec);
    if (current.raw !== prepared.originalRaw)
      throw new DeploymentError('Compose changed after preflight.');
    if (/^(exited|stopped)(:|$)/.test(current.status)) return;
    await this.request(prepared.spec, '/stop?docker_cleanup=false', 'POST');
    await this.waitFor('service to stop', async () =>
      /^(exited|stopped)(:|$)/.test((await this.get(prepared.spec)).status),
    );
  }
  async update(prepared: PreparedService, raw = prepared.updatedRaw): Promise<void> {
    if ((await this.get(prepared.spec)).raw !== prepared.originalRaw)
      throw new DeploymentError('Compose changed after preflight.');
    await this.request(prepared.spec, '', 'PATCH', {
      docker_compose_raw: Buffer.from(raw, 'utf8').toString('base64'),
    });
    if ((await this.get(prepared.spec)).raw !== raw)
      throw new DeploymentError('Coolify did not retain the requested Compose.');
    prepared.originalRaw = raw;
  }
  async start(prepared: PreparedService): Promise<void> {
    const current = await this.get(prepared.spec);
    if (current.raw !== prepared.originalRaw || !/^(exited|stopped)(:|$)/.test(current.status))
      throw new DeploymentError('Service must be stopped with the expected Compose before start.');
    await this.request(prepared.spec, '/start', 'POST');
  }
  async waitHealthy(
    prepared: PreparedService,
    options: { requireHealthcheck?: boolean } = {},
  ): Promise<void> {
    await this.waitFor('service health', async () => {
      const current = await this.get(prepared.spec);
      if (current.raw !== prepared.originalRaw)
        throw new DeploymentError('Compose changed during deployment.');
      if (current.status === 'running:unhealthy' || current.status.startsWith('dead'))
        throw new DeploymentError('Service became unhealthy.');
      return (
        current.status === 'running:healthy' ||
        (options.requireHealthcheck === false && current.status === 'running:unknown')
      );
    });
  }
  async deploy(
    prepared: PreparedService,
    options: { requireHealthcheck?: boolean } = {},
  ): Promise<void> {
    const service = record(record(prepared.compose.services)[prepared.spec.serviceName]);
    if (
      service.profiles ||
      (options.requireHealthcheck !== false && record(service.healthcheck).disable === true)
    )
      throw new DeploymentError(
        'Long-lived service requires an enabled healthcheck and no profile.',
      );
    await this.stop(prepared);
    await this.update(prepared);
    await this.start(prepared);
    await this.waitHealthy(prepared, options);
  }
  async logs(prepared: PreparedService): Promise<string> {
    const query = new URLSearchParams({
      sub_service_name: prepared.spec.serviceName,
      lines: '1000',
    });
    const data = await this.request(prepared.spec, `/logs?${query}`);
    if (typeof data.logs !== 'string') throw new DeploymentError('Invalid service logs response.');
    return data.logs;
  }
  async probe(url: string, expectedSha?: string): Promise<void> {
    const target = parseUrl(url, 'public probe');
    await this.waitFor(
      'public probe',
      async () => {
        try {
          const response = await this.runtime.fetch(target, {
            method: 'GET',
            redirect: 'error',
            cache: 'no-store',
            signal: this.signal(),
          });
          if (response.status !== 200) return false;
          if (expectedSha !== undefined)
            return record(await response.json()).version === expectedSha;
          return true;
        } catch {
          return false;
        }
      },
      this.timeouts.probeMs,
    );
  }
}
