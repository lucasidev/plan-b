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
 * Nunca lanza ni deja el pedido a medio construir: todo el cuerpo corre bajo un solo
 * try/catch, así que una env mal configurada, un fetch que tira o un timeout terminan
 * igual en la respuesta de siempre, y el guard de layout decide con lo que ya había.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  try {
    // Next dispara un prefetch en paralelo con la navegación real (mismo link, dos
    // pedidos a la vez). Si los dos ven el mismo access token vencido, refrescan juntos;
    // el backend rota el refresh una sola vez y el que pierde la carrera se queda con un
    // refresh ya revocado. Ignorar el prefetch entero evita la carrera sin tener que
    // coordinar quién ganó.
    if (request.headers.get('next-router-prefetch')) {
      return NextResponse.next();
    }

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

    const backendResponse = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/api/identity/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      cache: 'no-store',
      // Sin deadline, una API viva pero con Redis degradado (o simplemente lenta) deja
      // colgado cada pedido a una ruta con cuenta hasta que el fetch resuelva solo.
      signal: AbortSignal.timeout(2000),
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
    // interno; si el pedido que llegó acá SÍ era https, hay que agregarlo antes de
    // reenviarla, o la cookie de sesión queda degradada respecto de lo que ADR-0023 exige
    // (httpOnly, Secure, SameSite=Lax).
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
