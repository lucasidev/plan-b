/**
 * Helpers para limpiar estado en Redis desde los specs E2E.
 *
 * Casos de uso típico:
 *   - Limpiar rate-limit buckets antes de un test que hace múltiples
 *     forgot-password / sign-in / etc. (para no toparse con el límite
 *     de previous test runs).
 *   - Limpiar refresh-token revocation list cuando un test cierra y
 *     reabre sesión.
 *
 * Implementación: usa `podman exec` (o `docker exec` como fallback) contra
 * el container del dev stack. En CI, donde Redis corre como service
 * container sin nombre planb-redis, los tests pueden setear
 * `REDIS_CONTAINER_CMD=""` para skipear (y los rate limiters arrancan
 * desde cero igual porque el container es ephemeral).
 *
 * Si en algún momento queremos hablarle a Redis directo desde Node, podemos
 * cambiar esto por un cliente nativo. Por ahora, exec contra el container
 * es zero-deps.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const REDIS_CONTAINER = process.env.REDIS_CONTAINER ?? 'planb-redis';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const CONTAINER_CMD = process.env.REDIS_CONTAINER_CMD ?? 'podman';

/**
 * Skip cuando estamos en CI (service container, no podman exec disponible)
 * o cuando el dev no tiene container CLI configurado.
 */
function shouldSkip(): boolean {
  return process.env.CI === 'true' || !CONTAINER_CMD;
}

async function redisCli(args: string[]): Promise<string> {
  if (shouldSkip()) return '';
  const auth = REDIS_PASSWORD ? ['-a', REDIS_PASSWORD, '--no-auth-warning'] : [];
  const cmd = [CONTAINER_CMD, 'exec', REDIS_CONTAINER, 'redis-cli', ...auth, ...args]
    .map((a) => (a.includes(' ') ? `"${a}"` : a))
    .join(' ');
  const { stdout } = await execAsync(cmd);
  return stdout;
}

/**
 * Borra todas las keys que matchean un pattern. Tolerante a no-matches.
 */
async function delByPattern(pattern: string): Promise<number> {
  if (shouldSkip()) return 0;
  const keysRaw = await redisCli(['KEYS', pattern]);
  const keys = keysRaw.split(/\r?\n/).filter(Boolean);
  if (keys.length === 0) return 0;
  await redisCli(['DEL', ...keys]);
  return keys.length;
}

/**
 * Limpia los buckets de rate-limit para forgot-password.
 * Patrón usado por `RedisRateLimiter` (ver ADR-0034 patrón #2).
 */
export async function clearForgotPasswordRateLimits(): Promise<number> {
  return delByPattern('identity:ratelimit:forgot-password:*');
}

/**
 * Limpia los buckets de rate-limit para todos los flows de identity.
 * Útil al setup de la suite E2E completa.
 */
export async function clearAllIdentityRateLimits(): Promise<number> {
  return delByPattern('identity:ratelimit:*');
}
