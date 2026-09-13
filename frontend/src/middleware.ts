import { type NextRequest, NextResponse } from 'next/server';
import { clientEnv, serverEnv } from '@/lib/env';
import { ACCESS_COOKIE } from '@/lib/session';
import { decideRefresh, mergeCookieHeader, nameAndValueOf } from '@/lib/session-refresh';

const REFRESH_COOKIE = 'planb_refresh';

export const config = {
  matcher: ['/home', '/reviews/:path*', '/my-profile', '/settings', '/help', '/admin/:path*'],
};

/**
 * Renueva la sesión antes de renderizar una ruta con cuenta (ADR-0095, hallazgo L11 de la
 * story US-229): sin esto el access token de 15 minutos vence y el guard de layout manda a
 * Ingresar aunque el refresh siga vivo. El middleware no autoriza nada, solo mantiene viva
 * una sesión que el backend reconoce; los guards siguen decidiendo quién entra a qué.
 *
 * Nunca lanza ni deja el pedido a medio construir: si el refresh falla o el fetch tira, la
 * respuesta es la misma de siempre y el guard de layout decide con lo que ya había.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = serverEnv();

  const decision = await decideRefresh({
    accessToken,
    hasRefresh: refreshToken !== undefined,
    now: new Date(),
    secret: JWT_SECRET,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (decision === 'skip' || refreshToken === undefined) {
    return NextResponse.next();
  }

  try {
    const backendResponse = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/api/identity/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      return NextResponse.next();
    }

    const rotatedCookies = backendResponse.headers.getSetCookie();
    const updates: Record<string, string> = {};
    for (const rawSetCookie of rotatedCookies) {
      const parsed = nameAndValueOf(rawSetCookie);
      if (parsed) updates[parsed.name] = parsed.value;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('cookie', mergeCookieHeader(request.headers.get('cookie'), updates));

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // El backend emite el Set-Cookie sin Secure cuando el middleware lo llama por http
    // interno; si el pedido que llegó acá SÍ era https, el navegador lo tiene que recibir
    // con Secure igual, o el cookie jar lo descarta en el siguiente pedido por https.
    const requestIsHttps = request.nextUrl.protocol === 'https:';
    for (const rawSetCookie of rotatedCookies) {
      const alreadySecure = /;\s*secure(?:;|$)/i.test(rawSetCookie);
      response.headers.append(
        'set-cookie',
        requestIsHttps && !alreadySecure ? `${rawSetCookie}; Secure` : rawSetCookie,
      );
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}
