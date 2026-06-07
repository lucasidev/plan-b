import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { EditableReview } from './types';

type MyReviewsListResponse = {
  items: EditableReview[];
  stats: unknown;
};

/**
 * Loads the review the author is editing. We resolve the id by going through the
 * student's own reviews listing rather than a dedicated single-resource endpoint:
 * the list is short and already authenticated. Returns <c>null</c> when the review
 * does not belong to the current student (anti-enumeration: same UX as "not found").
 */
export async function fetchEditableReviewServer(reviewId: string): Promise<EditableReview | null> {
  const response = await apiFetchAuthenticated('/api/reviews/me', { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as MyReviewsListResponse;
  return body.items.find((r) => r.id === reviewId) ?? null;
}
