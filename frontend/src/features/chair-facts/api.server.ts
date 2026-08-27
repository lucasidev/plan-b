import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { ChairFacts } from './types';

/**
 * Fetcher server-side de la ficha de cátedra (US-147). Público y sin cuenta: la ficha es lo que
 * el producto publica, y una presión que solo ven los registrados no presiona.
 *
 * Devuelve null cuando la cátedra no existe o está inactiva, para que la ruta responda 404 en vez
 * de reventar.
 */
export async function fetchChairFactsServer(chairId: string): Promise<ChairFacts | null> {
  const response = await apiFetch(`/api/reviews/chairs/${encodeURIComponent(chairId)}/facts`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Chair facts fetch failed: ${response.status}`);
  }

  return (await response.json()) as ChairFacts;
}
