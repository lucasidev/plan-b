import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';

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
