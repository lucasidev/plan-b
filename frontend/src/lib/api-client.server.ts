import 'server-only';

import { cookies } from 'next/headers';
import { apiFetch } from './api-client';

const ACCESS_COOKIE = 'planb_session';

/**
 * Variante server-only de <see cref="apiFetch"/> que forwardea automáticamente
 * la cookie <c>planb_session</c> del request del browser al backend. Necesaria
 * porque desde el JwtBearer middleware (US-T05), todos los endpoints
 * <c>/api/me/*</c> requieren la cookie de sesión para identificar al caller.
 *
 * Por qué un archivo separado: importar <c>next/headers</c> desde un módulo que
 * client components consumen rompe la build (\"only works in Server Component\").
 * El <c>'server-only'</c> bombea un error temprano si alguien lo importa
 * accidentalmente desde un client component.
 *
 * Si el caller necesita forwardear cookies adicionales (ej. delete-account que
 * forwardea <c>planb_refresh</c> con Path=/api/identity), puede pasar
 * <c>extraCookies</c>; se mergean con planb_session en el header Cookie.
 */
export async function apiFetchAuthenticated(
  path: string,
  init?: RequestInit & { extraCookies?: Record<string, string | undefined> },
) {
  const { extraCookies, ...rest } = init ?? {};

  // Read del access cookie del request actual. Si no hay request scope (background
  // job), cookies() lanza; degradamos a request sin cookie → backend devuelve 401
  // y el caller lo maneja.
  let access: string | undefined;
  try {
    const store = await cookies();
    access = store.get(ACCESS_COOKIE)?.value;
  } catch {
    access = undefined;
  }

  const cookieParts: string[] = [];
  if (access) cookieParts.push(`${ACCESS_COOKIE}=${access}`);
  if (extraCookies) {
    for (const [name, value] of Object.entries(extraCookies)) {
      if (value) cookieParts.push(`${name}=${value}`);
    }
  }

  return apiFetch(path, {
    ...rest,
    headers: {
      ...rest.headers,
      ...(cookieParts.length > 0 ? { Cookie: cookieParts.join('; ') } : {}),
    },
  });
}
