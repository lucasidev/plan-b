import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CoolifyClient,
  preflightCompose,
  type ServiceSpec,
  stringifyCompose,
} from './coolify-service.ts';

declare const Bun: { YAML: { parse(text: string): unknown } };
const repo = 'ghcr.io/example/site';
const spec: ServiceSpec = {
  uuid: '0123456789abcdefghijklmn',
  name: 'example-stage-site',
  serviceName: 'legacy-site',
  image: `${repo}:commit@sha256:${'a'.repeat(64)}`,
  allowedImageRepositories: [repo],
};
const compose = {
  services: {
    'legacy-site': {
      image: `${repo}@sha256:${'b'.repeat(64)}`,
      pull_policy: 'never',
      environment: { PASSWORD: `\${M_0123456789ABCDEF0123}`, LITERAL: '$$HOME' },
      labels: ['traefik.enable=true'],
      healthcheck: { test: ['CMD', 'curl', '-f', 'http://localhost'] },
      user: '1000:1000',
      read_only: true,
      cap_drop: ['ALL'],
      security_opt: ['no-new-privileges:true'],
      volumes: ['data:/data:ro'],
      networks: { coolify: { aliases: ['legacy-site'] } },
      mem_limit: 268435456,
      cpus: 0.5,
    },
  },
  volumes: { data: { external: true, name: 'persistent-data' } },
  networks: { coolify: { external: true, name: 'coolify' } },
};
const timeouts = { serviceMs: 20, probeMs: 20, pollMs: 5, requestMs: 15 };

function fixture() {
  let now = 0;
  const state = {
    raw: stringifyCompose(compose),
    status: 'running:healthy',
    stopWorks: true,
    patchWorks: true,
    startedStatus: 'running:healthy',
    httpError: 0,
    publicStatus: 200,
    publicSha: 'new-sha',
    requests: [] as { url: string; init?: RequestInit }[],
  };
  const payload = () => ({
    uuid: spec.uuid,
    name: spec.name,
    docker_compose_raw: state.raw,
    applications: [{ name: spec.serviceName, status: state.status }],
    databases: [],
  });
  const runtime = {
    now: () => now,
    sleep: async (ms: number) => {
      now += ms;
    },
    fetch: async (url: string, init?: RequestInit) => {
      state.requests.push({ url, init });
      if (!url.startsWith('https://coolify.test/'))
        return Response.json({ version: state.publicSha }, { status: state.publicStatus });
      if (state.httpError)
        return new Response('PASSWORD=do-not-leak TOKEN=secret-token', { status: state.httpError });
      if (init?.method === 'PATCH') {
        if (state.patchWorks)
          state.raw = Buffer.from(
            JSON.parse(String(init.body)).docker_compose_raw,
            'base64',
          ).toString('utf8');
        return Response.json({});
      }
      if (url.endsWith('/stop?docker_cleanup=false')) {
        if (state.stopWorks) state.status = 'exited';
        return Response.json({});
      }
      if (url.endsWith('/start')) {
        state.status = state.startedStatus;
        return Response.json({ message: 'queued' });
      }
      if (url.includes('/logs?')) return Response.json({ logs: 'private logs' });
      return Response.json(payload());
    },
  };
  return {
    state,
    payload,
    runtime,
    client: new CoolifyClient(
      { url: 'https://coolify.test', token: 'secret-token' },
      runtime,
      timeouts,
    ),
  };
}

test('preflight conserva toda la configuración salvo imagen y pull_policy', () => {
  const f = fixture();
  const prepared = preflightCompose(f.payload(), spec);
  const expected = structuredClone(compose);
  expected.services['legacy-site'].image = spec.image;
  expected.services['legacy-site'].pull_policy = 'always';
  assert.deepEqual(Bun.YAML.parse(prepared.updatedRaw), expected);
  assert.equal(prepared.originalRaw, f.state.raw);
});

for (const mutate of [
  (p: Record<string, unknown>) => {
    p.uuid = 'other';
  },
  (p: Record<string, unknown>) => {
    p.name = 'other';
  },
  (p: Record<string, unknown>) => {
    p.applications = [{ name: spec.serviceName }, { name: 'extra' }];
  },
  (p: Record<string, unknown>) => {
    p.databases = [{ name: 'db' }];
  },
  (p: Record<string, unknown>) => {
    delete p.docker_compose_raw;
  },
  (p: Record<string, unknown>) => {
    p.docker_compose_raw = 'PASSWORD: [secret-unterminated';
  },
  (p: Record<string, unknown>) => {
    p.docker_compose_raw = stringifyCompose({ services: { extra: { image: spec.image } } });
  },
  (p: Record<string, unknown>) => {
    p.docker_compose_raw = stringifyCompose({ ...compose, include: 'other.yml' });
  },
]) {
  test('preflight rechaza identidad, topología o Compose inválido sin filtrar el payload', () => {
    const payload = fixture().payload();
    mutate(payload);
    assert.throws(
      () => preflightCompose(payload, spec),
      (error: Error) => !/PASSWORD|secret-unterminated/.test(error.message),
    );
  });
}

test('preflight rechaza digest ausente y repositorios ajenos', () => {
  const payload = fixture().payload();
  assert.throws(
    () => preflightCompose(payload, { ...spec, image: `${repo}:latest` }),
    /immutable digest/,
  );
  assert.throws(
    () => preflightCompose(payload, { ...spec, allowedImageRepositories: ['ghcr.io/other/site'] }),
    /allowed repository/,
  );
});

