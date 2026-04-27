import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { cookies } from 'next/headers';

/**
 * Forwards Set-Cookie headers from a backend Response into the user-agent's
 * cookie jar via Next's `cookies()` API.
 *
 * Why this exists: server actions call the backend server-side, so any
 * Set-Cookie the backend emits never reaches the browser unless we
 * explicitly re-set it on the action's own response. The sign-in flow
 * relies on this to land `planb_session` and `planb_refresh` (httpOnly,
 * Path-scoped) on the user's browser.
 *
 * The parser handles the cookie attributes the backend uses today
 * (Path, Expires, Max-Age, Domain, SameSite, Secure, HttpOnly). It is
 * deliberately small: a richer parser would be a dependency we don't need.
 *
 * Lives outside actions.ts because that file is `'use server'` (per
 * frontend/CLAUDE.md) and can only export async functions.
 */

type ParsedCookie = {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
};

function parseSetCookieHeader(raw: string): ParsedCookie {
  const parts = raw.split(';').map((p) => p.trim());
  const [first, ...attrs] = parts;
  const eqIdx = first.indexOf('=');
  const name = first.slice(0, eqIdx).trim();
  const value = first.slice(eqIdx + 1).trim();

  const options: Partial<ResponseCookie> = {};
  for (const attr of attrs) {
    const sepIdx = attr.indexOf('=');
    const key = (sepIdx === -1 ? attr : attr.slice(0, sepIdx)).toLowerCase();
    const val = sepIdx === -1 ? '' : attr.slice(sepIdx + 1);

    if (key === 'path') options.path = val;
    else if (key === 'expires') options.expires = new Date(val);
    else if (key === 'max-age') options.maxAge = Number(val);
    else if (key === 'domain') options.domain = val;
    else if (key === 'samesite') {
      const lower = val.toLowerCase();
      if (lower === 'strict' || lower === 'lax' || lower === 'none') {
        options.sameSite = lower;
      }
    } else if (key === 'secure') options.secure = true;
    else if (key === 'httponly') options.httpOnly = true;
  }

  return { name, value, options };
}

export async function forwardSetCookies(response: Response): Promise<void> {
  const setCookieHeaders = response.headers.getSetCookie();
  if (setCookieHeaders.length === 0) return;

  const cookieStore = await cookies();
  for (const raw of setCookieHeaders) {
    const { name, value, options } = parseSetCookieHeader(raw);
    cookieStore.set(name, value, options);
  }
}
