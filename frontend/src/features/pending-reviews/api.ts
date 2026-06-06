import { queryOptions } from '@tanstack/react-query';
import type { PendingReviewsResponse } from './types';

/**
 * TanStack Query options for the pending-reviews listing. The endpoint is authenticated
 * (cookie-based JWT); the browser sends the `planb_session` cookie automatically via the
 * Next.js rewrite to `/api/*`.
 *
 * The query key is namespaced so the topbar badge and the Pendientes tab share the same
 * cache entry. Invalidating it after a publish (handled by the editor's server action)
 * propagates the new count + list to both consumers in a single network call.
 */
async function fetchPendingReviews(): Promise<PendingReviewsResponse> {
  const response = await fetch('/api/reviews/me/pending', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Pending reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as PendingReviewsResponse;
}

export const pendingReviewsQueries = {
  list: () =>
    queryOptions({
      queryKey: ['pending-reviews', 'list'] as const,
      queryFn: fetchPendingReviews,
    }),
};

export const PENDING_REVIEWS_QUERY_KEY = ['pending-reviews'] as const;
