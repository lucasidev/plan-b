import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { SubjectDetail, SubjectInsights, SubjectReviewsPage } from './types';
import { SUBJECT_REVIEWS_PAGE_SIZE } from './types';

/**
 * Server fetchers for the public subject page (US-002). The page is server-rendered (RSC):
 * metadata + insights + the requested page of reviews are all fetched here. The endpoints are
 * public (AllowAnonymous); `apiFetchAuthenticated` forwards the session cookie when present but
 * works fine without one, so anonymous visitors get the same data.
 */

/** Subject metadata. Returns `null` on 404 so the page can call `notFound()`. */
export async function fetchSubjectServer(subjectId: string): Promise<SubjectDetail | null> {
  const response = await apiFetchAuthenticated(`/api/academic/subjects/${subjectId}`, {
    cache: 'no-store',
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Subject fetch failed: ${response.status}`);
  }
  return (await response.json()) as SubjectDetail;
}

/** Crowd insights (aggregates). Always 200 for a valid subjectId (empty subject = zeros/nulls). */
export async function fetchSubjectInsightsServer(subjectId: string): Promise<SubjectInsights> {
  const response = await apiFetchAuthenticated(`/api/reviews/insights?subjectId=${subjectId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Subject insights fetch failed: ${response.status}`);
  }
  return (await response.json()) as SubjectInsights;
}

/** Paginated published reviews for the subject (shared BrowseReviews endpoint). */
export async function fetchSubjectReviewsServer(
  subjectId: string,
  page: number,
): Promise<SubjectReviewsPage> {
  const params = new URLSearchParams({
    subjectId,
    page: String(page),
    pageSize: String(SUBJECT_REVIEWS_PAGE_SIZE),
  });
  const response = await apiFetchAuthenticated(`/api/reviews?${params}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Subject reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as SubjectReviewsPage;
}
