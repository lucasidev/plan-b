import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { MyCourseReview } from './types';

/**
 * Lo que esta cuenta aportó. La cuenta sale de la sesión, nunca de un parámetro: si este read
 * aceptara un id de cuenta, cualquiera podría leer lo que reseñó otro.
 */
export async function fetchMyCourseReviewsServer(): Promise<MyCourseReview[]> {
  const response = await apiFetchAuthenticated('/api/reviews/cursadas/me', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`My course reviews fetch failed: ${response.status}`);
  }

  return (await response.json()) as MyCourseReview[];
}
