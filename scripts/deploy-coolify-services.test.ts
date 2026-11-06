import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deployCoolifyServices, readDeploymentConfig } from './deploy-coolify-services.ts';
import { record, stringifyCompose } from './lib/coolify-service.ts';

declare const Bun: { YAML: { parse(text: string): unknown } };
const sha = 'a'.repeat(40);
const roles = ['migrate', 'api', 'web'] as const;
type Role = (typeof roles)[number];
const apiImage = `ghcr.io/lucasidev/plan-b/planb-api:${sha}@sha256:${'b'.repeat(64)}`;
const webImage = `ghcr.io/lucasidev/plan-b/planb-web:${sha}-stage@sha256:${'c'.repeat(64)}`;
const names = {
  migrate: 'planb-stage-migrate-by4rbu',
  api: 'planb-stage-api-7mmcdb',
  web: 'planb-stage-web-phqofv',
};
const timeouts = { serviceMs: 30, probeMs: 30, pollMs: 5, requestMs: 15 };
function environment(): NodeJS.ProcessEnv {
  return {
    COOLIFY_URL: 'https://coolify.test',
    COOLIFY_API_TOKEN: 'private-token',
    COOLIFY_DEPLOY_TARGET: 'stage',
    COOLIFY_EXPECTED_SHA: sha,
    COOLIFY_API_IMAGE: apiImage,
    COOLIFY_WEB_IMAGE: webImage,
    COOLIFY_MIGRATE_SERVICE_UUID: 'migrate0123456789abcdefgh',
    COOLIFY_API_SERVICE_UUID: 'api0123456789abcdefghijk',
    COOLIFY_WEB_SERVICE_UUID: 'web0123456789abcdefghijk',
    COOLIFY_MIGRATE_SERVICE_NAME: names.migrate,
    COOLIFY_API_SERVICE_NAME: names.api,
    COOLIFY_WEB_SERVICE_NAME: names.web,
    COOLIFY_HEALTH_URL: 'https://site.test/health',
    COOLIFY_WEB_URL: 'https://site.test',
  };
}
function fixture() {
  const config = readDeploymentConfig(environment());
  const original = Object.fromEntries(
    roles.map((role) => [
      role,
      {
        services: {
          [names[role]]: {
            image: (role === 'web' ? webImage : apiImage).replace(/:[a-f0-9]{40}(-stage)?@/, '@'),
            pull_policy: 'never',
            restart: role === 'migrate' ? 'no' : 'unless-stopped',
            environment: {
              ConnectionStrings__Planb: `\${M_6F671679EE13C889B56B}`,
              LITERAL: '$$keep',
            },
            networks: { coolify: { aliases: [names[role]] } },
            volumes: ['data:/data:ro'],
            read_only: true,
            cap_drop: ['ALL'],
            ...(role === 'migrate'
              ? {
                  entrypoint: [
                    `\${M_D762A7F86727ECE576BB}`,
                    `\${M_5A20C84ADF3E201EC8DF}`,
                    `\${M_C24E963165D67D2F9FE5}`,
                  ],
                  profiles: ['manual'],
                }
              : { healthcheck: { test: ['CMD', `\${M_D0CC69BD47535BFD632E}`] } }),
          },
        },
        networks: { coolify: { external: true, name: 'coolify' } },
        volumes: { data: { external: true } },
      },
    ]),
  ) as unknown as Record<Role, Record<string, unknown>>;
  const raw = Object.fromEntries(
    roles.map((role) => [role, stringifyCompose(original[role])]),
  ) as Record<Role, string>;
  const state = {
    raw,
    status: { migrate: 'exited', api: 'running:healthy', web: 'running:healthy' },
    requests: [] as string[],
    patches: [] as { role: Role; compose: Record<string, unknown> }[],
    jobCode: 0 as number | null,
    oldMarker: false,
    logs: 'Old logs, never print PASSWORD',
    healthSha: sha,
    failPatchResponse: false,
    cancel: undefined as (() => void) | undefined,
  };
  let now = 0;
  const runtime = {
    now: () => now,
    sleep: async (ms: number) => {
      now += ms;
    },
    fetch: async (url: string, init?: RequestInit) => {
      const request = new URL(url);
      if (request.origin !== 'https://coolify.test') {
        state.requests.push(`probe:${request.pathname}`);
        return Response.json({ version: state.healthSha });
      }
      const role = roles.find((role) => request.pathname.split('/')[4] === config[role].uuid);
      assert.ok(role, 'known resource');
      if (init?.method === 'PATCH') {
        state.requests.push(`patch:${role}`);
        state.raw[role] = Buffer.from(
          JSON.parse(String(init.body)).docker_compose_raw,
          'base64',
        ).toString('utf8');
        state.patches.push({ role, compose: record(Bun.YAML.parse(state.raw[role])) });
        if (state.failPatchResponse && role === 'migrate') {
          state.failPatchResponse = false;
          throw new Error('private response failure');
        }
        return Response.json({});
      }
      if (request.pathname.endsWith('/stop')) {
        assert.equal(request.searchParams.get('docker_cleanup'), 'false');
        state.requests.push(`stop:${role}`);
        state.status[role] = 'exited';
        return Response.json({});
      }
      if (request.pathname.endsWith('/start')) {
        state.requests.push(`start:${role}`);
        if (role === 'migrate') {
          const app = record(
            record(record(Bun.YAML.parse(state.raw.migrate)).services)[names.migrate],
          );
          const entrypoint = app.entrypoint as string[];
          const nonce = /COOLIFY_CI_MIGRATION:([a-f0-9]+):/.exec(entrypoint[2])?.[1];
          assert.ok(nonce);
          assert.ok(!app.profiles);
          assert.equal(app.restart, 'no');
          assert.ok(entrypoint[2].startsWith('dotnet Planb.Api.dll migrate-db; rc=$$?;'));
          assert.ok(entrypoint[2].endsWith('exit "$$rc"'));
          state.logs = state.oldMarker
            ? 'COOLIFY_CI_MIGRATION:old:0\n'
            : state.jobCode === null
              ? ''
              : `private log\nCOOLIFY_CI_MIGRATION:${nonce}:${state.jobCode}\n`;
          state.status.migrate = state.jobCode === null ? 'running:unknown' : 'exited';
          state.cancel?.();
        } else state.status[role] = 'running:healthy';
        return Response.json({ message: 'Service starting request queued.' });
      }
      if (request.pathname.endsWith('/logs')) {
        state.requests.push(`logs:${role}`);
        return Response.json({ logs: state.logs });
      }
      state.requests.push(`get:${role}`);
      return Response.json({
        uuid: config[role].uuid,
        name: config[role].name,
        docker_compose_raw: state.raw[role],
        applications: [{ name: names[role], status: state.status[role] }],
        databases: [],
      });
    },
  };
  return { state, runtime, config, original };
}
function service(raw: string, role: Role): Record<string, unknown> {
  return record(record(record(Bun.YAML.parse(raw)).services)[names[role]]);
}
function assertRestored(f: ReturnType<typeof fixture>) {
  const actual = service(f.state.raw.migrate, 'migrate');
  const expected = record(record(f.original.migrate.services)[names.migrate]);
  assert.deepEqual(actual.entrypoint, expected.entrypoint);
  assert.deepEqual(actual.profiles, ['manual']);
  assert.deepEqual(actual.environment, expected.environment);
  assert.equal(actual.image, apiImage);
  assert.equal(actual.pull_policy, 'always');
}

