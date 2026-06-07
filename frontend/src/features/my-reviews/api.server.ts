import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { MyReviewsResponse } from './types';

/**
 * Server-side fetcher of my reviews. Used by the RSC of `/reviews` to prefetch the list
 * and stats so the page hydrates with content + KPIs in one shot.
 */
export async function fetchMyReviewsServer(): Promise<MyReviewsResponse> {
  const response = await apiFetchAuthenticated('/api/reviews/me', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`My reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as MyReviewsResponse;
}
