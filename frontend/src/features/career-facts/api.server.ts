import 'server-only';

import { apiFetch } from '@/lib/api-client';
import type { CareerFacts } from './types';

/**
 * Fetcher server-side de la ficha de carrera (US-134). Pública y sin cuenta, como toda la
 * superficie que el producto publica.
 *
 * Devuelve null cuando la carrera no existe, para que la ruta responda 404 en vez de reventar.
 */
export async function fetchCareerFactsServer(careerId: string): Promise<CareerFacts | null> {
  const response = await apiFetch(`/api/reviews/careers/${encodeURIComponent(careerId)}/facts`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Career facts fetch failed: ${response.status}`);
  }

  return (await response.json()) as CareerFacts;
}
