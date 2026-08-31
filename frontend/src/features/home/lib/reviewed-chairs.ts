import type { MyCourseReview } from '@/features/my-course-reviews/types';

/**
 * Una cátedra que esta cuenta reseñó, como la muestra Inicio (US-231).
 *
 * `voices` sigue siendo nullable aunque el endpoint exista: si `GET /api/reviews/chairs/mine`
 * degradó por la carrera del guard, la fila se dibuja igual con el conteo ausente en vez de con un
 * cero, que diría que la cátedra no tiene reseñas cuando puede tener doce.
 */
export type ReviewedChair = {
  chairId: string;
  chairName: string;
  subjectName: string;
  /** El período de la cursada más reciente que esta cuenta reseñó de esa cátedra. */
  termLabel: string;
  /** Cuántas cursadas propias hay en esa cátedra. Es un conteo de lo mío, no de la cátedra. */
  ownReviews: number;
  /** Cuántas voces junta la cátedra entera. `null` si el conteo no llegó. */
  voices: number | null;
  /** Si ya cruzó el piso de 10. `null` cuando no hay conteo del que decidirlo. */
  isPublished: boolean | null;
  /** Cuántas le faltan para publicar. 0 si ya publica, `null` sin conteo. */
  missingToPublish: number | null;
};

/**
 * Agrupa mis reseñas por cátedra. Una cuenta puede haber reseñado dos cursadas de la misma
 * cátedra (recursó, o cursó dos materias con el mismo equipo), y en Inicio eso es una sola fila:
 * lo que la pantalla contesta es qué pasó con cada cátedra, no con cada cursada.
 *
 * Las reseñas sin cátedra ("no sé cuál me tocó", que el formulario permite) no producen fila:
 * no hay sujeto del que decir si publica.
 */
export function groupByChair(
  reviews: readonly MyCourseReview[],
  tallies: ReadonlyMap<
    string,
    { reviewCount: number; isPublished: boolean; reviewsMissingToPublish: number }
  > = new Map(),
): ReviewedChair[] {
  const byChair = new Map<string, ReviewedChair & { latest: string }>();

  for (const review of reviews) {
    if (!review.chairId || !review.chairName) continue;

    const found = byChair.get(review.chairId);
    if (!found) {
      byChair.set(review.chairId, {
        chairId: review.chairId,
        chairName: review.chairName,
        subjectName: review.subjectName,
        termLabel: review.termLabel,
        ownReviews: 1,
        voices: tallies.get(review.chairId)?.reviewCount ?? null,
        isPublished: tallies.get(review.chairId)?.isPublished ?? null,
        missingToPublish: tallies.get(review.chairId)?.reviewsMissingToPublish ?? null,
        latest: review.createdAt,
      });
      continue;
    }

    found.ownReviews += 1;
    // El período que se muestra es el de la cursada reseñada más recientemente, no el primero
    // que llegó en la lista: el orden del endpoint no es parte de su contrato.
    if (review.createdAt > found.latest) {
      found.latest = review.createdAt;
      found.termLabel = review.termLabel;
      found.subjectName = review.subjectName;
    }
  }

  return [...byChair.values()]
    .map(({ latest: _latest, ...chair }) => chair)
    .sort((a, b) => a.chairName.localeCompare(b.chairName, 'es'));
}
