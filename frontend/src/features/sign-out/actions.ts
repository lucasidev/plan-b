'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Sign-out server action. Calls the backend to revoke the refresh token
 * server-side, then clears the auth cookies locally and redirects to /auth.
 *
 * Order matters: revoke first, delete second. If the backend call fails
 * (network error, backend down) we still clear the cookies so the user
 * isn't stuck logged in on this device — the refresh stays valid in
 * Redis but expires by its natural TTL (≤ 30 days). Worst case is a
 * stale refresh that no one is using; not a security issue, just
 * untidy.
 *
 * The backend reads the refresh from the planb_refresh cookie attached
 * to the request, so we forward the cookie via the standard fetch
 * cookie handling (Next attaches incoming cookies to outbound calls
 * within server actions when same origin; for cross-origin we'd need
 * the explicit forwarding helper used in sign-in).
 *
 * Per frontend/CLAUDE.md, this file is `'use server'` so it can only
 * export async functions. State types are not needed for this action
 * because it doesn't surface anything to a form — it just redirects.
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  // Forward the refresh cookie explicitly. Server-side fetch doesn't carry
  // browser cookies — we rebuild the Cookie header from the incoming request.
  try {
    await apiFetch('/api/identity/sign-out', {
      method: 'POST',
      headers: refreshToken ? { Cookie: `${REFRESH_COOKIE}=${refreshToken}` } : undefined,
    });
  } catch {
    // Swallow: revocation is best-effort. Local cookies still get cleared below.
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/auth');
}
