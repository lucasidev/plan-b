#!/usr/bin/env bun

import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CoolifyClient,
  DeploymentError,
  type PreparedService,
  parseUrl,
  type Runtime,
  record,
  requireEnv,
  type ServiceSpec,
  stringifyCompose,
  type Timeouts,
} from './lib/coolify-service.ts';

export interface DeploymentConfig {
  url: string;
  token: string;
  target: 'stage' | 'production';
  expectedSha: string;
  healthUrl: string;
  webUrl: string;
  migrate: ServiceSpec;
  api: ServiceSpec;
  web: ServiceSpec;
}

export function readDeploymentConfig(env: NodeJS.ProcessEnv): DeploymentConfig {
  const target = requireEnv(env, 'COOLIFY_DEPLOY_TARGET');
  if (target !== 'stage' && target !== 'production')
    throw new DeploymentError('Invalid deployment target.');
  const expectedSha = requireEnv(env, 'COOLIFY_EXPECTED_SHA');
  if (!/^[a-f0-9]{40}$/.test(expectedSha))
    throw new DeploymentError('Expected a full lowercase Git SHA.');
  const apiImage = requireEnv(env, 'COOLIFY_API_IMAGE');
  const webImage = requireEnv(env, 'COOLIFY_WEB_IMAGE');
  const apiRepo = 'ghcr.io/lucasidev/plan-b/planb-api';
  const webRepo = 'ghcr.io/lucasidev/plan-b/planb-web';
  if (
    !apiImage.startsWith(`${apiRepo}:${expectedSha}@sha256:`) ||
    !webImage.startsWith(`${webRepo}:${expectedSha}-${target}@sha256:`)
  )
    throw new DeploymentError('Image does not match the expected SHA, target and repository.');
  const service = (role: 'migrate' | 'api' | 'web'): ServiceSpec => ({
    uuid: requireEnv(env, `COOLIFY_${role.toUpperCase()}_SERVICE_UUID`),
    name: `planb-${target}-${role}`,
    serviceName: requireEnv(env, `COOLIFY_${role.toUpperCase()}_SERVICE_NAME`),
    image: role === 'web' ? webImage : apiImage,
    allowedImageRepositories: [role === 'web' ? webRepo : apiRepo],
  });
  const config: DeploymentConfig = {
    url: parseUrl(requireEnv(env, 'COOLIFY_URL'), 'COOLIFY_URL'),
    token: requireEnv(env, 'COOLIFY_API_TOKEN'),
    target,
    expectedSha,
    healthUrl: parseUrl(requireEnv(env, 'COOLIFY_HEALTH_URL'), 'COOLIFY_HEALTH_URL'),
    webUrl: parseUrl(requireEnv(env, 'COOLIFY_WEB_URL'), 'COOLIFY_WEB_URL'),
    migrate: service('migrate'),
    api: service('api'),
    web: service('web'),
  };
  if (new Set([config.migrate.uuid, config.api.uuid, config.web.uuid]).size !== 3)
    throw new DeploymentError('Each deployment role requires a different Service UUID.');
  return config;
}

function migrationCompose(
  prepared: PreparedService,
  nonce: string,
): { jobRaw: string; restoredRaw: string } {
  const compose = structuredClone(prepared.compose);
  const app = record(record(compose.services)[prepared.spec.serviceName]);
  const command = ['dotnet', 'Planb.Api.dll', 'migrate-db'];
  const validEntrypoint =
    Array.isArray(app.entrypoint) &&
    app.entrypoint.length === 3 &&
    app.entrypoint.every(
      (part, index) =>
        typeof part === 'string' &&
        (part === command[index] || /^\$\{M_[A-F0-9]{20}\}$/.test(part)),
    );
  if (
    !validEntrypoint ||
    (app.command !== undefined && app.command !== null) ||
    app.restart !== 'no' ||
    JSON.stringify(app.profiles) !== JSON.stringify(['manual'])
  )
    throw new DeploymentError(
      'Migrate requires the migrate-db entrypoint, restart no and manual profile.',
    );
  delete app.profiles;
  // Compose transforma $$ en $; el shell conserva el exit code exacto del comando de migración.
  app.entrypoint = [
    '/bin/sh',
    '-c',
    `dotnet Planb.Api.dll migrate-db; rc=$$?; printf '\\nCOOLIFY_CI_MIGRATION:${nonce}:%s\\n' "$$rc"; exit "$$rc"`,
  ];
  return { jobRaw: stringifyCompose(compose), restoredRaw: prepared.updatedRaw };
}

