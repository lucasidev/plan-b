'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import type { DeleteAccountFormState } from './types';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Deletes the authenticated user's account (US-038-f). Steps:
 *
 *   1. Read the session from the JWT cookie. If absent (cookie expired
 *      mid-action), surface a friendly error so the modal can suggest
 *      re-login. We don't redirect here so the user keeps the modal open
 *      and decides what to do.
 *   2. Call DELETE /api/me/account?userId={sub}. The endpoint runs the
 *      cascade (User → owned StudentProfile + verification tokens),
 *      writes the audit log, publishes UserAccountDeleted to the outbox
 *      and revokes the user's refresh tokens server-side.
 *   3. On 4xx/5xx, return the error so the modal renders it inline. We
 *      do NOT clear cookies on failure — the user is still logged in.
 *   4. On 204 (success), clear the auth cookies locally so this device
 *      stops carrying a session that points to a now-non-existent user,
 *      and redirect to /sign-in?deleted=1 so the SignInPage shows the
 *      confirmation banner.
 *
 * The form-state shape (`DeleteAccountFormState`) is consumed by the
 * client component via `useActionState`. Per Next.js rules `'use server'`
 * files only export async functions, so the type lives in `types.ts`.
 */
export async function deleteAccountAction(
  _previousState: DeleteAccountFormState,
  _formData: FormData,
): Promise<DeleteAccountFormState> {
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
    response = await apiFetch(`/api/me/account?userId=${encodeURIComponent(session.userId)}`, {
      method: 'DELETE',
      // Forward the refresh cookie so the backend's sign-out side effect
      // (revoke refresh tokens) targets the right session even though
      // the route reads the userId from the query.
      headers: refreshToken ? { Cookie: `${REFRESH_COOKIE}=${refreshToken}` } : undefined,
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (!response.ok) {
    // Map common backend statuses to copy. 404 means the row is already
    // gone — surface a friendly "ya estaba borrada" instead of a generic
    // failure, since for the user the end-state is correct.
    if (response.status === 404) {
      cookieStore.delete(ACCESS_COOKIE);
      cookieStore.delete(REFRESH_COOKIE);
      redirect('/sign-in?deleted=1');
    }
    if (response.status === 401) {
      return {
        status: 'error',
        message: 'Tu sesión expiró. Volvé a ingresar y probá otra vez.',
      };
    }
    return {
      status: 'error',
      message: 'No pudimos eliminar tu cuenta. Probá de nuevo o contactanos.',
    };
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/sign-in?deleted=1');
}
