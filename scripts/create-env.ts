/**
 * Creates/repairs .env files for local development.
 *
 * Behavior:
 *   - If a secret is missing or looks like a placeholder ('change_this_...', '<redacted>'),
 *     a new random value is generated.
 *   - Existing real secrets are preserved.
 *   - Files are rewritten when any secret changes (to ensure the full shape is current).
 *
 * Usage:
 *   bun scripts/create-env.ts           # Create/repair missing or placeholder secrets
 *   bun scripts/create-env.ts --force   # Regenerate all secrets (DESTRUCTIVE)
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PATHS = {
  root: resolve(ROOT, '.env'),
  frontend: resolve(ROOT, 'frontend/.env.local'),
} as const;

const PLACEHOLDER_PATTERNS = [/^change_this/i, /^<.*>$/, /^your[-_]/i, /^REPLACE/i];
const MIN_SECRET_LENGTH = 16;

function randomBase64Url(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function parseEnvFile(path: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function isRealSecret(v: string | undefined): boolean {
  if (!v || v.length < MIN_SECRET_LENGTH) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(v));
}

interface Secrets {
  POSTGRES_PASSWORD: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
}

function resolveSecrets(force: boolean): { secrets: Secrets; changed: boolean; details: string[] } {
  const existing = parseEnvFile(PATHS.root);
  const existingJwt = existing.JWT__Secret ?? existing.JWT_SECRET;

  let changed = force;
  const details: string[] = [];

  function pick(key: string, cur: string | undefined, gen: () => string): string {
    if (force) {
      details.push(`  ↻ ${key}: regenerated (--force)`);
      changed = true;
      return gen();
    }
    if (!isRealSecret(cur)) {
      details.push(`  + ${key}: generated (${cur ? 'placeholder' : 'missing'})`);
      changed = true;
      return gen();
    }
    details.push(`  = ${key}: preserved`);
    return cur;
  }

  return {
    secrets: {
      POSTGRES_PASSWORD: pick('POSTGRES_PASSWORD', existing.POSTGRES_PASSWORD, () => randomBase64Url(18)),
      JWT_SECRET: pick('JWT__Secret', existingJwt, () => randomBase64Url(48)),
      SESSION_SECRET: pick('SESSION_SECRET', existing.SESSION_SECRET, () => randomBase64Url(32)),
    },
    changed,
    details,
  };
}

function rootEnv(s: Secrets, ts: string): string {
  const connStr = `Host=localhost;Port=5432;Database=planb;Username=planb;Password=${s.POSTGRES_PASSWORD}`;
  return `# planb — Generated ${ts}
# This file is auto-managed by scripts/create-env.ts and scripts/ensure-infra.ts.
# Ports are rewritten by ensure-infra.ts at each 'just infra-up'.

# ── Secrets ──────────────────────────────────────────────────
POSTGRES_PASSWORD=${s.POSTGRES_PASSWORD}
JWT__Secret=${s.JWT_SECRET}
SESSION_SECRET=${s.SESSION_SECRET}

# ── Ports (rewritten by ensure-infra.ts) ─────────────────────
POSTGRES_HOST_PORT=5432
MAILHOG_SMTP_PORT=1025
MAILHOG_UI_PORT=8025

# ── Backend (ASP.NET Core — '__' is nested config separator) ─
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000

ConnectionStrings__Planb=${connStr}
ConnectionStrings__PlanbWolverine=${connStr}

JWT__Issuer=planb
JWT__Audience=planb
JWT__AccessTokenMinutes=15
JWT__RefreshTokenDays=30

Moderation__AutoHideThreshold=3

Smtp__Host=localhost
Smtp__Port=1025
Smtp__UseSsl=false
Smtp__FromEmail=noreply@planb.local
Smtp__FromName=planb

Embeddings__ModelName=intfloat/multilingual-e5-base
Embeddings__ModelVersion=1.0
Embeddings__Dimensions=768
`;
}

function frontendEnv(s: Secrets, ts: string): string {
  return `# planb frontend — Generated ${ts}

NEXT_PUBLIC_API_URL=http://localhost:5000
SESSION_SECRET=${s.SESSION_SECRET}
`;
}

const args = process.argv.slice(2);
const force = args.includes('--force');

const { secrets, changed, details } = resolveSecrets(force);
const bothExist = existsSync(PATHS.root) && existsSync(PATHS.frontend);

if (!changed && bothExist) {
  console.log('→ .env files are complete. Use --force to regenerate secrets.');
  process.exit(0);
}

console.log(force ? '→ Forcing regeneration of all secrets...' : '→ Resolving secrets...');
for (const line of details) console.log(line);

const ts = timestamp();
const files: { path: string; label: string; content: string }[] = [
  { path: PATHS.root, label: '.env', content: rootEnv(secrets, ts) },
  { path: PATHS.frontend, label: 'frontend/.env.local', content: frontendEnv(secrets, ts) },
];

for (const f of files) {
  const existed = existsSync(f.path);
  writeFileSync(f.path, f.content, 'utf-8');
  console.log(`  ✓ ${existed ? 'Updated' : 'Created'} ${f.label}`);
}

console.log('✓ Done.');
