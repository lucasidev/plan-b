import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { AdminChair } from './types';

/**
 * Query client-side de las cátedras de una materia (US-196 admin). La RSC prefetchea con el fetcher
 * server-only (`api.server`) seedeando este mismo queryKey; la lista consume con useSuspenseQuery, y
 * el alta invalida el query, que refetchea client-side.
 *
 * Es el patrón robusto (ADR-0021 + ADR-0046), el mismo que ya usan los planes de una carrera:
 * `router.refresh()` no refleja de forma confiable una mutación en la misma página en prod build.
 * Medido acá: con refresh la cátedra recién cargada no aparecía en la mitad de las corridas, aunque
 * el backend ya la tenía y un reload completo la mostraba siempre.
 */
async function fetchAdminChairs(subjectId: string): Promise<AdminChair[]> {
  const response = await clientApiFetch(`/api/academic/chairs?subjectId=${subjectId}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`admin chairs list failed with ${response.status}`);
  }
  return (await response.json()) as AdminChair[];
}

export const adminChairQueries = {
  forSubject: (subjectId: string) =>
    queryOptions({
      queryKey: ['admin', 'chairs', subjectId] as const,
      queryFn: () => fetchAdminChairs(subjectId),
    }),
};
