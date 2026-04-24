/**
 * Find an available port starting from a base port.
 * Uses node:net for cross-platform reliability (avoids Bun.listen TIME_WAIT on Windows).
 *
 * Usage: bun run scripts/find-port.ts <base-port>
 * Also exports findPort() for programmatic use.
 */

import { createServer } from 'node:net';

const MAX_ATTEMPTS = 20;

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

export async function findPort(basePort: number): Promise<number> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const port = basePort + i;
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${basePort}-${basePort + MAX_ATTEMPTS - 1}`);
}

if (import.meta.main) {
  const basePort = Number(process.argv[2]);

  if (!basePort || basePort < 1 || basePort > 65535) {
    console.error('Usage: bun run scripts/find-port.ts <base-port>');
    process.exit(1);
  }

  try {
    const port = await findPort(basePort);
    console.log(port);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
