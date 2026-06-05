'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { DeactivateAccountFormState } from './types';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Deactivates the authenticated user's account (ADR-0044, US-038-bis). Replaced the hard
 * delete of the original flow (US-038-f). The backend endpoint `/api/me/account` now
 * anonymizes PII (hashed email, blank password, deactivated_at = now) and deletes owned
 * data with PII (StudentProfile, verification tokens). The user's existing reviews stay
 * published as "Ex-miembro".
 *
 * Steps:
 *   1. Read the session from the JWT cookie. If absent (cookie expired mid-action),
 *      surface the error in the modal so the user can re-login and retry. Don't
 *      redirect: let the user decide.
 *   2. DELETE /api/me/account. The backend invokes `DeactivateAccountCommand` (not the
 *      legacy hard delete, which no longer has a user-facing endpoint).
 *   3. On 4xx/5xx, surface inline. Do NOT clear cookies on failure (the user stays
 *      logged in).
 *   4. On 204, clear local cookies (the backend already revoked the refresh tokens),
 *      redirect to `/sign-in?account-deactivated=1` so the banner explains what happened.
 *
 * The form-state shape (`DeactivateAccountFormState`) is consumed in the client
 * component via `useActionState`. Per the Next.js rule, `'use server'` files only export
 * async functions, so the type lives in `types.ts`.
 */
export async function deactivateAccountAction(
  _previousState: DeactivateAccountFormState,
  _formData: FormData,
): Promise<DeactivateAccountFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a ingresar y probá otra vez.',
    };
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/account', {
      method: 'DELETE',
      // apiFetchAuthenticated forwards planb_session (JwtBearer middleware auth); we
      // pass planb_refresh via extraCookies because it has Path=/api/identity and
      // would not be included automatically.
      extraCookies: refreshToken ? { [REFRESH_COOKIE]: refreshToken } : undefined,
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (!response.ok) {
    if (response.status === 404) {
      // Degenerate case: the JWT points to a user that no longer exists in DB
      // (admin-side hard delete, or row deleted manually). Clear cookies and send
      // to the banner.
      cookieStore.delete(ACCESS_COOKIE);
      cookieStore.delete(REFRESH_COOKIE);
      redirect('/sign-in?account-deactivated=1');
    }
    if (response.status === 409) {
      // Already deactivated (explicit backend idempotency). Treat as success from the
      // user's point of view: clear cookies and head to the banner.
      cookieStore.delete(ACCESS_COOKIE);
      cookieStore.delete(REFRESH_COOKIE);
      redirect('/sign-in?account-deactivated=1');
    }
    if (response.status === 401) {
      return {
        status: 'error',
        message: 'Tu sesión expiró. Volvé a ingresar y probá otra vez.',
      };
    }
    return {
      status: 'error',
      message: 'No pudimos dar de baja tu cuenta. Probá de nuevo o contactanos.',
    };
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/sign-in?account-deactivated=1');
}
