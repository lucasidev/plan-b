/**
 * just doctor — validación del toolchain de planb.
 *
 * Lee `.tool-versions` (asdf/mise format) y `backend/global.json` para
 * conocer las versiones esperadas, luego compara con lo que hay instalado.
 *
 * Reportes:
 *   - ✓ verde si la versión instalada matchea o es compatible (patch newer ok).
 *   - ⚠ amarillo si hay drift menor (patch/minor distinto pero compatible).
 *   - ✗ rojo si la tool no está instalada o es incompatible.
 *
 * Exit code:
 *   0 si todo OK o solo warnings
 *   1 si hay errores fatales (tools missing)
 *
 * No instala nada — solo reporta. La instalación queda en manos del dev
 * (con asdf/mise: `mise install`; sin: instalar manual cada tool).
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Severity = 'ok' | 'warn' | 'fail';

type Check = {
  tool: string;
  required: string;
  found: string | null;
  severity: Severity;
  hint?: string;
};

const ROOT = join(import.meta.dir, '..');
const TOOL_VERSIONS_PATH = join(ROOT, '.tool-versions');
const GLOBAL_JSON_PATH = join(ROOT, 'backend', 'global.json');

function readToolVersions(): Map<string, string> {
  if (!existsSync(TOOL_VERSIONS_PATH)) {
    console.error('No .tool-versions found at root.');
    process.exit(1);
  }
  const content = readFileSync(TOOL_VERSIONS_PATH, 'utf8');
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [tool, version] = trimmed.split(/\s+/);
    if (tool && version) map.set(tool, version);
  }
  return map;
}

function readDotnetSdkPin(): string | null {
  if (!existsSync(GLOBAL_JSON_PATH)) return null;
  try {
    const json = JSON.parse(readFileSync(GLOBAL_JSON_PATH, 'utf8'));
    return json.sdk?.version ?? null;
  } catch {
    return null;
  }
}

function tryRun(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** Compara semver. Returns: 'match' | 'patch-newer' | 'minor-newer' | 'major-newer' | 'older' | 'incomparable'. */
function compareSemver(found: string, required: string): string {
  const cleanFound = found.match(/(\d+)\.(\d+)\.(\d+)/);
  const cleanReq = required.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!cleanFound || !cleanReq) return 'incomparable';

  const [, fMaj, fMin, fPat] = cleanFound.map(Number);
  const [, rMaj, rMin, rPat] = cleanReq.map(Number);

  if (fMaj !== rMaj) return fMaj > rMaj ? 'major-newer' : 'older';
  if (fMin !== rMin) return fMin > rMin ? 'minor-newer' : 'older';
  if (fPat !== rPat) return fPat > rPat ? 'patch-newer' : 'older';
  return 'match';
}

function checkTool(
  tool: string,
  versionCmd: string,
  required: string,
  installHint: string,
): Check {
  const raw = tryRun(versionCmd);
  if (!raw) {
    return {
      tool,
      required,
      found: null,
      severity: 'fail',
      hint: `not installed. ${installHint}`,
    };
  }

  const cmp = compareSemver(raw, required);
  if (cmp === 'match' || cmp === 'patch-newer') {
    return { tool, required, found: raw, severity: 'ok' };
  }
  if (cmp === 'minor-newer' || cmp === 'major-newer') {
    return {
      tool,
      required,
      found: raw,
      severity: 'warn',
      hint: `installed version newer than pin (${cmp}). If intentional, bump .tool-versions.`,
    };
  }
  if (cmp === 'older') {
    return {
      tool,
      required,
      found: raw,
      severity: 'fail',
      hint: `installed version older than pin. ${installHint}`,
    };
  }
  return { tool, required, found: raw, severity: 'warn', hint: 'version format unrecognized' };
}

