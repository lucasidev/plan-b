import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { serverEnv } from './env';

/**
 * Session shape derived from the JWT payload issued by the backend
 * (see modules/identity/Planb.Identity.Infrastructure/Security/JwtIssuer).
 * See ADR-0023 for the auth flow design.
 *
 * `hasTeacherProfile` and `teacherVerified` aren't carried in the access
 * JWT yet (the TeacherProfile aggregate isn't implemented). Leaving them
 * in the type but always undefined keeps the (teacher) layout guards
 * type-correct and lets the backend start populating them later without
 * any frontend structural change.
 */
export type Session = {
  userId: string;
  email: string;
  role: 'member' | 'moderator' | 'admin' | 'university_staff';
  hasTeacherProfile?: boolean;
  teacherVerified?: boolean;
};

const ACCESS_COOKIE = 'planb_session';
const ISSUER = 'planb';
const AUDIENCE = 'planb';

// .NET's JwtSecurityTokenHandler maps ClaimTypes.Role onto this URL on the
// wire unless OutboundClaimTypeMap is cleared. The backend keeps the default
// mapping so we read both shapes and pick whichever shows up.
const ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

// Backend roles come from the C# UserRole enum (PascalCase). We normalize to
// the snake_case shape that the rest of the frontend uses (route group names,
// guards, copy). UniversityStaff → university_staff.
const ROLE_MAP: Record<string, Session['role']> = {
  Member: 'member',
  Moderator: 'moderator',
  Admin: 'admin',
  UniversityStaff: 'university_staff',
};

/**
 * Reads and validates the current session from the httpOnly cookie set by
 * the backend's sign-in endpoint. Returns null when the cookie is absent,
 * malformed, expired, signed with the wrong key, or carries unexpected
 * issuer/audience.
 *
 * Verification uses HS256 against JWT_SECRET (symmetric key shared with the
 * backend). The function never throws on bad tokens — the layout guards in
 * (auth)/(member)/(staff) decide what to do with the absence of a session.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(serverEnv().JWT_SECRET), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });

    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const rawRole = payload.role ?? payload[ROLE_CLAIM_URI];
    const role = typeof rawRole === 'string' ? ROLE_MAP[rawRole] : undefined;

    if (!userId || !email || !role) return null;
    return { userId, email, role };
  } catch {
    // jose throws JOSEError variants for: bad signature, expired, malformed,
    // wrong issuer/audience. For any of those we treat the session as absent.
    return null;
  }
}
