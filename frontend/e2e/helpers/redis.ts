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
 * Implementación: cliente TCP con `ioredis`. La versión vieja usaba
 * `podman exec planb-redis redis-cli` y skipeaba en CI (donde Redis
 * corre como service container sin nombre planb-redis); esto dejaba
 * los rate limits acumulados entre tests en CI y rompía el flow de
 * forgot-password en el segundo run del mismo spec. La conexión TCP
 * funciona idéntico local + CI.
 *
 * Resolución del URL:
 *   - `REDIS_URL` (override explícito, formato `redis://...`).
 *   - Else: deriva desde `REDIS_PASSWORD` + `REDIS_HOST` (default
 *     localhost) + `REDIS_HOST_PORT` (default 6379). Local en .env
 *     tiene REDIS_PASSWORD; CI no, y default sin password funciona.
 */

import IORedis from 'ioredis';

function buildUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = process.env.REDIS_HOST_PORT ?? '6379';
  const auth = process.env.REDIS_PASSWORD
    ? `default:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
    : '';
  return `redis://${auth}${host}:${port}`;
}

let client: IORedis | null = null;

function getClient(): IORedis {
  if (!client) {
    client = new IORedis(buildUrl(), {
      // Lazy connect + fast fail: queremos saber rápido si Redis no está,
      // no que el helper bloquee el test esperando reconnect.
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }
  return client;
}

/**
 * Borra todas las keys que matchean un pattern. Tolerante a no-matches.
 * Usa SCAN en lugar de KEYS para no bloquear Redis con corpus grande
 * (Redis docs: KEYS es solo para debug).
 */
async function delByPattern(pattern: string): Promise<number> {
  const c = getClient();
  let cursor = '0';
  const keys: string[] = [];
  do {
    const [next, batch] = await c.scan(cursor, 'MATCH', pattern, 'COUNT', '500');
    keys.push(...batch);
    cursor = next;
  } while (cursor !== '0');
  if (keys.length === 0) return 0;
  await c.del(...keys);
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
 * Limpia los buckets de rate-limit para todos los flows de identity:
 * forgot-password, resend-verification, sign-in, etc. Útil al setup
 * de suites E2E que tocan varios endpoints.
 */
export async function clearAllIdentityRateLimits(): Promise<number> {
  return delByPattern('identity:ratelimit:*');
}

/**
 * Cierra el client si fue inicializado. Llamar al final de la suite
 * en globalTeardown si Playwright lo expone; sin esto, ioredis deja
 * el handle abierto y el proceso de tests no termina limpio.
 */
export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {
      // Ya cerrado o error transient; no nos importa, estamos cerrando.
    });
    client = null;
  }
}