function checkPlaywrightChromium(): Check {
  // Playwright instala browsers en ~/.cache/ms-playwright en Linux/macOS,
  // %USERPROFILE%/AppData/Local/ms-playwright en Windows. La forma agnóstica
  // es preguntarle a la CLI: `playwright install --dry-run chromium` muestra
  // si el binario está y matchea la versión esperada.
  const out = tryRun('cd frontend && bunx playwright install --dry-run chromium 2>&1');
  if (!out) {
    return {
      tool: 'playwright chromium',
      required: 'matching @playwright/test',
      found: null,
      severity: 'fail',
      hint: 'browsers not installed. Run: just frontend-install',
    };
  }
  // Si dry-run indica "browsers will be installed", el binary falta.
  if (out.includes('install location') && out.includes('downloaded')) {
    return {
      tool: 'playwright chromium',
      required: 'matching @playwright/test',
      found: 'present',
      severity: 'ok',
    };
  }
  if (/will be installed|missing/i.test(out)) {
    return {
      tool: 'playwright chromium',
      required: 'matching @playwright/test',
      found: 'missing',
      severity: 'fail',
      hint: 'Run: just frontend-install (instala chromium si falta)',
    };
  }
  return {
    tool: 'playwright chromium',
    required: 'matching @playwright/test',
    found: 'present',
    severity: 'ok',
  };
}

function checkContainerRuntime(): Check {
  const podman = tryRun('podman --version');
  const docker = tryRun('docker --version');
  if (podman) {
    return { tool: 'container runtime', required: 'podman or docker', found: `podman (${podman})`, severity: 'ok' };
  }
  if (docker) {
    // docker installed, verify daemon reachable
    const info = tryRun('docker info');
    if (info) {
      return { tool: 'container runtime', required: 'podman or docker', found: `docker (${docker})`, severity: 'ok' };
    }
    return {
      tool: 'container runtime',
      required: 'podman or docker (running)',
      found: 'docker installed but daemon unreachable',
      severity: 'fail',
      hint: 'start Docker Desktop or switch to podman',
    };
  }
  return {
    tool: 'container runtime',
    required: 'podman or docker',
    found: null,
    severity: 'fail',
    hint: 'install podman (preferred) or docker',
  };
}

function emoji(severity: Severity): string {
  return severity === 'ok' ? '✓' : severity === 'warn' ? '⚠' : '✗';
}

function color(severity: Severity, text: string): string {
  if (!process.stdout.isTTY) return text;
  const codes = { ok: '\x1b[32m', warn: '\x1b[33m', fail: '\x1b[31m' };
  return `${codes[severity]}${text}\x1b[0m`;
}

function format(check: Check): string {
  const icon = color(check.severity, emoji(check.severity));
  const found = check.found ?? 'NOT FOUND';
  const head = `${icon} ${check.tool.padEnd(22)} ${found.padEnd(20)} (required: ${check.required})`;
  return check.hint ? `${head}\n  ${color(check.severity, '↳')} ${check.hint}` : head;
}

async function main() {
  const pins = readToolVersions();
  const dotnetPin = readDotnetSdkPin() ?? pins.get('dotnet') ?? '10.0.0';
  const bunPin = pins.get('bun') ?? '1.0.0';
  const lefthookPin = pins.get('lefthook') ?? '1.0.0';

  console.log('plan-b doctor — toolchain check\n');

  const checks: Check[] = [
    checkTool('dotnet', 'dotnet --version', dotnetPin, 'install from https://dotnet.microsoft.com/download'),
    checkTool('bun', 'bun --version', bunPin, 'install from https://bun.sh'),
    checkTool('lefthook', 'lefthook version', lefthookPin, 'install via package manager (brew/apt/scoop) — see https://lefthook.dev'),
    checkContainerRuntime(),
    checkPlaywrightChromium(),
  ];

  for (const c of checks) console.log(format(c));

  const failures = checks.filter((c) => c.severity === 'fail').length;
  const warnings = checks.filter((c) => c.severity === 'warn').length;
  console.log('');
  if (failures > 0) {
    console.log(color('fail', `✗ ${failures} fatal issue(s). Fix above before running just dev / just test.`));
    process.exit(1);
  }
  if (warnings > 0) {
    console.log(color('warn', `⚠ ${warnings} warning(s). Tools functional but drift from pins — review.`));
    process.exit(0);
  }
  console.log(color('ok', '✓ Toolchain OK. Ready to dev.'));
}

main();
