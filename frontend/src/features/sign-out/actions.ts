'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Sign-out server action. Clears the auth cookies set by the backend's
 * sign-in endpoint and redirects to /auth.
 *
 * The backend doesn't have a dedicated sign-out endpoint yet (US-029-b
 * backlog). When it lands, this action should call it before clearing
 * cookies so the refresh token gets revoked server-side. For now,
 * deleting the cookies is enough to invalidate the local session
 * (next call to getSession returns null).
 *
 * Per frontend/CLAUDE.md, this file is `'use server'` so it can only
 * export async functions. State types are not needed for this action
 * because it doesn't surface anything to a form — it just redirects.
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/auth');
}
