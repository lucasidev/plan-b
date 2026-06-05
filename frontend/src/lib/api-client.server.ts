import 'server-only';

import { cookies } from 'next/headers';
import { apiFetch } from './api-client';

const ACCESS_COOKIE = 'planb_session';

/**
 * Server-only variant of `apiFetch` that automatically forwards the browser's
 * `planb_session` cookie to the backend. Required because, since the JwtBearer
 * middleware (US-T05), every `/api/me/*` endpoint needs the session cookie to identify
 * the caller.
 *
 * Why a separate file: importing `next/headers` from a module consumed by client
 * components breaks the build ("only works in Server Component"). The `'server-only'`
 * marker throws an early error if a client component imports it by accident.
 *
 * If the caller needs to forward extra cookies (e.g. delete-account, which forwards
 * `planb_refresh` with `Path=/api/identity`), they can pass `extraCookies`; the entries
 * are merged with planb_session in the `Cookie` header.
 */
export async function apiFetchAuthenticated(
  path: string,
  init?: RequestInit & { extraCookies?: Record<string, string | undefined> },
) {
  const { extraCookies, ...rest } = init ?? {};

  // Read the access cookie from the current request. If there's no request scope
  // (background job), cookies() throws; we degrade to a request without the cookie:
  // the backend returns 401 and the caller deals with it.
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