test('preflight completo, Migrate exit0 nuevo, API sana, web sana y probes en ese orden', async () => {
  const f = fixture();
  await deployCoolifyServices(f.config, f.runtime, timeouts);
  assert.deepEqual(f.state.requests.slice(0, 3), ['get:migrate', 'get:api', 'get:web']);
  assert.deepEqual(
    f.state.requests.filter((r) => /^(patch|start|stop|probe):/.test(r)),
    [
      'patch:migrate',
      'start:migrate',
      'patch:migrate',
      'stop:api',
      'patch:api',
      'start:api',
      'stop:web',
      'patch:web',
      'start:web',
      'probe:/health',
      'probe:/',
    ],
  );
  assertRestored(f);
  for (const role of ['api', 'web'] as const) {
    const expected = structuredClone(f.original[role]);
    const app = record(record(expected.services)[names[role]]);
    app.image = role === 'api' ? apiImage : webImage;
    app.pull_policy = 'always';
    assert.deepEqual(Bun.YAML.parse(f.state.raw[role]), expected);
  }
});

for (const mode of ['nonzero', 'old', 'timeout', 'cancelled', 'lost-patch-response'] as const) {
  test(`Migrate ${mode} bloquea API y web y restaura el perfil manual`, async () => {
    const f = fixture();
    const controller = new AbortController();
    if (mode === 'nonzero') f.state.jobCode = 7;
    if (mode === 'old') f.state.oldMarker = true;
    if (mode === 'timeout' || mode === 'cancelled') f.state.jobCode = null;
    if (mode === 'cancelled') f.state.cancel = () => controller.abort();
    if (mode === 'lost-patch-response') f.state.failPatchResponse = true;
    await assert.rejects(
      deployCoolifyServices(f.config, { ...f.runtime, signal: controller.signal }, timeouts),
      (error: Error) => !/private|PASSWORD/.test(error.message),
    );
    assert.ok(!f.state.requests.some((r) => /^(stop|patch|start):(api|web)$/.test(r)));
    assertRestored(f);
    assert.equal(
      f.state.requests.filter((r) => r === 'start:migrate').length,
      mode === 'lost-patch-response' ? 0 : 1,
    );
  });
}

