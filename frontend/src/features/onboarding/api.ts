import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { Career, CareerPlan, University } from './types';

/**
 * Co-located fetchers + queryOptions for onboarding (US-037-f). They consume the three
 * public Academic endpoints shipped in US-037-b.
 *
 * **Relative paths**: fetchers go through `clientApiFetch` with a `/api/...` path (not
 * `apiFetch` with the absolute NEXT_PUBLIC_API_URL) because they run client-side from the
 * browser. The Next rewrite (next.config.ts) proxies the requests to the backend, so they
 * end up same-origin and we sidestep CORS without touching the backend. `clientApiFetch`
 * also fails fast if one of these ever runs server-side (relative URLs have no origin in
 * Node); see its doc in `lib/api-client.ts`.
 *
 * Conventions (frontend/CLAUDE.md):
 *   - Every queryKey starts with the feature namespace (`['onboarding', ...]`).
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

export const onboardingQueries = {
  universities: () =>
    queryOptions({
      queryKey: ['onboarding', 'universities'],
      queryFn: fetchUniversities,
      // The catalog rarely changes; a reasonable cache avoids refetches between step
      // 02 and a browser back-navigation.
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
