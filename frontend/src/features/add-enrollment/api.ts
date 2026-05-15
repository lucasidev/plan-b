import { queryOptions } from '@tanstack/react-query';
import type { AcademicTerm, Subject } from './types';

/**
 * Fetchers para los endpoints del catálogo Academic shipped en PR1:
 *   - GET /api/academic/subjects?careerPlanId=
 *   - GET /api/academic/academic-terms?universityId=
 *
 * Los path son relativos (`/api/...`) porque corren client-side y van por el
 * rewrite de Next, evitando CORS. Mismo patrón que <c>onboarding/api.ts</c>.
 */

async function fetchSubjects(careerPlanId: string): Promise<Subject[]> {
  const response = await fetch(
    `/api/academic/subjects?careerPlanId=${encodeURIComponent(careerPlanId)}`,
  );
  if (!response.ok) {
    throw new Error(`Subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as Subject[];
}

async function fetchAcademicTerms(universityId: string): Promise<AcademicTerm[]> {
  const response = await fetch(
    `/api/academic/academic-terms?universityId=${encodeURIComponent(universityId)}`,
  );
  if (!response.ok) {
    throw new Error(`Academic terms fetch failed: ${response.status}`);
  }
  return (await response.json()) as AcademicTerm[];
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
};
