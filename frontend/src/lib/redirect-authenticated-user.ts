import { redirect } from 'next/navigation';
import { sanitizeInternalRedirect } from '@/lib/internal-redirect';
import { roleHomePath } from '@/lib/role-home-path';
import { getSession } from '@/lib/session';

const AUTH_PATHS = ['/sign-in', '/sign-up', '/verify-email', '/forgot-password', '/reset-password'];

/** El guard vive en la página para conservar el destino al re-renderizar tras iniciar sesión. */
export async function redirectAuthenticatedUser(returnTo?: string | null) {
  const session = await getSession();
  if (!session) return;

  const safeReturnTo = sanitizeInternalRedirect(returnTo);
  const pathname = safeReturnTo?.split(/[?#]/)[0];
  const returnsToAuth = AUTH_PATHS.some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`),
  );
  redirect(safeReturnTo && !returnsToAuth ? safeReturnTo : roleHomePath(session.role));
}
