import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { AcademicTerm, Commission, Subject } from './types';

/**
 * Fetchers for the Academic catalog endpoints shipped in PR1:
 *   - GET /api/academic/subjects?careerPlanId=
 *   - GET /api/academic/academic-terms?universityId=
 *
 * Paths are relative (`/api/...`) and go through the Next.js rewrite (avoiding CORS).
 * They go through `clientApiFetch` so the client-only invariant is enforced: the consumer
 * `EnrollmentForm` is `'use client'` with `useQuery` and the page does not prefetch+hydrate
 * these keys, so under ReactQueryStreamedHydration the queryFn could SSR-execute. A raw
 * relative `fetch` would then throw "Failed to parse URL" (no origin in Node);
 * `clientApiFetch` logs the misuse instead so the render degrades rather than crashing.
 */

async function fetchSubjects(careerPlanId: string): Promise<Subject[]> {
  const response = await clientApiFetch(
    `/api/academic/subjects?careerPlanId=${encodeURIComponent(careerPlanId)}`,
  );
  if (!response.ok) {
    throw new Error(`Subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as Subject[];
}

async function fetchAcademicTerms(universityId: string): Promise<AcademicTerm[]> {
  const response = await clientApiFetch(
    `/api/academic/academic-terms?universityId=${encodeURIComponent(universityId)}`,
  );
  if (!response.ok) {
    throw new Error(`Academic terms fetch failed: ${response.status}`);
  }
  return (await response.json()) as AcademicTerm[];
}

async function fetchCommissions(subjectId: string, termId: string): Promise<Commission[]> {
  const response = await clientApiFetch(
    `/api/academic/subjects/${encodeURIComponent(subjectId)}/commissions?termId=${encodeURIComponent(termId)}`,
  );
  if (!response.ok) {
    throw new Error(`Commissions fetch failed: ${response.status}`);
  }
  return (await response.json()) as Commission[];
}

export const addEnrollmentQueries = {
  subjects: (careerPlanId: string | null) =>
    queryOptions({
      queryKey: ['add-enrollment', 'subjects', careerPlanId ?? 'none'],
      queryFn: () =>
        careerPlanId ? fetchSubjects(careerPlanId) : Promise.resolve([] as Subject[]),
      enabled: !!careerPlanId,
    }),

  academicTerms: (universityId: string | null) =>
    queryOptions({
      queryKey: ['add-enrollment', 'terms', universityId ?? 'none'],
      queryFn: () =>
        universityId ? fetchAcademicTerms(universityId) : Promise.resolve([] as AcademicTerm[]),
      enabled: !!universityId,
    }),

  commissions: (subjectId: string | null, termId: string | null) =>
    queryOptions({
      queryKey: ['add-enrollment', 'commissions', subjectId ?? 'none', termId ?? 'none'],
      queryFn: () =>
        subjectId && termId
          ? fetchCommissions(subjectId, termId)
          : Promise.resolve([] as Commission[]),
      enabled: !!subjectId && !!termId,
    }),
};
