/**
 * Selects the container runtime to use for compose recipes.
 *
 * Preference: podman → docker. A runtime counts as usable only if:
 *   1. its CLI is installed (`<cmd> --version` succeeds), AND
 *   2. its daemon/VM responds (`<cmd> info` succeeds within a few seconds).
 *
 * Why we check the daemon (not just `--version`): `podman --version` returns 0
 * even when the Podman VM is off on Windows/macOS. Without this check,
 * downstream `podman compose` calls hang on the socket — and if the user
 * starts the VM mid-hang, the already-blocked `execSync` never notices. We
 * surface a clear error up front instead of letting `just dev` hang forever.
 *
 * Override autodetect with `CONTAINER_CMD=docker` (or any other cmd).
 *
 * Used by the Justfile (`bun scripts/detect-container.ts`, prints the cmd)
 * and importable from other scripts via `detectContainerRuntime()`.
 */

import { execSync } from 'node:child_process';

const CANDIDATES = ['podman', 'docker'] as const;
const DAEMON_CHECK_TIMEOUT_MS = 5000;

function isInstalled(cmd: string): boolean {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function daemonResponds(cmd: string): boolean {
  try {
    execSync(`${cmd} info`, {
      stdio: 'ignore',
      timeout: DAEMON_CHECK_TIMEOUT_MS,
    });
    return true;
  } catch {
    return false;
  }
}

function printDaemonOffHint(cmd: string) {
  // Los hints son por-OS para no mandar al usuario al comando equivocado:
  //   - Podman en Windows/macOS usa una VM (`podman machine`); en Linux nativo
  //     el daemon corre como service del usuario (`podman.socket`).
  //   - Docker Desktop existe en Windows/macOS; en Linux es `dockerd` como
  //     systemd service.
  // process.platform: 'win32' | 'darwin' | 'linux' | 'freebsd' | ...
  const isWinOrMac = process.platform === 'win32' || process.platform === 'darwin';

  if (cmd === 'podman') {
    if (isWinOrMac) {
      console.error('  podman: VM no responde. Ejecutá `podman machine start`.');
    } else {
      console.error(
        '  podman: daemon no responde. Ejecutá `systemctl --user start podman.socket`.',
      );
    }
  } else if (cmd === 'docker') {
    if (isWinOrMac) {
      console.error('  docker: daemon no responde. Arrancá Docker Desktop.');
    } else {
      console.error('  docker: daemon no responde. Ejecutá `sudo systemctl start docker`.');
    }
  } else {
    console.error(`  ${cmd}: daemon no responde. Verificá que esté corriendo.`);
  }
}

export function detectContainerRuntime(): string {
  const override = process.env.CONTAINER_CMD;
  if (override) {
    if (!isInstalled(override)) {
      console.error(`CONTAINER_CMD=${override} no está instalado o no está en el PATH.`);
      process.exit(1);
    }
    if (!daemonResponds(override)) {
      console.error(`CONTAINER_CMD=${override} instalado pero el daemon no responde.`);
      printDaemonOffHint(override);
      process.exit(1);
    }
    return override;
  }

  const installedButOff: string[] = [];
  for (const candidate of CANDIDATES) {
    if (!isInstalled(candidate)) continue;
    if (daemonResponds(candidate)) return candidate;
    installedButOff.push(candidate);
  }

  if (installedButOff.length > 0) {
    console.error(
      `Runtime(s) instalados pero con daemon apagado: ${installedButOff.join(', ')}.`,
    );
    for (const c of installedButOff) printDaemonOffHint(c);
    console.error('');
    console.error('  Una vez arrancado, reintentá el comando.');
    process.exit(1);
  }

  console.error('No se encontró ningún container runtime. Instalá docker o podman.');
  process.exit(1);
}

if (import.meta.main) {
  process.stdout.write(detectContainerRuntime());
}
