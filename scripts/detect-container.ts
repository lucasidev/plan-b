/**
 * Prints the name of the first available container runtime: podman or docker.
 * Used by the Justfile to auto-select the compose CLI.
 *
 * Preference order: podman, then docker. Override with CONTAINER_CMD env var.
 * For docker, verifies the daemon is reachable (not just installed — Docker Desktop
 * can be installed but off).
 */

import { execSync } from 'node:child_process';

const override = process.env.CONTAINER_CMD;
if (override) {
  process.stdout.write(override);
  process.exit(0);
}

for (const candidate of ['podman', 'docker']) {
  try {
    execSync(`${candidate} --version`, { stdio: 'ignore' });
    if (candidate === 'docker') {
      execSync('docker info', { stdio: 'ignore' });
    }
    process.stdout.write(candidate);
    process.exit(0);
  } catch {
    // try next
  }
}

console.error('No container runtime found. Install docker or podman.');
process.exit(1);
