import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type DeploymentRuntime,
  type DeploymentTimeouts,
  deployDokployApplications,
  readDeploymentConfig,
} from './deploy-dokploy-applications.ts';

const SHA = 'a'.repeat(40);
const API_IMAGE = `ghcr.io/example/planb/planb-api:${SHA}`;
const WEB_IMAGE = `ghcr.io/example/planb/planb-web:${SHA}-stage`;
const APP = {
  migrate: { id: 'migrate-id', name: 'planb-stage-migrate-abc123', image: API_IMAGE },
  api: { id: 'api-id', name: 'planb-stage-api-def456', image: API_IMAGE },
  web: { id: 'web-id', name: 'planb-stage-web-ghi789', image: WEB_IMAGE },
} as const;
type Role = keyof typeof APP;

// Epoch fijo del deploy: los timestamps de docker inspect se comparan contra este instante.
const DEPLOY_STARTED_AT = Date.parse('2026-09-12T20:00:00.000Z');

function validEnv(): NodeJS.ProcessEnv {
  return {
    DOKPLOY_URL: 'https://dokploy.example.test',
    DOKPLOY_API_KEY: 'secret-key',
    DOKPLOY_DEPLOY_TARGET: 'stage',
    DOKPLOY_MIGRATE_APPLICATION_ID: APP.migrate.id,
    DOKPLOY_API_APPLICATION_ID: APP.api.id,
    DOKPLOY_WEB_APPLICATION_ID: APP.web.id,
    DOKPLOY_MIGRATE_IMAGE: API_IMAGE,
    DOKPLOY_API_IMAGE: API_IMAGE,
    DOKPLOY_WEB_IMAGE: WEB_IMAGE,
    DOKPLOY_HEALTH_URL: 'https://planb.example.test/health',
    DOKPLOY_WEB_URL: 'https://planb.example.test',
    DOKPLOY_EXPECTED_SHA: SHA,
  };
}

const TEST_TIMEOUTS: DeploymentTimeouts = {
  applicationMs: 10,
  healthMs: 10,
  pollMs: 1,
  requestMs: 10,
};

interface RecordedCall {
  path: string;
  method: string;
  body?: unknown;
}

interface FakeContainer {
  containerId: string;
  name: string;
  state: string;
}

interface FakeInspection {
  Id: string;
  Name: string;
  Created: string;
  Config: { Image: string; Labels: Record<string, string> };
  State: {
    Status: string;
    ExitCode: number;
    StartedAt: string;
    FinishedAt: string;
    Health?: { Status: string };
  };
}

interface FakeDeployment {
  deploymentId: string;
  status: string | null;
}

interface FakeDokployOptions {
  deploymentsBefore?: Partial<Record<Role, FakeDeployment[]>>;
  deploymentsAfterDeploy?: Partial<Record<Role, FakeDeployment[]>>;
  containersAfterDeploy?: Partial<Record<Role, FakeContainer[]>>;
  inspections?: Record<string, FakeInspection | null>;
  healthVersion?: string;
  webStatus?: number;
  advanceClock?: boolean;
}

function oldContainer(role: Role): FakeContainer {
  return {
    containerId: `${role}-old-task`,
    name: `${APP[role].name}.1.oldtask`,
    state: role === 'migrate' ? 'exited' : 'running',
  };
}

function newContainer(role: Role): FakeContainer {
  return {
    containerId: `${role}-new-task`,
    name: `${APP[role].name}.1.newtask`,
    state: role === 'migrate' ? 'exited' : 'running',
  };
}

function inspection(role: Role, overrides: Partial<FakeInspection> = {}): FakeInspection {
  const isMigrate = role === 'migrate';
  return {
    Id: `${role}-new-task`,
    Name: `/${APP[role].name}.1.newtask`,
    Created: '2026-09-12T20:00:05.000Z',
    Config: {
      Image: `${APP[role].image}@sha256:${'c'.repeat(64)}`,
      Labels: {
        'com.docker.swarm.service.name': APP[role].name,
        'com.docker.swarm.task.id': `${role}-new-task`,
      },
    },
    State: {
      Status: isMigrate ? 'exited' : 'running',
      ExitCode: 0,
      StartedAt: '2026-09-12T20:00:06.000Z',
      FinishedAt: isMigrate ? '2026-09-12T20:00:40.000Z' : '0001-01-01T00:00:00Z',
      ...(isMigrate ? {} : { Health: { Status: 'healthy' } }),
    },
    ...overrides,
  };
}

function roleForApplicationId(applicationId: string): Role {
  const entry = Object.entries(APP).find(([, app]) => app.id === applicationId);
  if (!entry) throw new Error(`Unknown fake application id: ${applicationId}`);
  return entry[0] as Role;
}

function roleForAppName(appName: string): Role {
  const entry = Object.entries(APP).find(([, app]) => app.name === appName);
  if (!entry) throw new Error(`Unknown fake appName: ${appName}`);
  return entry[0] as Role;
}