test('despliega stop sin cleanup, PATCH y start en orden con pull always', async () => {
  const f = fixture();
  await f.client.deploy(await f.client.prepare(spec));
  const mutations = f.state.requests.filter(({ init }) => init?.method !== 'GET');
  assert.deepEqual(
    mutations.map(({ url, init }) => [init?.method, new URL(url).pathname + new URL(url).search]),
    [
      ['POST', `/api/v1/services/${spec.uuid}/stop?docker_cleanup=false`],
      ['PATCH', `/api/v1/services/${spec.uuid}`],
      ['POST', `/api/v1/services/${spec.uuid}/start`],
    ],
  );
  const patch = JSON.parse(String(mutations[1].init?.body));
  assert.deepEqual(Object.keys(patch), ['docker_compose_raw']);
  assert.equal(f.state.raw, Buffer.from(patch.docker_compose_raw, 'base64').toString('utf8'));
  assert.ok(f.state.requests.every(({ init }) => init?.redirect === 'error'));
});

test('un healthy anterior no alcanza si stop nunca se confirma', async () => {
  const f = fixture();
  f.state.stopWorks = false;
  await assert.rejects(
    f.client.deploy(await f.client.prepare(spec)),
    /Timed out waiting for service to stop/,
  );
  assert.ok(
    !f.state.requests.some(({ init, url }) => init?.method === 'PATCH' || url.endsWith('/start')),
  );
});

test('un PATCH ignorado bloquea start', async () => {
  const f = fixture();
  f.state.patchWorks = false;
  await assert.rejects(f.client.deploy(await f.client.prepare(spec)), /did not retain/);
  assert.ok(!f.state.requests.some(({ url }) => url.endsWith('/start')));
});

test('un cambio concurrente bloquea antes de mutar', async () => {
  const f = fixture();
  const prepared = await f.client.prepare(spec);
  f.state.raw += '\n';
  await assert.rejects(f.client.deploy(prepared), /changed after preflight/);
  assert.ok(f.state.requests.every(({ init }) => init?.method === 'GET'));
});

test('401 y errores de red no filtran respuestas ni tokens', async () => {
  const f = fixture();
  f.state.httpError = 401;
  await assert.rejects(
    f.client.prepare(spec),
    (e: Error) => /HTTP 401/.test(e.message) && !/PASSWORD|secret-token/.test(e.message),
  );
  const client = new CoolifyClient(
    { url: 'https://coolify.test', token: 'secret-token' },
    {
      fetch: async () => {
        throw new Error('secret-token PASSWORD');
      },
    },
  );
  await assert.rejects(
    client.prepare(spec),
    (e: Error) => e.message === 'Coolify request failed or timed out.',
  );
});

test('cada request tiene un timeout que corta una respuesta colgada', async () => {
  const client = new CoolifyClient(
    { url: 'https://coolify.test', token: 'token' },
    {
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('private error')));
        }),
    },
    { requestMs: 5 },
  );
  // AbortSignal.timeout usa un timer sin ref; el doble no tiene el socket que mantiene vivo fetch.
  const activeRequest = setInterval(() => {}, 10);
  try {
    await assert.rejects(client.prepare(spec), /request failed or timed out/);
  } finally {
    clearInterval(activeRequest);
  }
});

test('sin healthcheck exige opción explícita y luego una prueba pública', async () => {
  const f = fixture();
  const raw = structuredClone(compose) as Record<string, unknown>;
  delete (raw.services as Record<string, Record<string, unknown>>)['legacy-site'].healthcheck;
  f.state.raw = stringifyCompose(raw);
  f.state.startedStatus = 'running:unknown';
  const prepared = await f.client.prepare(spec);
  await assert.rejects(f.client.deploy(prepared));
  assert.ok(f.state.requests.every(({ init }) => init?.method === 'GET'));
  await f.client.deploy(prepared, { requireHealthcheck: false });
  await f.client.probe('https://site.test');
});

for (const status of ['running:unhealthy', 'running:starting', 'exited']) {
  test(`${status} no prueba un deploy sano`, async () => {
    const f = fixture();
    f.state.startedStatus = status;
    await assert.rejects(f.client.deploy(await f.client.prepare(spec)));
  });
}

test('probe rechaza HTTP antes de hacer fetch', async () => {
  const f = fixture();
  await assert.rejects(f.client.probe('http://site.test/health', 'new-sha'), /Invalid URL/);
  assert.equal(f.state.requests.length, 0);
});

test('probe exige SHA exacto, HTTP 200 y no envía el token ni sigue redirecciones', async () => {
  const f = fixture();
  await assert.rejects(f.client.probe('https://site.test/health', 'old-sha'), /Timed out/);
  await f.client.probe('https://site.test/health', 'new-sha');
  f.state.publicStatus = 204;
  await assert.rejects(f.client.probe('https://site.test'), /Timed out/);
  f.state.publicStatus = 307;
  await assert.rejects(f.client.probe('https://site.test'), /Timed out/);
  const probes = f.state.requests.filter(({ url }) => url.startsWith('https://site.test'));
  assert.ok(
    probes.every(
      ({ init }) => init?.redirect === 'error' && !init.headers && init.cache === 'no-store',
    ),
  );
});

test('cancelación bloquea antes de cualquier request', async () => {
  const f = fixture();
  const controller = new AbortController();
  controller.abort();
  const client = new CoolifyClient(
    { url: 'https://coolify.test', token: 'token' },
    { ...f.runtime, signal: controller.signal },
  );
  await assert.rejects(client.prepare(spec), /cancelled/);
  assert.equal(f.state.requests.length, 0);
});
