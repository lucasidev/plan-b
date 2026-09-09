import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { SearchResponse, UniversityDirectoryEntry } from './types';

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

async function fetchUniversityDirectory(): Promise<UniversityDirectoryEntry[]> {
  const response = await clientApiFetch('/api/academic/universities', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`University directory fetch failed: ${response.status}`);
  }
  return (await response.json()) as UniversityDirectoryEntry[];
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

/**
 * Directorio de universidades (id + slug), para resolver el href de un resultado `institution`
 * (US-132). Catálogo chico (seis instituciones hoy): un solo fetch, cacheado 5 minutos, sin
 * invalidación. El consumidor lo gatea a que la búsqueda haya devuelto al menos una institución,
 * así no pega a `/api/academic/universities` en cada búsqueda de materia o cátedra.
 */
export const universityDirectoryQuery = queryOptions({
  queryKey: ['global-search', 'university-directory'] as const,
  queryFn: fetchUniversityDirectory,
  staleTime: 5 * 60_000,
});
