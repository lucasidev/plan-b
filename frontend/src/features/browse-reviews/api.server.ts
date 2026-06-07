import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { BrowseReviewsFilters, BrowseReviewsResponse } from './types';

/**
 * Server-side fetcher. Even though the endpoint is public (anonymous), we go through
 * `apiFetchAuthenticated` so the request flows through the same Next.js rewrite and
 * keeps cookie forwarding consistent in case the endpoint adds personalisation later.
 */
export async function fetchBrowseReviewsServer(
  filters: BrowseReviewsFilters,
): Promise<BrowseReviewsResponse> {
  const params = new URLSearchParams();
  if (filters.difficulty !== null) params.set('difficulty', String(filters.difficulty));
  params.set('page', String(filters.page));
  params.set('pageSize', '20');

  const response = await apiFetchAuthenticated(`/api/reviews?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Browse reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as BrowseReviewsResponse;
}
