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

/**
 * El estado de una cátedra que esta cuenta reseñó, tal como lo devuelve
 * `GET /api/reviews/chairs/mine` (US-231).
 *
 * `reviewCount` es de la cátedra entera, no de lo que aportó quien pregunta: es el número que la
 * hace publicar, y el mismo que su ficha pública muestra.
 */
export type MyReviewedChairTally = {
  chairId: string;
  reviewCount: number;
  isPublished: boolean;
  reviewsMissingToPublish: number;
};

/**
 * Las voces de cada cátedra que esta cuenta reseñó. Devuelve un `Map` porque el consumidor lo usa
 * para cruzar contra las filas que ya trajo `/api/reviews/courses/me`: el nombre de la cátedra y
 * la materia salen de ahí, así que este read no toca el catálogo.
 *
 * Degrada a mapa vacío en 401, igual que `fetchMyReviewsServer`: el layout y la page
 * renderizan en paralelo, así que este fetch puede salir sin sesión mientras el guard redirige, y
 * eso es una carrera y no una falla. El resto de los status suben.
 */
export async function fetchMyReviewedChairTalliesServer(): Promise<
  Map<string, MyReviewedChairTally>
> {
  const response = await apiFetchAuthenticated('/api/reviews/chairs/mine', {
    cache: 'no-store',
  });

  if (response.status === 401) {
    return new Map();
  }

  if (!response.ok) {
    throw new Error(`My reviewed chairs fetch failed: ${response.status}`);
  }

  const tallies = (await response.json()) as MyReviewedChairTally[];
  return new Map(tallies.map((tally) => [tally.chairId, tally]));
}

/**
 * Una cátedra de la carrera declarada a una reseña de cruzar el piso de publicación (US-231,
 * bloque "Tu reseña la publica"), tal como la devuelve
 * `GET /api/reviews/careers/{careerId}/chairs-near-floor`.
 */
export type ChairNearFloor = {
  chairId: string;
  chairName: string;
  subjectId: string;
  subjectName: string;
  reviewCount: number;
};

/**
 * Las cátedras de una carrera a una reseña de publicar. Agregado público (`AllowAnonymous` en el
 * backend); se pide igual con `apiFetchAuthenticated` porque reenvía la cookie de sesión cuando
 * existe, mismo criterio que `browse-catalog/api.server.ts`.
 */
export async function fetchChairsNearFloorServer(careerId: string): Promise<ChairNearFloor[]> {
  const response = await apiFetchAuthenticated(
    `/api/reviews/careers/${careerId}/chairs-near-floor`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Chairs near floor fetch failed: ${response.status}`);
  }

  return (await response.json()) as ChairNearFloor[];
}
