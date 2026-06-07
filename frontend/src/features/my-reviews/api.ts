import { queryOptions } from '@tanstack/react-query';
import type { MyReviewsResponse } from './types';

/**
 * Client-side fetcher of the authenticated student's reviews. Same pattern as
 * `pending-reviews`: cookie-authenticated, namespaced queryKey, no cache so we always see
 * the latest state.
 */
async function fetchMyReviews(): Promise<MyReviewsResponse> {
  const response = await fetch('/api/reviews/me', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`My reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as MyReviewsResponse;
}

export const myReviewsQueries = {
  list: () =>
    queryOptions({
      queryKey: ['my-reviews', 'list'] as const,
      queryFn: fetchMyReviews,
    }),
};
