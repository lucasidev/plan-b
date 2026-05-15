/**
 * Ensures planb infrastructure is running with available ports.
 *
 * For each service (postgres, redis, mailpit):
 *   - If the container is already running, reuses its mapped host port.
 *   - If not, finds a free port and starts it.
 *
 * After starting, updates .env with the resolved ports + connection strings
 * so backend (ASP.NET Core) picks them up via its dotenv-loaded env vars.
 *
 * Usage: bun scripts/ensure-infra.ts [container-cmd]
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { detectContainerRuntime } from './detect-container.ts';
import { findPort } from './find-port.ts';

const ROOT = resolve(import.meta.dirname, '..');
const ROOT_ENV = resolve(ROOT, '.env');

// Timeout corto para los `compose exec` del waitForService loop. Si el comando
// se cuelga (ej. socket de podman colgado porque la VM se apagó mid-vuelo),
// el catch del loop recibe el error y reintenta. Sin esto, `execSync` espera
// para siempre y el script queda atrapado aunque el usuario encienda la VM.
const COMPOSE_EXEC_TIMEOUT_MS = 5000;

// Timeout para `compose ps`. Defensa en profundidad: si por algún motivo el
// daemon respondió a `info` pero `ps` se cuelga, no queremos colgar el script.
const COMPOSE_PS_TIMEOUT_MS = 10000;

function detectContainerCmd(): string {
  // Cuando viene desde `just infra-up`, el cmd ya está resuelto por
  // detect-container.ts (Justfile lo pasa como argv[2]). Cuando se corre
  // standalone (`bun scripts/ensure-infra.ts`), detectamos acá.
  const override = process.argv[2] || process.env.CONTAINER_CMD;
  if (override) {
    process.env.CONTAINER_CMD = override;
  }
  return detectContainerRuntime();
}

const containerCmd = detectContainerCmd();
const compose = `${containerCmd} compose`;

interface ServicePorts {
  postgres: number;
  redis: number;
  mailpitSmtp: number;
  mailpitUi: number;
}

function getRunningPorts(): Partial<ServicePorts> {
  const ports: Partial<ServicePorts> = {};
  try {
    const output = execSync(`${compose} ps --status running --format json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: COMPOSE_PS_TIMEOUT_MS,
    });

    for (const line of output.trim().split('\n')) {
      if (!line) continue;
      try {
        const container = JSON.parse(line);
        const name: string = container.Service ?? container.Name ?? '';
        const publishers: Array<{ TargetPort: number; PublishedPort: number }> =
          container.Publishers ?? [];
        const portStr: string = container.Ports ?? '';

        if (name.includes('postgres')) {
          const pub = publishers.find((p) => p.TargetPort === 5432);
          if (pub?.PublishedPort) {
            ports.postgres = pub.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->5432/);
            if (m) ports.postgres = Number(m[1]);
          }
        }

        if (name.includes('redis')) {
          const pub = publishers.find((p) => p.TargetPort === 6379);
          if (pub?.PublishedPort) {
            ports.redis = pub.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->6379/);
            if (m) ports.redis = Number(m[1]);
          }
        }

        if (name.includes('mailpit')) {
          const pubSmtp = publishers.find((p) => p.TargetPort === 1025);
          if (pubSmtp?.PublishedPort) {
            ports.mailpitSmtp = pubSmtp.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->1025/);
            if (m) ports.mailpitSmtp = Number(m[1]);
          }
          const pubUi = publishers.find((p) => p.TargetPort === 8025);
          if (pubUi?.PublishedPort) {
            ports.mailpitUi = pubUi.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->8025/);
            if (m) ports.mailpitUi = Number(m[1]);
          }
        }
      } catch {
        // skip non-JSON lines
      }
    }
  } catch {
    // compose ps failed — containers not running
  }
  return ports;
}

function readEnvVar(path: string, key: string): string | null {
  if (!existsSync(path)) return null;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k === key) return trimmed.slice(eq + 1).trim();
  }
  return null;
}

function updateEnvFile(path: string, updates: Record<string, string>) {
  if (!existsSync(path)) {
    console.error(`Warning: ${path} does not exist. Run 'just _ensure-env' first.`);
    return;
  }
  let content = readFileSync(path, 'utf-8');
  for (const [k, v] of Object.entries(updates)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${k}=${v}`);
    } else {
      content += `\n${k}=${v}`;
    }
  }
  writeFileSync(path, content, 'utf-8');
}

function updateRootEnv(ports: ServicePorts) {
  const pgPass = readEnvVar(ROOT_ENV, 'POSTGRES_PASSWORD') ?? 'planb_dev_password';
  const connStr = `Host=localhost;Port=${ports.postgres};Database=planb;Username=planb;Password=${pgPass}`;
  const redisPass = readEnvVar(ROOT_ENV, 'REDIS_PASSWORD') ?? 'planb_dev_redis';
  // StackExchange.Redis configuration string format: host:port,password=...
  const redisConn = `localhost:${ports.redis},password=${redisPass}`;
  updateEnvFile(ROOT_ENV, {
    POSTGRES_HOST_PORT: String(ports.postgres),
    REDIS_HOST_PORT: String(ports.redis),
    MAILPIT_SMTP_PORT: String(ports.mailpitSmtp),
    MAILPIT_UI_PORT: String(ports.mailpitUi),
    ConnectionStrings__Planb: connStr,
    ConnectionStrings__PlanbWolverine: connStr,
    ConnectionStrings__Redis: redisConn,
    Smtp__Port: String(ports.mailpitSmtp),
  });
}

async function waitForService(
  name: string,
  check: () => void | Promise<void>,
  maxSeconds = 60,
) {
  console.error(`Waiting for ${name}...`);
  for (let i = 0; i < maxSeconds; i++) {
    try {
      await check();
      console.error(`  ${name} ready`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.error(`  ${name} failed to become ready within ${maxSeconds}s`);
  process.exit(1);
}

function guardSecrets() {
  const required = ['POSTGRES_PASSWORD', 'REDIS_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `Missing required env vars: ${missing.join(', ')}\n` +
        `The .env file is incomplete or not loaded. Run 'just _ensure-env' first.`,
    );
    process.exit(1);
  }
}

async function main() {
  guardSecrets();

  const running = getRunningPorts();
  const allRunning =
    running.postgres && running.redis && running.mailpitSmtp && running.mailpitUi;

  if (allRunning) {
    const p = running as ServicePorts;
    console.error(
      `Infrastructure already running — postgres:${p.postgres} redis:${p.redis} mailpit-smtp:${p.mailpitSmtp} mailpit-ui:${p.mailpitUi}`,
    );
    updateRootEnv(p);
    return;
  }

  const [pg, redis, smtp, ui] = await Promise.all([
    running.postgres ? Promise.resolve(running.postgres) : findPort(5432),
    running.redis ? Promise.resolve(running.redis) : findPort(6379),
    running.mailpitSmtp ? Promise.resolve(running.mailpitSmtp) : findPort(1025),
    running.mailpitUi ? Promise.resolve(running.mailpitUi) : findPort(8025),
  ]);

  const ports: ServicePorts = { postgres: pg, redis, mailpitSmtp: smtp, mailpitUi: ui };

  console.error(
    `Starting infrastructure — postgres:${pg} redis:${redis} mailpit-smtp:${smtp} mailpit-ui:${ui}`,
  );

  try {
    execSync(`${compose} up -d`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
      env: {
        ...process.env,
        POSTGRES_HOST_PORT: String(pg),
        REDIS_HOST_PORT: String(redis),
        MAILPIT_SMTP_PORT: String(smtp),
        MAILPIT_UI_PORT: String(ui),
      },
    });
  } catch (e) {
    const err = e as { stderr?: string };
    console.error(`Failed to start infrastructure: ${err.stderr ?? e}`);
    process.exit(1);
  }

  updateRootEnv(ports);

  await waitForService('postgres', () => {
    execSync(`${compose} exec postgres pg_isready -U planb -d planb`, {
      stdio: 'pipe',
      timeout: COMPOSE_EXEC_TIMEOUT_MS,
    });
  });

  await waitForService('redis', () => {
    // -a + --no-auth-warning so the password is checked but the warning doesn't pollute stderr.
    execSync(
      `${compose} exec redis redis-cli -a "${process.env.REDIS_PASSWORD}" --no-auth-warning ping`,
      { stdio: 'pipe', timeout: COMPOSE_EXEC_TIMEOUT_MS },
    );
  });

  console.error('');
  console.error('Infrastructure ready.');
  console.error(`  Postgres:      localhost:${pg}`);
  console.error(`  Redis:         localhost:${redis}`);
  console.error(`  Mailpit SMTP:  localhost:${smtp}`);
  console.error(`  Mailpit UI:    http://localhost:${ui}`);
}

await main();