// Cada Application conserva una ejecución anterior. deployApplication solo encola el trabajo, así
// que el fake distingue explícitamente el snapshot previo de la ejecución nueva.
function fakeDokploy(calls: RecordedCall[], options: FakeDokployOptions = {}): DeploymentRuntime {
  let now = DEPLOY_STARTED_AT;
  const deployed = new Set<Role>();
  const inspections = options.inspections ?? {
    'migrate-new-task': inspection('migrate'),
    'api-new-task': inspection('api'),
    'web-new-task': inspection('web'),
  };

  return {
    fetch: async (rawUrl, init) => {
      const url = new URL(rawUrl);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path: `${url.pathname}${url.search}`, method, body });

      if (url.pathname === '/api/application.one') {
        const role = roleForApplicationId(url.searchParams.get('applicationId') ?? '');
        return Response.json({ applicationStatus: 'done', appName: APP[role].name });
      }

      if (url.pathname === '/api/application.deploy') {
        const role = roleForApplicationId((body as { applicationId: string }).applicationId);
        deployed.add(role);
        return new Response(null, { status: 200 });
      }

      if (url.pathname === '/api/deployment.all') {
        const role = roleForApplicationId(url.searchParams.get('applicationId') ?? '');
        const before = options.deploymentsBefore?.[role] ?? [
          { deploymentId: `${role}-previous-deployment`, status: 'done' },
        ];
        const after = options.deploymentsAfterDeploy?.[role] ?? [
          { deploymentId: `${role}-new-deployment`, status: 'done' },
        ];
        return Response.json(deployed.has(role) ? [...before, ...after] : before);
      }

      if (url.pathname === '/api/docker.getContainersByAppNameMatch') {
        const role = roleForAppName(url.searchParams.get('appName') ?? '');
        const before = [oldContainer(role)];
        const after = options.containersAfterDeploy?.[role] ?? [
          oldContainer(role),
          newContainer(role),
        ];
        return Response.json(deployed.has(role) ? after : before);
      }

      if (url.pathname === '/api/docker.getConfig') {
        const containerId = url.searchParams.get('containerId') ?? '';
        return Response.json(inspections[containerId] ?? null);
      }

      if (url.pathname === '/health') {
        return Response.json({ version: options.healthVersion ?? SHA });
      }

      if (url.pathname === '/') {
        return new Response('<!doctype html><title>planb</title>', {
          status: options.webStatus ?? 200,
          headers: { 'content-type': 'text/html' },
        });
      }

      return new Response(null, { status: 200 });
    },
    sleep: async (milliseconds) => {
      if (options.advanceClock) now += milliseconds;
    },
    now: () => now,
    log: () => {},
  };
}

function deployedApplication(calls: RecordedCall[], applicationId: string): boolean {
  return calls.some(
    (call) =>
      call.path === '/api/application.deploy' &&
      (call.body as { applicationId?: string }).applicationId === applicationId,
  );
}

test('requires every deployment environment variable', () => {
  const env = validEnv();
  delete env.DOKPLOY_WEB_URL;

  assert.throws(
    () => readDeploymentConfig(env),
    /Missing required environment variable: DOKPLOY_WEB_URL/,
  );
});

test('rejects a web image that is not tagged for the selected target', () => {
  const env = validEnv();
  env.DOKPLOY_WEB_IMAGE = `ghcr.io/example/planb-web:${SHA}-production`;

  assert.throws(
    () => readDeploymentConfig(env),
    /Web image does not match DOKPLOY_EXPECTED_SHA and target/,
  );
});

