import { queryOptions } from '@tanstack/react-query';
import type { Career, CareerPlan, University } from './types';

/**
 * Fetchers + queryOptions co-localizados para el onboarding (US-037-f).
 * Consumen los 3 endpoints públicos Academic shipped en US-037-b.
 *
 * **Paths relativos**: los fetchers usan `/api/...` directo (no `apiFetch`
 * con NEXT_PUBLIC_API_URL absoluto) porque corren client-side desde el
 * browser. El rewrite de Next (next.config.ts) proxy las requests al
 * backend, así son same-origin y evitamos CORS sin tocar el backend.
 *
 * Convenciones (frontend/CLAUDE.md):
 *   - Cada queryKey arranca con el namespace de la feature (`['onboarding', ...]`).
 *   - Errores con throw para que TanStack Query los exponga via `error`.
 *   - `enabled: !!parentId` se setea en el queryOptions, no en el consumer.
 */

async function fetchUniversities(): Promise<University[]> {
  const response = await fetch('/api/academic/universities');
  if (!response.ok) {
    throw new Error(`Universities fetch failed: ${response.status}`);
  }
  return (await response.json()) as University[];
}

async function fetchCareers(universityId: string): Promise<Career[]> {
  const response = await fetch(
    `/api/academic/careers?universityId=${encodeURIComponent(universityId)}`,
  );
  if (!response.ok) {
    throw new Error(`Careers fetch failed: ${response.status}`);
  }
  return (await response.json()) as Career[];
}

async function fetchCareerPlans(careerId: string): Promise<CareerPlan[]> {
  const response = await fetch(
    `/api/academic/career-plans?careerId=${encodeURIComponent(careerId)}`,
  );
  if (!response.ok) {
    throw new Error(`Career plans fetch failed: ${response.status}`);
  }
  return (await response.json()) as CareerPlan[];
}

export const onboardingQueries = {
  universities: () =>
    queryOptions({
      queryKey: ['onboarding', 'universities'],
      queryFn: fetchUniversities,
      // El catálogo cambia raramente; cache razonable para evitar refetches
      // entre paso 02 y vuelta atrás del browser.
      staleTime: 5 * 60 * 1000, // 5 min
    }),

  careersByUniversity: (universityId: string | null) =>
    queryOptions({
      queryKey: ['onboarding', 'careers', universityId ?? 'none'],
      queryFn: () => fetchCareers(universityId as string),
      enabled: Boolean(universityId),
      staleTime: 5 * 60 * 1000,
    }),

  careerPlansByCareer: (careerId: string | null) =>
    queryOptions({
      queryKey: ['onboarding', 'career-plans', careerId ?? 'none'],
      queryFn: () => fetchCareerPlans(careerId as string),
      enabled: Boolean(careerId),
      staleTime: 5 * 60 * 1000,
    }),
};
