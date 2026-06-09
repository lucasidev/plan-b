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

/**
 * Browser-only fetch against a **relative** `/api/...` path. The user-agent resolves the
 * path against the page origin and the Next.js rewrite proxies it to the backend, so the
 * session cookie rides along automatically (no forwarding needed).
 *
 * Use this for the client fetchers in `features/<feature>/api.ts` (the `queryFn` of a
 * `useQuery` / `useSuspenseQuery`). Those modules are imported by `'use client'`
 * components, which Next.js still renders on the server during SSR. Under
 * `ReactQueryStreamedHydration`, a query whose data was NOT prefetched + hydrated runs its
 * `queryFn` server-side (via `fetchOptimistic`). A relative URL has no origin in Node, so
 * the underlying `fetch('/api/...')` rejects with `TypeError: Failed to parse URL`.
 *
 * Why this logs instead of throwing: that server-side rejection is **tolerated** by the
 * framework. React Query surfaces it as a query error and refetches on the client, so the
 * page still renders. A hard `throw` here, by contrast, escalates the tolerated transient
 * into a fatal RSC render error (a thrown error with a digest), which is strictly worse than
 * the cryptic message it was meant to replace. So we surface the misuse with a descriptive
 * server-side log and then defer to the same `fetch` the old code ran: behaviour stays
 * identical to before, plus an actionable breadcrumb.
 *
 * The invariant still holds: client fetchers should not run on the server. To read the same
 * data server-side, prefetch + hydrate through the feature's `api.server.ts`
 * (`apiFetchAuthenticated`), or gate the consuming query with a mounted flag so it stays on
 * the client (see `components/layout/topbar.tsx`).
 */
export function clientApiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (typeof window === 'undefined') {
    console.error(
      `clientApiFetch ran on the server (path "${path}"). Relative /api paths only resolve in the browser: prefetch + hydrate via the feature api.server.ts (apiFetchAuthenticated), or gate the query with a mounted flag so it runs client-only.`,
    );
  }
  return fetch(path, init);
}
