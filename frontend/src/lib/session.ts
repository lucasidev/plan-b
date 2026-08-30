import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { serverEnv } from './env';

/**
 * Session shape derived from the JWT payload issued by the backend
 * (see modules/identity/Planb.Identity.Infrastructure/Security/JwtIssuer).
 * See ADR-0023 for the auth flow design.
 */
export type Session = {
  userId: string;
  email: string;
  role: 'member' | 'admin';
};

const ACCESS_COOKIE = 'planb_session';

// .NET's JwtSecurityTokenHandler maps ClaimTypes.Role onto this URL on the
// wire unless OutboundClaimTypeMap is cleared. The backend keeps the default
// mapping so we read both shapes and pick whichever shows up.
const ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

// Los roles llegan del enum UserRole de C# (PascalCase) y acá se normalizan a la forma que usa
// el resto del frontend (nombres de route group, guards, copy).
//
// El enum del backend tiene además `Moderator` y `UniversityStaff`, que este mapa NO reconoce a
// propósito: moderación se retiró en R2 y ninguno de los dos tiene hoy una sola pantalla. Un token
// con esos roles no produce sesión (ver el chequeo de abajo), que es lo que queremos: sin área a
// donde entrar, reconocerlo dejaría a la persona dando vueltas entre guards. Vuelven cuando vuelva
// la feature, con su pantalla y su entrada en `roleHomePath`.
const ROLE_MAP: Record<string, Session['role']> = {
  Member: 'member',
  Admin: 'admin',
};

/**
 * Traduce el rol tal como viaja en el cuerpo del sign-in (PascalCase) al del frontend. Devuelve
 * `null` para un rol que el producto no reconoce, y el llamador decide qué hacer con eso.
 */
export function normalizeRole(rawRole: string): Session['role'] | null {
  return ROLE_MAP[rawRole] ?? null;
}

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
    const env = serverEnv();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET), {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
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

/**
 * Guard variant of `getSession()` for authenticated server actions. Returns the
 * session if present, or throws `SessionExpiredError` if absent (missing cookie,
 * invalid or expired JWT). The action using it catches the error and returns the
 * FormState with the "Tu sesión expiró" copy. Defense-in-depth: the backend still
 * validates the JWT on every `/api/me/*` request, but checking here saves a
 * round-trip and gives immediate feedback.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new SessionExpiredError();
  }
  return session;
}
