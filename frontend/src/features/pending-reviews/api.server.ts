import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { PendingReviewsResponse } from './types';

/**
 * Server-side fetcher of pending reviews. Used by the RSC of `/reviews` to prefetch
 * counts and the list, hydrating the TanStack Query cache so first paint is accurate
 * without a client roundtrip.
 *
 * Lives in a separate `.server.ts` file because importing `next/headers` (via
 * `apiFetchAuthenticated`) breaks the build if pulled into a client component.
 */
export async function fetchPendingReviewsServer(): Promise<PendingReviewsResponse> {
  const response = await apiFetchAuthenticated('/api/reviews/me/pending', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Pending reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as PendingReviewsResponse;
}
