import { cookies } from 'next/headers';

/**
 * Session shape derived from the JWT payload issued by the backend.
 * See ADR-0023 for the auth flow design.
 */
export type Session = {
  userId: string;
  email: string;
  role: 'member' | 'moderator' | 'admin' | 'university_staff';
  hasTeacherProfile?: boolean;
  teacherVerified?: boolean;
};

/**
 * Reads and validates the current session from the httpOnly cookie.
 * Returns null if no valid session.
 *
 * TODO:
 *   - Decrypt cookie via iron-session.
 *   - Validate JWT signature via jose against backend public key.
 *   - Refresh silencioso si el access token está a <2min de expirar.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('planb_session');
  if (!token) return null;
  // TODO: decrypt + verify
  return null;
}
