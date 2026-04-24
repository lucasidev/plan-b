/**
 * Ensures planb infrastructure is running with available ports.
 *
 * For each service (postgres, mailhog):
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
import { findPort } from './find-port.ts';

const ROOT = resolve(import.meta.dirname, '..');
const ROOT_ENV = resolve(ROOT, '.env');

function detectContainerCmd(): string {
  const override = process.argv[2] || process.env.CONTAINER_CMD;
  if (override) return override;
  for (const candidate of ['podman', 'docker']) {
    try {
      execSync(`${candidate} --version`, { stdio: 'ignore' });
      if (candidate === 'docker') {
        execSync('docker info', { stdio: 'ignore' });
      }
      return candidate;
    } catch {
      // try next
    }
  }
  console.error('No container runtime found. Install docker or podman.');
  process.exit(1);
}

const containerCmd = detectContainerCmd();
const compose = `${containerCmd} compose`;

interface ServicePorts {
  postgres: number;
  mailhogSmtp: number;
  mailhogUi: number;
}

function getRunningPorts(): Partial<ServicePorts> {
  const ports: Partial<ServicePorts> = {};
  try {
    const output = execSync(`${compose} ps --status running --format json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
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

        if (name.includes('mailhog')) {
          const pubSmtp = publishers.find((p) => p.TargetPort === 1025);
          if (pubSmtp?.PublishedPort) {
            ports.mailhogSmtp = pubSmtp.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->1025/);
            if (m) ports.mailhogSmtp = Number(m[1]);
          }
          const pubUi = publishers.find((p) => p.TargetPort === 8025);
          if (pubUi?.PublishedPort) {
            ports.mailhogUi = pubUi.PublishedPort;
          } else {
            const m = portStr.match(/:(\d+)->8025/);
            if (m) ports.mailhogUi = Number(m[1]);
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
  updateEnvFile(ROOT_ENV, {
    POSTGRES_HOST_PORT: String(ports.postgres),
    MAILHOG_SMTP_PORT: String(ports.mailhogSmtp),
    MAILHOG_UI_PORT: String(ports.mailhogUi),
    ConnectionStrings__Planb: connStr,
    ConnectionStrings__PlanbWolverine: connStr,
    Smtp__Port: String(ports.mailhogSmtp),
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
  const required = ['POSTGRES_PASSWORD'];
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
  const allRunning = running.postgres && running.mailhogSmtp && running.mailhogUi;

  if (allRunning) {
    const p = running as ServicePorts;
    console.error(
      `Infrastructure already running — postgres:${p.postgres} mailhog-smtp:${p.mailhogSmtp} mailhog-ui:${p.mailhogUi}`,
    );
    updateRootEnv(p);
    return;
  }

  const [pg, smtp, ui] = await Promise.all([
    running.postgres ? Promise.resolve(running.postgres) : findPort(5432),
    running.mailhogSmtp ? Promise.resolve(running.mailhogSmtp) : findPort(1025),
    running.mailhogUi ? Promise.resolve(running.mailhogUi) : findPort(8025),
  ]);

  const ports: ServicePorts = { postgres: pg, mailhogSmtp: smtp, mailhogUi: ui };

  console.error(
    `Starting infrastructure — postgres:${pg} mailhog-smtp:${smtp} mailhog-ui:${ui}`,
  );

  try {
    execSync(`${compose} up -d`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
      env: {
        ...process.env,
        POSTGRES_HOST_PORT: String(pg),
        MAILHOG_SMTP_PORT: String(smtp),
        MAILHOG_UI_PORT: String(ui),
      },
    });
  } catch (e) {
    const err = e as { stderr?: string };
    console.error(`Failed to start infrastructure: ${err.stderr ?? e}`);
    process.exit(1);
  }

  updateRootEnv(ports);

  await waitForService('postgres', () => {
    execSync(`${compose} exec postgres pg_isready -U planb -d planb`, { stdio: 'pipe' });
  });

  console.error('');
  console.error('Infrastructure ready.');
  console.error(`  Postgres:      localhost:${pg}`);
  console.error(`  MailHog SMTP:  localhost:${smtp}`);
  console.error(`  MailHog UI:    http://localhost:${ui}`);
}

await main();
