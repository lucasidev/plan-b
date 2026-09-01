import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { MyReview } from './types';

/**
 * Lo que esta cuenta aportó. La cuenta sale de la sesión, nunca de un parámetro: si este read
 * aceptara un id de cuenta, cualquiera podría leer lo que reseñó otro.
 */
export async function fetchMyReviewsServer(): Promise<MyReview[]> {
  const response = await apiFetchAuthenticated('/api/reviews/courses/me', {
    cache: 'no-store',
  });

  // El 401 no es una falla: es la carrera entre el guard y la page. En App Router el layout y la
  // page renderizan en paralelo, así que el `redirect()` de `(member)/layout.tsx` no impide que
  // este fetch ya haya salido sin sesión. Tirar acá convierte esa carrera en un 500 en la
  // pantalla que el guard estaba por dejar atrás. Mismo criterio que `lib/student-profile.ts`.
  if (response.status === 401) {
    return [];
  }

  // El resto sí son fallas y suben: un 500 del backend tiene que llegar a la pantalla de Error
  // (SC-023), no disfrazarse de "no reseñaste nada".
  if (!response.ok) {
    throw new Error(`My course reviews fetch failed: ${response.status}`);
  }

  return (await response.json()) as MyReview[];
}
