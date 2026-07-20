import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { AvailableSubjectsResponse } from './types';

/**
 * Query client-side de las materias disponibles para el simulador (US-016). La página /plan
 * prefetchea con el fetcher server-only (api.server) seedeando este mismo queryKey; el drawer
 * "Agregar materia" consume con useSuspenseQuery.
 */
async function fetchAvailableSubjects(): Promise<AvailableSubjectsResponse> {
  const response = await clientApiFetch('/api/me/simulator/available', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`available subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as AvailableSubjectsResponse;
}

export const availableSubjectsQueries = {
  list: () =>
    queryOptions({
      queryKey: ['plan', 'available-subjects'] as const,
      queryFn: fetchAvailableSubjects,
    }),
};