test('deploys migrate, API and web in the fail-closed order', async () => {
  const calls: RecordedCall[] = [];
  const config = readDeploymentConfig(validEnv());

  await deployDokployApplications(config, fakeDokploy(calls), TEST_TIMEOUTS);

  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    {
      path: '/api/application.update',
      method: 'POST',
      body: {
        applicationId: APP.migrate.id,
        dockerImage: config.migrateImage,
        modeSwarm: null,
        replicas: 1,
        restartPolicySwarm: { Condition: 'none' },
      },
    },
    {
      path: '/api/application.update',
      method: 'POST',
      body: { applicationId: APP.api.id, dockerImage: config.apiImage },
    },
    { path: `/api/application.one?applicationId=${APP.migrate.id}`, method: 'GET' },
    { path: `/api/deployment.all?applicationId=${APP.migrate.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.migrate.name}`,
      method: 'GET',
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: APP.migrate.id },
    },
    { path: `/api/deployment.all?applicationId=${APP.migrate.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.migrate.name}`,
      method: 'GET',
    },
    { path: '/api/docker.getConfig?containerId=migrate-new-task', method: 'GET' },
    { path: `/api/application.one?applicationId=${APP.api.id}`, method: 'GET' },
    { path: `/api/deployment.all?applicationId=${APP.api.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.api.name}`,
      method: 'GET',
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: APP.api.id },
    },
    { path: `/api/deployment.all?applicationId=${APP.api.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.api.name}`,
      method: 'GET',
    },
    { path: '/api/docker.getConfig?containerId=api-new-task', method: 'GET' },
    {
      path: '/api/application.update',
      method: 'POST',
      body: { applicationId: APP.web.id, dockerImage: config.webImage },
    },
    { path: `/api/application.one?applicationId=${APP.web.id}`, method: 'GET' },
    { path: `/api/deployment.all?applicationId=${APP.web.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.web.name}`,
      method: 'GET',
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: APP.web.id },
    },
    { path: `/api/deployment.all?applicationId=${APP.web.id}`, method: 'GET' },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${APP.web.name}`,
      method: 'GET',
    },
    { path: '/api/docker.getConfig?containerId=web-new-task', method: 'GET' },
    { path: '/health', method: 'GET' },
    { path: '/', method: 'GET' },
  ]);
});

test('does not deploy API when the new migrate task exits with a non-zero code', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    inspections: {
      'migrate-new-task': inspection('migrate', {
        State: {
          Status: 'exited',
          ExitCode: 1,
          StartedAt: '2026-09-12T20:00:06.000Z',
          FinishedAt: '2026-09-12T20:00:09.000Z',
        },
      }),
    },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Migrate task exited with code 1/,
  );
  assert.equal(deployedApplication(calls, APP.api.id), false);
});

test('does not deploy API while the new migrate task is still running', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    inspections: {
      'migrate-new-task': inspection('migrate', {
        State: {
          Status: 'running',
          ExitCode: 0,
          StartedAt: '2026-09-12T20:00:06.000Z',
          FinishedAt: '0001-01-01T00:00:00Z',
        },
      }),
    },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for the Migrate task/,
  );
  assert.equal(deployedApplication(calls, APP.api.id), false);
});

test('does not accept a migrate task that finished before this deploy started', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    inspections: {
      'migrate-new-task': inspection('migrate', {
        State: {
          Status: 'exited',
          ExitCode: 0,
          StartedAt: '2026-09-12T19:58:00.000Z',
          FinishedAt: '2026-09-12T19:59:00.000Z',
        },
      }),
    },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for the Migrate task/,
  );
  assert.equal(deployedApplication(calls, APP.api.id), false);
});

test('does not accept a stale deployment already in done as a new API deployment', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    deploymentsAfterDeploy: { api: [] },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for Dokploy api deployment/,
  );
  assert.equal(deployedApplication(calls, APP.web.id), false);
});

test('accepts cancelled historical deployments but fails when the new deployment is cancelled', async () => {
  const historicalCalls: RecordedCall[] = [];
  await deployDokployApplications(
    readDeploymentConfig(validEnv()),
    fakeDokploy(historicalCalls, {
      deploymentsBefore: {
        migrate: [{ deploymentId: 'old-cancelled', status: 'cancelled' }],
      },
    }),
    TEST_TIMEOUTS,
  );

  const currentCalls: RecordedCall[] = [];
  await assert.rejects(
    deployDokployApplications(
      readDeploymentConfig(validEnv()),
      fakeDokploy(currentCalls, {
        deploymentsAfterDeploy: {
          migrate: [{ deploymentId: 'new-cancelled', status: 'cancelled' }],
        },
      }),
      TEST_TIMEOUTS,
    ),
    /Dokploy migrate deployment was cancelled/,
  );
  assert.equal(deployedApplication(currentCalls, APP.api.id), false);
});

test('does not deploy web when the new API task is unhealthy', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    inspections: {
      'migrate-new-task': inspection('migrate'),
      'api-new-task': inspection('api', {
        State: {
          Status: 'running',
          ExitCode: 0,
          StartedAt: '2026-09-12T20:00:06.000Z',
          FinishedAt: '0001-01-01T00:00:00Z',
          Health: { Status: 'unhealthy' },
        },
      }),
    },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Dokploy api task .* is unhealthy/,
  );
  assert.equal(deployedApplication(calls, APP.web.id), false);
});

test('does not accept a stale deployment already in done as a new web deployment', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    deploymentsAfterDeploy: { web: [] },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for Dokploy web deployment/,
  );
  assert.equal(
    calls.some((call) => call.path === '/health'),
    false,
  );
});

test('does not accept a public health response from the previous SHA', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, { advanceClock: true, healthVersion: 'b'.repeat(40) });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, {
      ...TEST_TIMEOUTS,
      healthMs: 2,
    }),
    /Timed out waiting for health to publish the expected SHA/,
  );
  assert.equal(deployedApplication(calls, APP.web.id), true);
  assert.equal(
    calls.some((call) => call.path === '/'),
    false,
  );
});

test('fails when the public web route does not respond after both new tasks are healthy', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, { advanceClock: true, webStatus: 503 });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, {
      ...TEST_TIMEOUTS,
      healthMs: 2,
    }),
    /Timed out waiting for the public web route/,
  );
  assert.equal(
    calls.some((call) => call.path === '/health'),
    true,
  );
});
