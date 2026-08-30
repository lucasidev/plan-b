import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { Career, CareerPlan, University } from './types';

/**
 * Co-located fetchers + queryOptions para el picker de carrera. Pegan a los tres endpoints
 * públicos de Academic que ya usaba `features/onboarding`; viven acá porque con ADR-0086 la
 * carrera se declara en el registro, que no es el onboarding.
 *
 * **Relative paths**: fetchers go through `clientApiFetch` with a `/api/...` path (not
 * `apiFetch` with the absolute NEXT_PUBLIC_API_URL) because they run client-side from the
 * browser. The Next rewrite (next.config.ts) proxies the requests to the backend, so they
 * end up same-origin and we sidestep CORS without touching the backend. Crucially, these
 * endpoints are **públicos**: no requieren sesión, así que el picker funciona igual montado
 * en `/sign-up` (sin cuenta todavía) que en cualquier pantalla autenticada.
 *
 * Conventions (frontend/CLAUDE.md):
 *   - Every queryKey starts with the feature namespace (`['career-catalog', ...]`).
 *   - Errors are thrown so TanStack Query surfaces them through `error`.
 *   - `enabled: !!parentId` is set in queryOptions, not at the consumer site.
 */

async function fetchUniversities(): Promise<University[]> {
  const response = await clientApiFetch('/api/academic/universities');
  if (!response.ok) {
    throw new Error(`Universities fetch failed: ${response.status}`);
  }
  return (await response.json()) as University[];
}

async function fetchCareers(universityId: string): Promise<Career[]> {
  const response = await clientApiFetch(
    `/api/academic/careers?universityId=${encodeURIComponent(universityId)}`,
  );
  if (!response.ok) {
    throw new Error(`Careers fetch failed: ${response.status}`);
  }
  return (await response.json()) as Career[];
}

async function fetchCareerPlans(careerId: string): Promise<CareerPlan[]> {
  const response = await clientApiFetch(
    `/api/academic/career-plans?careerId=${encodeURIComponent(careerId)}`,
  );
  if (!response.ok) {
    throw new Error(`Career plans fetch failed: ${response.status}`);
  }
  return (await response.json()) as CareerPlan[];
}

export const careerCatalogQueries = {
  universities: () =>
    queryOptions({
      queryKey: ['career-catalog', 'universities'],
      queryFn: fetchUniversities,
      // The catalog rarely changes; a reasonable cache avoids refetches between a failed
      // submit and its retry, or between screens that mount the picker.
      staleTime: 5 * 60 * 1000, // 5 min
    }),

  careersByUniversity: (universityId: string | null) =>
    queryOptions({
      queryKey: ['career-catalog', 'careers', universityId ?? 'none'],
      queryFn: () => fetchCareers(universityId as string),
      enabled: Boolean(universityId),
      staleTime: 5 * 60 * 1000,
    }),

  careerPlansByCareer: (careerId: string | null) =>
    queryOptions({
      queryKey: ['career-catalog', 'career-plans', careerId ?? 'none'],
      queryFn: () => fetchCareerPlans(careerId as string),
      enabled: Boolean(careerId),
      staleTime: 5 * 60 * 1000,
    }),
};
