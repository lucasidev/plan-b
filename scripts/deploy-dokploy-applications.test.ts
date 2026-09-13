import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type DeploymentRuntime,
  type DeploymentTimeouts,
  deployDokployApplications,
  readDeploymentConfig,
} from './deploy-dokploy-applications.ts';

const SHA = 'a'.repeat(40);
const MIGRATE_IMAGE = `ghcr.io/example/planb/planb-api:${SHA}`;
const MIGRATE_APP_NAME = 'planb-stage-migrate-abc123';
// Epoch fijo del deploy: los timestamps de docker inspect se comparan contra este instante.
const DEPLOY_STARTED_AT = Date.parse('2026-09-12T20:00:00.000Z');

function validEnv(): NodeJS.ProcessEnv {
  return {
    DOKPLOY_URL: 'https://dokploy.example.test',
    DOKPLOY_API_KEY: 'secret-key',
    DOKPLOY_DEPLOY_TARGET: 'stage',
    DOKPLOY_MIGRATE_APPLICATION_ID: 'migrate-id',
    DOKPLOY_API_APPLICATION_ID: 'api-id',
    DOKPLOY_WEB_APPLICATION_ID: 'web-id',
    DOKPLOY_MIGRATE_IMAGE: MIGRATE_IMAGE,
    DOKPLOY_API_IMAGE: MIGRATE_IMAGE,
    DOKPLOY_WEB_IMAGE: `ghcr.io/example/planb-web:${SHA}-stage`,
    DOKPLOY_HEALTH_URL: 'https://planb.example.test/health',
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
  State: { Status: string; ExitCode: number; StartedAt: string; FinishedAt: string };
}

interface FakeDokployOptions {
  deploymentsAfterDeploy?: { deploymentId: string; status: string }[];
  containersAfterDeploy?: FakeContainer[];
  inspections?: Record<string, FakeInspection | null>;
  healthVersion?: string;
  advanceClock?: boolean;
}

const OLD_TASK: FakeContainer = {
  containerId: 'old-task',
  name: `${MIGRATE_APP_NAME}.1.oldtask`,
  state: 'exited',
};

const NEW_TASK: FakeContainer = {
  containerId: 'new-task',
  name: `${MIGRATE_APP_NAME}.1.newtask`,
  state: 'exited',
};

// La task nueva del job tal como la devuelve docker inspect: pertenece al service de Migrate,
// corre la imagen del SHA (Swarm la pinea por digest) y terminó con 0 después del deploy.
function inspection(overrides: Partial<FakeInspection> = {}): FakeInspection {
  return {
    Id: 'new-task',
    Name: `/${MIGRATE_APP_NAME}.1.newtask`,
    Created: '2026-09-12T20:00:05.000Z',
    Config: {
      Image: `${MIGRATE_IMAGE}@sha256:${'c'.repeat(64)}`,
      Labels: {
        'com.docker.swarm.service.name': MIGRATE_APP_NAME,
        'com.docker.swarm.task.id': 'newtask',
      },
    },
    State: {
      Status: 'exited',
      ExitCode: 0,
      StartedAt: '2026-09-12T20:00:06.000Z',
      FinishedAt: '2026-09-12T20:00:40.000Z',
    },
    ...overrides,
  };
}

// El deployment y la task "previous"/"old" ya estaban ahí antes de este deploy: siguen
// apareciendo en cada respuesta para probar que el snapshot previo no los confunde con lo nuevo.
function fakeDokploy(calls: RecordedCall[], options: FakeDokployOptions = {}): DeploymentRuntime {
  let deploymentAllCalls = 0;
  let containerListCalls = 0;
  let now = DEPLOY_STARTED_AT;
  const inspections = options.inspections ?? { 'new-task': inspection() };

  return {
    fetch: async (rawUrl, init) => {
      const url = new URL(rawUrl);
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ path: `${url.pathname}${url.search}`, method, body });

      if (url.pathname === '/api/application.one') {
        return Response.json({ applicationStatus: 'done', appName: MIGRATE_APP_NAME });
      }

      if (url.pathname === '/api/deployment.all') {
        deploymentAllCalls += 1;
        const previous = { deploymentId: 'previous-deployment', status: 'done' };
        const added = options.deploymentsAfterDeploy ?? [
          { deploymentId: 'new-deployment', status: 'done' },
        ];
        return Response.json(deploymentAllCalls === 1 ? [previous] : [previous, ...added]);
      }

      if (url.pathname === '/api/docker.getContainersByAppNameMatch') {
        containerListCalls += 1;
        const after = options.containersAfterDeploy ?? [OLD_TASK, NEW_TASK];
        return Response.json(containerListCalls === 1 ? [OLD_TASK] : after);
      }

      if (url.pathname === '/api/docker.getConfig') {
        const containerId = url.searchParams.get('containerId') ?? '';
        return Response.json(inspections[containerId] ?? null);
      }

      if (url.pathname === '/health') {
        return Response.json({ version: options.healthVersion ?? SHA });
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
  delete env.DOKPLOY_API_KEY;

  assert.throws(
    () => readDeploymentConfig(env),
    /Missing required environment variable: DOKPLOY_API_KEY/,
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

  assert.deepEqual(calls, [
    {
      path: '/api/application.update',
      method: 'POST',
      body: {
        applicationId: 'migrate-id',
        dockerImage: config.migrateImage,
        modeSwarm: null,
        replicas: 1,
        restartPolicySwarm: { Condition: 'none' },
      },
    },
    {
      path: '/api/application.update',
      method: 'POST',
      body: { applicationId: 'api-id', dockerImage: config.apiImage },
    },
    {
      path: '/api/application.one?applicationId=migrate-id',
      method: 'GET',
      body: undefined,
    },
    {
      path: '/api/deployment.all?applicationId=migrate-id',
      method: 'GET',
      body: undefined,
    },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${MIGRATE_APP_NAME}`,
      method: 'GET',
      body: undefined,
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: 'migrate-id' },
    },
    {
      path: '/api/deployment.all?applicationId=migrate-id',
      method: 'GET',
      body: undefined,
    },
    {
      path: `/api/docker.getContainersByAppNameMatch?appName=${MIGRATE_APP_NAME}`,
      method: 'GET',
      body: undefined,
    },
    {
      path: '/api/docker.getConfig?containerId=new-task',
      method: 'GET',
      body: undefined,
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: 'api-id' },
    },
    {
      path: '/api/application.one?applicationId=api-id',
      method: 'GET',
      body: undefined,
    },
    { path: '/health', method: 'GET', body: undefined },
    {
      path: '/api/application.update',
      method: 'POST',
      body: { applicationId: 'web-id', dockerImage: config.webImage },
    },
    {
      path: '/api/application.deploy',
      method: 'POST',
      body: { applicationId: 'web-id' },
    },
    {
      path: '/api/application.one?applicationId=web-id',
      method: 'GET',
      body: undefined,
    },
    { path: '/health', method: 'GET', body: undefined },
  ]);
});

test('does not deploy API when the new migrate task exits with a non-zero code', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    inspections: {
      'new-task': inspection({
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
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('does not deploy API while the new migrate task is still running', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    inspections: {
      'new-task': inspection({
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
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('does not accept a migrate task that finished before this deploy started', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    inspections: {
      'new-task': inspection({
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
  assert.equal(
    calls.some((call) => call.path === '/api/docker.getConfig?containerId=new-task'),
    true,
  );
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('does not accept a task of another service or another image as the migrate task', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    advanceClock: true,
    containersAfterDeploy: [
      OLD_TASK,
      { containerId: 'foreign-task', name: 'planb-stage-api-abc123.1.x', state: 'exited' },
      { containerId: 'stale-image-task', name: `${MIGRATE_APP_NAME}.1.y`, state: 'exited' },
    ],
    inspections: {
      'foreign-task': inspection({
        Id: 'foreign-task',
        Config: {
          Image: `${MIGRATE_IMAGE}@sha256:${'c'.repeat(64)}`,
          Labels: { 'com.docker.swarm.service.name': 'planb-stage-api-abc123' },
        },
      }),
      'stale-image-task': inspection({
        Id: 'stale-image-task',
        Config: {
          Image: `ghcr.io/example/planb/planb-api:${'b'.repeat(40)}@sha256:${'d'.repeat(64)}`,
          Labels: { 'com.docker.swarm.service.name': MIGRATE_APP_NAME },
        },
      }),
    },
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for the Migrate task/,
  );
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('does not accept a stale migrate deployment already in done as the new one', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, { advanceClock: true, deploymentsAfterDeploy: [] });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Timed out waiting for Dokploy migrate deployment/,
  );
  assert.equal(
    calls.some((call) => call.path.startsWith('/api/docker.getConfig')),
    false,
  );
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('stops immediately when Dokploy reports an error', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, {
    deploymentsAfterDeploy: [{ deploymentId: 'new-deployment', status: 'error' }],
  });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, TEST_TIMEOUTS),
    /Dokploy migrate deployment failed/,
  );
  assert.equal(
    calls.some((call) => call.path.startsWith('/api/docker.getConfig')),
    false,
  );
  assert.equal(deployedApplication(calls, 'api-id'), false);
});

test('does not deploy web when health never reaches the expected SHA', async () => {
  const calls: RecordedCall[] = [];
  const runtime = fakeDokploy(calls, { advanceClock: true, healthVersion: 'b'.repeat(40) });

  await assert.rejects(
    deployDokployApplications(readDeploymentConfig(validEnv()), runtime, {
      ...TEST_TIMEOUTS,
      healthMs: 2,
    }),
    /Timed out waiting for health to publish the expected SHA/,
  );
  assert.equal(deployedApplication(calls, 'web-id'), false);
});
