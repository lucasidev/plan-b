#!/usr/bin/env bun

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type DeployTarget = 'stage' | 'production';
type ApplicationRole = 'migrate' | 'api' | 'web';
type ApplicationStatus = 'idle' | 'running' | 'done' | 'error';
type DeploymentStatus = 'idle' | 'running' | 'done' | 'error';

interface DokployDeployment {
  deploymentId: string;
  status: DeploymentStatus;
}

export interface DeploymentConfig {
  dokployUrl: string;
  apiKey: string;
  target: DeployTarget;
  migrateApplicationId: string;
  apiApplicationId: string;
  webApplicationId: string;
  migrateImage: string;
  apiImage: string;
  webImage: string;
  healthUrl: string;
  expectedSha: string;
}

export interface DeploymentRuntime {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  sleep: (milliseconds: number) => Promise<void>;
  now: () => number;
  log: (message: string) => void;
}

export interface DeploymentTimeouts {
  applicationMs: number;
  healthMs: number;
  pollMs: number;
  requestMs: number;
}

const DEFAULT_TIMEOUTS: DeploymentTimeouts = {
  applicationMs: 10 * 60 * 1000,
  healthMs: 5 * 60 * 1000,
  pollMs: 5 * 1000,
  requestMs: 15 * 1000,
};

// Swarm etiqueta cada task con el nombre de su service; en Dokploy ese nombre es el appName.
const SWARM_SERVICE_LABEL = 'com.docker.swarm.service.name';

interface DokployContainer {
  containerId: string;
  name: string;
}

interface MigrateTask {
  image: string;
  serviceName: string | null;
  status: string;
  exitCode: number;
  finishedAtMs: number;
}

const DEFAULT_RUNTIME: DeploymentRuntime = {
  fetch: (url, init) => fetch(url, init),
  sleep: (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  now: () => Date.now(),
  log: (message) => console.log(message),
};

export class DeploymentError extends Error {}

function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new DeploymentError(`Missing required environment variable: ${name}.`);
  }

  return value;
}

