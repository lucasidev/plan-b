import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { PrerequisiteEdge } from './types';

/**
 * Query client-side del grafo de correlativas de un plan (US-062 admin). La página de materias
 * prefetchea con el fetcher server-only (api.server) seedeando este mismo queryKey; el panel
 * consume con useSuspenseQuery. Las mutaciones (agregar / quitar correlativa) invalidan este query,
 * que refetchea client-side (mismo patrón que careerPlanQueries en manage-careers, ADR-0021 +
 * ADR-0046).
 */
async function fetchPrerequisites(planId: string): Promise<PrerequisiteEdge[]> {
  const response = await clientApiFetch(`/api/academic/career-plans/${planId}/prerequisites`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`prerequisites fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as { items: PrerequisiteEdge[] };
  return data.items;
}

export const prerequisiteQueries = {
  forPlan: (planId: string) =>
    queryOptions({
      queryKey: ['admin', 'prerequisites', planId] as const,
      queryFn: () => fetchPrerequisites(planId),
    }),
};