test('un SHA público viejo falla aunque API y web figuren healthy', async () => {
  const f = fixture();
  f.state.healthSha = 'd'.repeat(40);
  await assert.rejects(
    deployCoolifyServices(f.config, f.runtime, timeouts),
    /Timed out waiting for public probe/,
  );
  assert.ok(!f.state.requests.includes('probe:/'));
  assertRestored(f);
});

test('un Compose web inválido falla antes de mutar Migrate', async () => {
  const f = fixture();
  f.state.raw.web = 'invalid';
  await assert.rejects(deployCoolifyServices(f.config, f.runtime, timeouts));
  assert.ok(f.state.requests.every((r) => r.startsWith('get:')));
});

for (const [field, variable] of [
  ['healthUrl', 'COOLIFY_HEALTH_URL'],
  ['webUrl', 'COOLIFY_WEB_URL'],
] as const) {
  test(`${variable} rechaza HTTP incluso con config directa, antes de cualquier request`, async () => {
    assert.throws(
      () => readDeploymentConfig({ ...environment(), [variable]: 'http://site.test' }),
      /Invalid URL/,
    );
    const f = fixture();
    f.config[field] = 'http://site.test';
    await assert.rejects(deployCoolifyServices(f.config, f.runtime, timeouts), /Invalid URL/);
    assert.equal(f.state.requests.length, 0);
  });
}

test('config incompleta de producción y UUID compartidos fallan localmente', () => {
  const env = environment();
  env.COOLIFY_DEPLOY_TARGET = 'production';
  env.COOLIFY_WEB_IMAGE = webImage.replace('-stage@', '-production@');
  delete env.COOLIFY_WEB_SERVICE_UUID;
  assert.throws(() => readDeploymentConfig(env), /COOLIFY_WEB_SERVICE_UUID/);
  const duplicate = environment();
  duplicate.COOLIFY_WEB_SERVICE_UUID = duplicate.COOLIFY_API_SERVICE_UUID;
  assert.throws(() => readDeploymentConfig(duplicate), /different Service UUID/);
  assert.throws(
    () =>
      readDeploymentConfig({
        ...environment(),
        COOLIFY_WEB_IMAGE: webImage.replace('-stage@', '-production@'),
      }),
    /expected SHA, target/,
  );
});

test('workflow conserva gates y despliega las referencias escaneadas con digest', () => {
  const yaml = readFileSync('.github/workflows/publish-images.yml', 'utf8');
  const workflow = record(Bun.YAML.parse(yaml));
  const jobs = record(workflow.jobs);
  assert.deepEqual(record(record(workflow.on).push).branches, ['main']);
  assert.deepEqual(record(record(workflow.on).release).types, ['published']);
  assert.ok(
    (record(record(workflow.on).push).paths as string[]).includes('scripts/lib/coolify-service.ts'),
  );
  assert.ok(!yaml.includes('DOKPLOY'));
  for (const name of ['backend', 'frontend'])
    assert.equal(
      record(record(jobs[name]).outputs).image,
      `\${{ steps.meta.outputs.image_ref }}@\${{ steps.push.outputs.digest }}`,
    );
  for (const target of ['stage', 'production']) {
    const job = record(jobs[`deploy-${target}`]);
    assert.deepEqual(job.needs, ['resolve', 'backend', 'frontend', 'scan', 'ci-gate']);
    assert.ok(String(job.if).includes("needs.scan.result == 'success'"));
    assert.ok(String(job.if).includes("needs.ci-gate.result == 'success'"));
    assert.ok(!record(job.env).COOLIFY_MIGRATE_IMAGE);
    assert.equal(record(job.env).COOLIFY_API_IMAGE, `\${{ needs.backend.outputs.image }}`);
    const checkout = record((job.steps as Record<string, unknown>[])[0]);
    assert.equal(record(checkout.with).ref, `\${{ github.workflow_sha }}`);
    assert.equal(record(job.env).COOLIFY_URL, `\${{ vars.COOLIFY_URL }}`);
  }
  assert.ok(!String(record(workflow.concurrency).group).includes('github.ref'));
});
