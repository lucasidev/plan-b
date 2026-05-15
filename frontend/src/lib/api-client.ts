import { env } from '@/lib/env';

/**
 * Thin fetch wrapper around the backend API.
 * Used from Server Actions, RSC, and client components (TanStack Query fetchers).
 *
 * **Cookies**:
 *   - Client-side: el browser adjunta automáticamente cookies same-origin
 *     (planb_session, planb_refresh) en cada fetch al backend via Next rewrite.
 *   - Server-side (Server Actions, RSC): las cookies del request del browser NO
 *     viajan automáticamente al fetch del servidor. El caller que necesita auth
 *     debe usar <see cref="apiFetchAuthenticated"/> de <c>./api-client.server.ts</c>
 *     (que lee `next/headers` y forwardea la cookie planb_session).
 */
export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${env.NEXT_PUBLIC_API_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  return response;
}