function parseUrl(value: string, name: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new DeploymentError(`Environment variable ${name} must be a valid URL.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DeploymentError(`Environment variable ${name} must use HTTP or HTTPS.`);
  }

  return value.replace(/\/+$/, '');
}

function assertImages(config: DeploymentConfig): void {
  if (!/^[0-9a-f]{40}$/.test(config.expectedSha)) {
    throw new DeploymentError('DOKPLOY_EXPECTED_SHA must be a full lowercase Git SHA.');
  }

  if (config.migrateImage !== config.apiImage) {
    throw new DeploymentError('Migrate and API applications must use the same image.');
  }

  if (!config.apiImage.endsWith(`:${config.expectedSha}`)) {
    throw new DeploymentError('API image does not match DOKPLOY_EXPECTED_SHA.');
  }

  if (!config.webImage.endsWith(`:${config.expectedSha}-${config.target}`)) {
    throw new DeploymentError('Web image does not match DOKPLOY_EXPECTED_SHA and target.');
  }
}

export function readDeploymentConfig(env: NodeJS.ProcessEnv): DeploymentConfig {
  const target = requireEnv(env, 'DOKPLOY_DEPLOY_TARGET');
  if (target !== 'stage' && target !== 'production') {
    throw new DeploymentError('DOKPLOY_DEPLOY_TARGET must be stage or production.');
  }

  const config: DeploymentConfig = {
    dokployUrl: parseUrl(requireEnv(env, 'DOKPLOY_URL'), 'DOKPLOY_URL'),
    apiKey: requireEnv(env, 'DOKPLOY_API_KEY'),
    target,
    migrateApplicationId: requireEnv(env, 'DOKPLOY_MIGRATE_APPLICATION_ID'),
    apiApplicationId: requireEnv(env, 'DOKPLOY_API_APPLICATION_ID'),
    webApplicationId: requireEnv(env, 'DOKPLOY_WEB_APPLICATION_ID'),
    migrateImage: requireEnv(env, 'DOKPLOY_MIGRATE_IMAGE'),
    apiImage: requireEnv(env, 'DOKPLOY_API_IMAGE'),
    webImage: requireEnv(env, 'DOKPLOY_WEB_IMAGE'),
    healthUrl: parseUrl(requireEnv(env, 'DOKPLOY_HEALTH_URL'), 'DOKPLOY_HEALTH_URL'),
    expectedSha: requireEnv(env, 'DOKPLOY_EXPECTED_SHA'),
  };

  assertImages(config);
  return config;
}

function applicationId(config: DeploymentConfig, role: ApplicationRole): string {
  if (role === 'migrate') return config.migrateApplicationId;
  if (role === 'api') return config.apiApplicationId;
  return config.webApplicationId;
}

function applicationImage(config: DeploymentConfig, role: ApplicationRole): string {
  if (role === 'migrate') return config.migrateImage;
  if (role === 'api') return config.apiImage;
  return config.webImage;
}

async function dokployRequest(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = `${config.dokployUrl}${path}`;

  let response: Response;
  try {
    response = await runtime.fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        ...init.headers,
      },
      signal: AbortSignal.timeout(timeouts.requestMs),
    });
  } catch {
    throw new DeploymentError(`Dokploy request failed: ${init.method ?? 'GET'} ${path}.`);
  }

  if (!response.ok) {
    throw new DeploymentError(
      `Dokploy request failed: ${init.method ?? 'GET'} ${path}, HTTP ${response.status}.`,
    );
  }

  return response;
}

async function updateApplication(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<void> {
  // Swarm rechaza UpdateConfig en los jobs y Dokploy 0.26.3 lo manda siempre, así que Migrate
  // corre como service Replicated de una réplica que no se reinicia: una ejecución por deploy.
  const jobSettings =
    role === 'migrate'
      ? {
          modeSwarm: null,
          replicas: 1,
          restartPolicySwarm: { Condition: 'none' },
        }
      : {};

  await dokployRequest(config, runtime, timeouts, '/api/application.update', {
    method: 'POST',
    body: JSON.stringify({
      applicationId: applicationId(config, role),
      dockerImage: applicationImage(config, role),
      ...jobSettings,
    }),
  });
}

async function deployApplication(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<void> {
  await dokployRequest(config, runtime, timeouts, '/api/application.deploy', {
    method: 'POST',
    body: JSON.stringify({ applicationId: applicationId(config, role) }),
  });
}

function readDeployments(payload: unknown): DokployDeployment[] {
  if (!Array.isArray(payload)) {
    throw new DeploymentError('Dokploy returned an invalid deployment list.');
  }

  return payload.map((deployment) => {
    if (
      typeof deployment !== 'object' ||
      deployment === null ||
      !('deploymentId' in deployment) ||
      typeof deployment.deploymentId !== 'string' ||
      !('status' in deployment)
    ) {
      throw new DeploymentError('Dokploy returned an invalid deployment.');
    }

    const status = deployment.status;
    if (status !== 'idle' && status !== 'running' && status !== 'done' && status !== 'error') {
      throw new DeploymentError('Dokploy returned an unknown deployment status.');
    }

    return { deploymentId: deployment.deploymentId, status };
  });
}

async function listDeployments(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<DokployDeployment[]> {
  const query = new URLSearchParams({ applicationId: applicationId(config, role) });
  const response = await dokployRequest(
    config,
    runtime,
    timeouts,
    `/api/deployment.all?${query.toString()}`,
    { method: 'GET' },
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DeploymentError('Dokploy returned invalid JSON for deployments.');
  }

  return readDeployments(payload);
}

async function waitForNewDeployment(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
  previousDeploymentIds: ReadonlySet<string>,
): Promise<void> {
  const deadline = runtime.now() + timeouts.applicationMs;

  while (runtime.now() <= deadline) {
    const deployments = await listDeployments(config, runtime, timeouts, role);
    const deployment = deployments.find(
      ({ deploymentId }) => !previousDeploymentIds.has(deploymentId),
    );

    if (deployment) {
      runtime.log(`Dokploy ${role}: ${deployment.status}.`);
      if (deployment.status === 'done') return;
      if (deployment.status === 'error') {
        throw new DeploymentError(`Dokploy ${role} deployment failed.`);
      }
    }

    await runtime.sleep(timeouts.pollMs);
  }

  throw new DeploymentError(`Timed out waiting for Dokploy ${role} deployment.`);
}

function readContainers(payload: unknown): DokployContainer[] {
  if (!Array.isArray(payload)) {
    throw new DeploymentError('Dokploy returned an invalid container list.');
  }

  return payload.map((container) => {
    if (
      typeof container !== 'object' ||
      container === null ||
      !('containerId' in container) ||
      typeof container.containerId !== 'string' ||
      !('name' in container) ||
      typeof container.name !== 'string'
    ) {
      throw new DeploymentError('Dokploy returned an invalid container.');
    }

    return { containerId: container.containerId, name: container.name };
  });
}

async function listContainers(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  appName: string,
): Promise<DokployContainer[]> {
  const query = new URLSearchParams({ appName });
  const response = await dokployRequest(
    config,
    runtime,
    timeouts,
    `/api/docker.getContainersByAppNameMatch?${query.toString()}`,
    { method: 'GET' },
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DeploymentError('Dokploy returned invalid JSON for containers.');
  }

  return readContainers(payload);
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

// docker inspect tal como lo devuelve docker.getConfig; null cuando el contenedor ya no existe.
function readMigrateTask(payload: unknown): MigrateTask | null {
  if (payload === null) return null;

  const inspection = readRecord(payload);
  const containerConfig = readRecord(inspection?.Config);
  const state = readRecord(inspection?.State);
  const labels = readRecord(containerConfig?.Labels) ?? {};
  const serviceName = labels[SWARM_SERVICE_LABEL];

  if (
    containerConfig === null ||
    state === null ||
    typeof containerConfig.Image !== 'string' ||
    typeof state.Status !== 'string' ||
    typeof state.ExitCode !== 'number' ||
    typeof state.FinishedAt !== 'string'
  ) {
    throw new DeploymentError('Dokploy returned an invalid container inspection.');
  }

  return {
    image: containerConfig.Image,
    serviceName: typeof serviceName === 'string' ? serviceName : null,
    status: state.Status,
    exitCode: state.ExitCode,
    finishedAtMs: Date.parse(state.FinishedAt),
  };
}

async function inspectContainer(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  containerId: string,
): Promise<MigrateTask | null> {
  const query = new URLSearchParams({ containerId });
  const response = await dokployRequest(
    config,
    runtime,
    timeouts,
    `/api/docker.getConfig?${query.toString()}`,
    { method: 'GET' },
  );

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DeploymentError('Dokploy returned invalid JSON for a container inspection.');
  }

  return readMigrateTask(payload);
}

// Swarm pinea la imagen del service por digest: la task corre `imagen:tag@sha256:...`.
function runsImage(task: MigrateTask, image: string): boolean {
  return task.image === image || task.image.startsWith(`${image}@`);
}

async function waitForMigrateTask(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  appName: string,
  previousContainerIds: ReadonlySet<string>,
  startedAtMs: number,
): Promise<void> {
  const deadline = runtime.now() + timeouts.applicationMs;

  while (runtime.now() <= deadline) {
    const containers = await listContainers(config, runtime, timeouts, appName);

    for (const container of containers) {
      if (previousContainerIds.has(container.containerId)) continue;

      const task = await inspectContainer(config, runtime, timeouts, container.containerId);
      if (task === null) continue;

      if (task.serviceName !== appName) {
        runtime.log(`Se ignora ${container.name}: no es una task de ${appName}.`);
        continue;
      }

      if (!runsImage(task, config.migrateImage)) {
        runtime.log(`Se ignora ${container.name}: corre ${task.image}.`);
        continue;
      }

      if (task.status === 'exited') {
        if (task.exitCode !== 0) {
          throw new DeploymentError(`Migrate task exited with code ${task.exitCode}.`);
        }

        if (!Number.isFinite(task.finishedAtMs)) {
          throw new DeploymentError('Dokploy returned a Migrate task without a valid FinishedAt.');
        }

        if (task.finishedAtMs < startedAtMs) {
          runtime.log(`Se ignora ${container.name}: terminó antes de este deploy.`);
          continue;
        }

        runtime.log(`Migrate terminó correctamente (${container.name}).`);
        return;
      }

      if (task.status === 'dead') {
        throw new DeploymentError(`Migrate task ${container.name} is dead.`);
      }

      runtime.log(`Migrate task ${container.name}: ${task.status}.`);
    }

    await runtime.sleep(timeouts.pollMs);
  }

  throw new DeploymentError('Timed out waiting for the Migrate task to exit successfully.');
}

function readApplicationStatus(payload: unknown): ApplicationStatus {
  if (typeof payload !== 'object' || payload === null || !('applicationStatus' in payload)) {
    throw new DeploymentError('Dokploy returned an application without applicationStatus.');
  }

  const status = payload.applicationStatus;
  if (status !== 'idle' && status !== 'running' && status !== 'done' && status !== 'error') {
    throw new DeploymentError('Dokploy returned an unknown applicationStatus.');
  }

  return status;
}

function readApplicationAppName(payload: unknown): string {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('appName' in payload) ||
    typeof payload.appName !== 'string' ||
    payload.appName === ''
  ) {
    throw new DeploymentError('Dokploy returned an application without appName.');
  }

  return payload.appName;
}

async function fetchApplication(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<unknown> {
  const query = new URLSearchParams({ applicationId: applicationId(config, role) });
  const response = await dokployRequest(
    config,
    runtime,
    timeouts,
    `/api/application.one?${query.toString()}`,
    { method: 'GET' },
  );

  try {
    return await response.json();
  } catch {
    throw new DeploymentError('Dokploy returned invalid JSON for the application.');
  }
}

async function getApplicationStatus(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<ApplicationStatus> {
  return readApplicationStatus(await fetchApplication(config, runtime, timeouts, role));
}

async function waitForApplication(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
  role: ApplicationRole,
): Promise<void> {
  const deadline = runtime.now() + timeouts.applicationMs;

  while (runtime.now() <= deadline) {
    const status = await getApplicationStatus(config, runtime, timeouts, role);
    runtime.log(`Dokploy ${role}: ${status}.`);

    if (status === 'done') return;
    if (status === 'error') {
      throw new DeploymentError(`Dokploy ${role} deployment failed.`);
    }

    await runtime.sleep(timeouts.pollMs);
  }

  throw new DeploymentError(`Timed out waiting for Dokploy ${role} deployment.`);
}

async function healthMatches(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
): Promise<boolean> {
  let response: Response;
  try {
    response = await runtime.fetch(config.healthUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeouts.requestMs),
    });
  } catch {
    return false;
  }

  if (!response.ok) return false;

  try {
    const payload: unknown = await response.json();
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'version' in payload &&
      payload.version === config.expectedSha
    );
  } catch {
    return false;
  }
}

async function waitForHealth(
  config: DeploymentConfig,
  runtime: DeploymentRuntime,
  timeouts: DeploymentTimeouts,
): Promise<void> {
  const deadline = runtime.now() + timeouts.healthMs;

  while (runtime.now() <= deadline) {
    if (await healthMatches(config, runtime, timeouts)) {
      runtime.log(`Health publica ${config.expectedSha}.`);
      return;
    }

    runtime.log(`Health todavía no publica ${config.expectedSha}.`);
    await runtime.sleep(timeouts.pollMs);
  }

  throw new DeploymentError('Timed out waiting for health to publish the expected SHA.');
}

export async function deployDokployApplications(
  config: DeploymentConfig,
  runtime: DeploymentRuntime = DEFAULT_RUNTIME,
  timeouts: DeploymentTimeouts = DEFAULT_TIMEOUTS,
): Promise<void> {
  // Migrate y API quedan fijadas a la misma imagen antes de ejecutar cualquier cambio.
  await updateApplication(config, runtime, timeouts, 'migrate');
  await updateApplication(config, runtime, timeouts, 'api');

  // Los snapshots de deployments y de contenedores se toman antes de deployApplication para
  // distinguir lo que dispara este método de lo que ya estaba. done en application.one no prueba
  // que la migración terminó: lo prueba la task nueva del job saliendo con código 0.
  const migrateAppName = readApplicationAppName(
    await fetchApplication(config, runtime, timeouts, 'migrate'),
  );
  const migrateStartedAtMs = runtime.now();
  const previousMigrateDeployments = await listDeployments(config, runtime, timeouts, 'migrate');
  const previousMigrateDeploymentIds = new Set(
    previousMigrateDeployments.map((deployment) => deployment.deploymentId),
  );
  const previousMigrateContainers = await listContainers(config, runtime, timeouts, migrateAppName);
  const previousMigrateContainerIds = new Set(
    previousMigrateContainers.map((container) => container.containerId),
  );

  await deployApplication(config, runtime, timeouts, 'migrate');
  await waitForNewDeployment(config, runtime, timeouts, 'migrate', previousMigrateDeploymentIds);
  await waitForMigrateTask(
    config,
    runtime,
    timeouts,
    migrateAppName,
    previousMigrateContainerIds,
    migrateStartedAtMs,
  );

  await deployApplication(config, runtime, timeouts, 'api');
  await waitForApplication(config, runtime, timeouts, 'api');
  await waitForHealth(config, runtime, timeouts);

  // El web cambia recién cuando la API nueva ya responde con el SHA esperado.
  await updateApplication(config, runtime, timeouts, 'web');
  await deployApplication(config, runtime, timeouts, 'web');
  await waitForApplication(config, runtime, timeouts, 'web');
  await waitForHealth(config, runtime, timeouts);
}

export async function main(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const config = readDeploymentConfig(env);
  await deployDokployApplications(config);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  main().catch((error: unknown) => {
    const message =
      error instanceof DeploymentError ? error.message : 'Unexpected Dokploy deployment failure.';
    console.error(`deploy-dokploy-applications: ${message}`);
    process.exitCode = 1;
  });
}
