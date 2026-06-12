import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { PendingReview, PendingReviewsResponse } from './types';

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

/**
 * Resolves a single pending enrollment by id, going through the listing rather than a
 * dedicated detail endpoint (same reasoning as `fetchEditableReviewServer`: the list is short
 * and already authenticated). Used by the write-review page to fill the editor context with
 * real subject/period/grade instead of a mock.
 *
 * Returns `null` when the enrollment is not in the student's pending set (already reviewed,
 * not theirs, or not reviewable): the page maps that to a 404.
 */
export async function fetchPendingReviewServer(
  enrollmentId: string,
): Promise<PendingReview | null> {
  const response = await apiFetchAuthenticated('/api/reviews/me/pending', { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as PendingReviewsResponse;
  return body.items.find((item) => item.enrollmentId === enrollmentId) ?? null;
}
