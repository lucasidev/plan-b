import { jwtVerify } from 'jose';

export type DecideRefreshInput = {
  accessToken: string | undefined;
  hasRefresh: boolean;
  now: Date;
  secret: string;
  issuer: string;
  audience: string;
  thresholdSeconds?: number;
};

/**
 * Decide si el middleware (ADR-0095) tiene que pedirle un access token nuevo al backend
 * antes de renderizar. Sin cookie de refresh no hay nada que renovar: 'skip' siempre, y el
 * guard de layout decide qué hacer con la ausencia de sesión, igual que hoy. Con refresh,
 * 'refresh' si el access token falta, no verifica (firma, issuer o audience que no
 * coinciden, o ya venció) o vence en menos de `thresholdSeconds` (default 120). Nunca
 * lanza: cualquier duda sobre el access token cae del lado de renovar, porque el costo de
 * un refresh de más es un POST extra y el de uno de menos es mandar a Ingresar a una
 * sesión que seguía viva.
 */
export async function decideRefresh(input: DecideRefreshInput): Promise<'skip' | 'refresh'> {
  const { accessToken, hasRefresh, now, secret, issuer, audience, thresholdSeconds = 120 } = input;

  if (!hasRefresh) return 'skip';
  if (!accessToken) return 'refresh';

  try {
    const { payload } = await jwtVerify(accessToken, new TextEncoder().encode(secret), {
      issuer,
      audience,
      algorithms: ['HS256'],
      currentDate: now,
    });

    const expiresAtMs = typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
    const msUntilExpiry = expiresAtMs - now.getTime();
    return msUntilExpiry < thresholdSeconds * 1000 ? 'refresh' : 'skip';
  } catch {
    return 'refresh';
  }
}

/**
 * Reescribe una cabecera Cookie reemplazando el valor de los nombres que aparecen en
 * `updates` (en su misma posición) y agregando al final los que faltaban, sin duplicar
 * ningún nombre. El middleware la usa para que el pedido que disparó el refresh ya vea el
 * access token nuevo al renderizar, sin esperar a la próxima navegación.
 */
export function mergeCookieHeader(
  existing: string | null,
  updates: Record<string, string>,
): string {
  const pairs = new Map<string, string>();

  if (existing) {
    for (const part of existing.split(';')) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const eqIdx = trimmed.indexOf('=');
      const name = eqIdx === -1 ? trimmed : trimmed.slice(0, eqIdx);
      const value = eqIdx === -1 ? '' : trimmed.slice(eqIdx + 1);
      pairs.set(name, value);
    }
  }

  for (const [name, value] of Object.entries(updates)) {
    pairs.set(name, value);
  }

  return Array.from(pairs.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * El par name/value de un header Set-Cookie crudo, ignorando sus atributos (Path, Expires,
 * etc: todo lo que viene después del primer ';'). Null si no tiene forma de cookie.
 */
export function nameAndValueOf(setCookie: string): { name: string; value: string } | null {
  const firstSegment = setCookie.split(';')[0]?.trim() ?? '';
  const eqIdx = firstSegment.indexOf('=');
  if (eqIdx <= 0) return null;

  return {
    name: firstSegment.slice(0, eqIdx),
    value: firstSegment.slice(eqIdx + 1),
  };
}
