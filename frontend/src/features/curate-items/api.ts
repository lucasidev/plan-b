import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { CatalogItem } from './types';

/**
 * Query client-side del catálogo de frases (US-198). La RSC prefetchea con el fetcher server-only
 * (`api.server`) seedeando este mismo queryKey; la pantalla consume con useSuspenseQuery, y guardar
 * un cambio invalida el query, que refetchea client-side.
 *
 * Es el patrón robusto (ADR-0021 + ADR-0046), el mismo que usan las cátedras y los planes de una
 * carrera: `router.refresh()` no refleja de forma confiable una mutación en la misma página en prod
 * build. Se midió en cátedras (la fila recién cargada no aparecía en la mitad de las corridas), y
 * acá la forma es idéntica: un Server Action muta y la lista de al lado tiene que mostrarlo.
 */
async function fetchItems(): Promise<CatalogItem[]> {
  const response = await clientApiFetch('/api/reviews/curation/items', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`item catalog failed with ${response.status}`);
  }
  const body = (await response.json()) as { items: CatalogItem[] };
  return body.items;
}

export const itemCatalogQueries = {
  all: () =>
    queryOptions({
      queryKey: ['admin', 'items'] as const,
      queryFn: fetchItems,
    }),
};
