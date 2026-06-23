import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { SearchResponse } from './types';

/** Mínimo de chars para disparar la búsqueda. Espeja el AC del backend (400 si es menor). */
export const MIN_SEARCH_LENGTH = 2;

async function fetchSearch(term: string): Promise<SearchResponse> {
  const response = await clientApiFetch(`/api/search?q=${encodeURIComponent(term)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }
  return (await response.json()) as SearchResponse;
}

/**
 * Query options de la búsqueda. La clave incluye el término para cachear por query. `enabled`
 * gatea por longitud mínima; el consumidor además lo gatea por un flag `mounted` (la búsqueda
 * vive en el topbar, fuera de cualquier HydrationBoundary, así no corre server-side bajo
 * ReactQueryStreamedHydration). Ver `components/layout/topbar.tsx`.
 */
export const searchQueries = {
  forTerm: (term: string) =>
    queryOptions({
      queryKey: ['global-search', term] as const,
      queryFn: () => fetchSearch(term),
      enabled: term.length >= MIN_SEARCH_LENGTH,
      staleTime: 30_000,
    }),
};