async function runMigration(
  client: CoolifyClient,
  config: DeploymentConfig,
  migrate: PreparedService,
  job: { jobRaw: string; restoredRaw: string },
  nonce: string,
): Promise<void> {
  await client.stop(migrate);
  let completed = false;
  try {
    // PATCH puede completarse aun si se corta la respuesta; el finally comprueba el estado guardado.
    await client.update(migrate, job.jobRaw);
    await client.start(migrate);
    const marker = new RegExp(`(?:^|\\r?\\n)COOLIFY_CI_MIGRATION:${nonce}:(\\d+)(?:\\r?\\n|$)`);
    await client.waitFor('Migrate completion', async () => {
      const snapshot = await client.get(migrate.spec);
      if (snapshot.raw !== job.jobRaw)
        throw new DeploymentError('Migrate configuration changed during execution.');
      const match = marker.exec(await client.logs(migrate));
      if (match && match[1] !== '0')
        throw new DeploymentError(`Migrate exited with code ${match[1]}.`);
      return match !== null && /^exited(:|$)/.test(snapshot.status);
    });
    completed = true;
  } finally {
    await restoreMigration(client, config, migrate, job, completed);
  }
}

async function restoreMigration(
  client: CoolifyClient,
  config: DeploymentConfig,
  migrate: PreparedService,
  job: { jobRaw: string; restoredRaw: string },
  completed: boolean,
): Promise<void> {
  // La cancelación del runner no cancela la restauración. Nunca se vuelve a iniciar Migrate.
  const cleanup = new CoolifyClient(
    config,
    { ...client.runtime, signal: undefined },
    client.timeouts,
  );
  const actual = await cleanup.prepare(migrate.spec);
  if (actual.originalRaw !== job.jobRaw && actual.originalRaw !== migrate.originalRaw)
    throw new DeploymentError('Migrate cleanup blocked by a concurrent Compose change.');
  try {
    if (!completed) await cleanup.stop(actual);
  } finally {
    await cleanup.update(actual, job.restoredRaw);
  }
}

export async function deployCoolifyServices(
  config: DeploymentConfig,
  runtime: Partial<Runtime> = {},
  timeouts: Partial<Timeouts> = {},
): Promise<void> {
  const healthUrl = parseUrl(config.healthUrl, 'COOLIFY_HEALTH_URL');
  const webUrl = parseUrl(config.webUrl, 'COOLIFY_WEB_URL');
  const client = new CoolifyClient(config, runtime, timeouts);
  // Se valida el destino entero antes de detener o modificar cualquier recurso.
  const migrate = await client.prepare(config.migrate);
  const api = await client.prepare(config.api);
  const web = await client.prepare(config.web);
  for (const prepared of [api, web]) {
    const app = record(record(prepared.compose.services)[prepared.spec.serviceName]);
    if (app.profiles || record(app.healthcheck).disable === true)
      throw new DeploymentError('API and web require healthchecks and no profiles.');
  }
  const nonce = randomBytes(24).toString('hex');
  const job = migrationCompose(migrate, nonce);
  await runMigration(client, config, migrate, job, nonce);
  await client.deploy(api);
  await client.deploy(web);
  await client.probe(healthUrl, config.expectedSha);
  await client.probe(webUrl);
}

export async function main(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    await deployCoolifyServices(readDeploymentConfig(env), { signal: controller.signal });
    console.log(
      'Migrate completed; API and web are healthy; public health serves the expected SHA.',
    );
  } finally {
    process.off('SIGINT', cancel);
    process.off('SIGTERM', cancel);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(
      `deploy-coolify-services: ${error instanceof DeploymentError ? error.message : 'Unexpected deployment failure.'}`,
    );
    process.exitCode = 1;
  });
}
