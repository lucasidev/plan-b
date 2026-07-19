import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { CareerPlanRow } from './types';

/**
 * Query client-side de los planes de una carrera (US-061 admin). El detalle prefetchea con el
 * fetcher server-only (api.server) seedeando este mismo queryKey; el panel consume con
 * useSuspenseQuery. Las mutaciones (alta / deprecar / reactivar) invalidan este query, que refetchea
 * client-side. Es el patrón robusto (ADR-0021 + ADR-0046): router.refresh() no refleja de forma
 * confiable una mutación en una página a la que se llegó por soft-navigation en prod build.
 */
async function fetchCareerPlans(careerId: string): Promise<CareerPlanRow[]> {
  const response = await clientApiFetch(`/api/academic/careers/${careerId}/plans`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`career plans fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as { items: CareerPlanRow[] };
  return data.items;
}

export const careerPlanQueries = {
  forCareer: (careerId: string) =>
    queryOptions({
      queryKey: ['admin', 'career-plans', careerId] as const,
      queryFn: () => fetchCareerPlans(careerId),
    }),
};
