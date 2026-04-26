/**
 * Pre-push hook gate: fails when `dotnet list package --vulnerable
 * --include-transitive` reports any vulnerable NuGet package. Replaces a bash
 * inline `if echo $output | grep -q ...; then exit 1` so the hook works on
 * Windows without bash, per the project's TS-only scripts convention.
 *
 * Usage: bun scripts/check-backend-vulns.ts
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BACKEND = resolve(ROOT, 'backend');

const result = spawnSync(
  'dotnet',
  ['list', 'package', '--vulnerable', '--include-transitive'],
  {
    cwd: BACKEND,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
);

const stdout = result.stdout ?? '';
const stderr = result.stderr ?? '';
const combined = stdout + stderr;

// `dotnet list` returns exit 0 even when it finds CVEs — the only signal is
// the marker phrase in stdout. (Net 10 SDK behavior, same as net8/9.)
const VULN_MARKER = 'has the following vulnerable packages';

if (combined.includes(VULN_MARKER)) {
  process.stdout.write(combined);
  process.stderr.write(
    '\n✗ Vulnerable packages detected. Bump them in Directory.Packages.props.\n',
  );
  process.exit(1);
}

if (result.status !== 0) {
  // dotnet itself failed (network down, restore broken, etc.) — surface the
  // error rather than silently passing the hook.
  process.stderr.write(combined);
  process.stderr.write(`\n✗ dotnet list package exited with status ${result.status}.\n`);
  process.exit(result.status ?? 1);
}

process.exit(0);
