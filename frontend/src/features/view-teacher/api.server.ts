import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { TeacherDetail, TeacherInsights, TeacherReviewsPage } from './types';
import { TEACHER_REVIEWS_PAGE_SIZE } from './types';

/**
 * Server fetchers for the public teacher page (US-003). The page is server-rendered (RSC):
 * metadata + insights + the requested page of reviews are all fetched here. The endpoints are
 * public (AllowAnonymous); `apiFetchAuthenticated` forwards the session cookie when present but
 * works fine without one, so anonymous visitors get the same data.
 */

/**
 * Teacher metadata. Distinguishes three cases the page reacts to differently:
 *  - `ok`: the teacher exists and is active.
 *  - `removed`: the teacher was soft-deleted (backend returns 410 Gone, US-003 AC); the page shows
 *    "ya no figura en el catálogo" instead of a 404.
 *  - `notfound`: no teacher with that id (404); the page calls `notFound()`.
 */
export async function fetchTeacherServer(
  teacherId: string,
): Promise<{ kind: 'ok'; teacher: TeacherDetail } | { kind: 'removed' } | { kind: 'notfound' }> {
  const response = await apiFetchAuthenticated(`/api/academic/teachers/${teacherId}`, {
    cache: 'no-store',
  });
  if (response.status === 404) {
    return { kind: 'notfound' };
  }
  if (response.status === 410) {
    return { kind: 'removed' };
  }
  if (!response.ok) {
    throw new Error(`Teacher fetch failed: ${response.status}`);
  }
  return { kind: 'ok', teacher: (await response.json()) as TeacherDetail };
}

/** Crowd insights (aggregates). Always 200 for a valid teacherId (no reviews = zeros/nulls). */
export async function fetchTeacherInsightsServer(teacherId: string): Promise<TeacherInsights> {
  const response = await apiFetchAuthenticated(
    `/api/reviews/teacher-insights?teacherId=${teacherId}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Teacher insights fetch failed: ${response.status}`);
  }
  return (await response.json()) as TeacherInsights;
}

/** Paginated published reviews where the teacher was the reviewed one (shared BrowseReviews). */
export async function fetchTeacherReviewsServer(
  teacherId: string,
  page: number,
): Promise<TeacherReviewsPage> {
  const params = new URLSearchParams({
    teacherId,
    page: String(page),
    pageSize: String(TEACHER_REVIEWS_PAGE_SIZE),
  });
  const response = await apiFetchAuthenticated(`/api/reviews?${params}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Teacher reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as TeacherReviewsPage;
}
