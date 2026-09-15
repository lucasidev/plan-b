import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { describeCareerReviews } from './describe-institution-careers';

/** Las carreras que dicta una institución, para la ficha de institución (SC-005). */
export type CareerFacultyGroup = {
  name: string;
  careers: Career[];
};

/** La etiqueta del grupo cuando el catálogo todavía no vinculó una carrera a su facultad. */
export const UNASSIGNED_FACULTY_LABEL = 'Sin facultad asignada';

/**
 * Agrupa las carreras de una institución por `academicUnitName` (V.university().main de la
 * maqueta aprobada, que pone Ingeniería primero y la Tecnicatura primera adentro): primero las
 * facultades con alguna carrera con reseñas, por el mayor voiceCount de esas carreras de mayor a
 * menor; después las demás, alfabético. Adentro de cada facultad, el mismo criterio: primero las
 * carreras con reseñas por voiceCount, después alfabético. "Con reseñas" es `describeCareerReviews`
 * no nulo (la misma regla que decide la pill), y el empate en voiceCount se resuelve alfabético.
 *
 * "Sin facultad asignada" no compite en ese orden: sigue al final siempre, tenga o no carreras con
 * reseñas (no confía en el orden del input tampoco puertas adentro: alfabético entre sí).
 */
export function groupCareersByFaculty(
  careers: readonly Career[],
  coverage: readonly CareerCoverage[],
): CareerFacultyGroup[] {
  const coverageByCareerId = new Map(coverage.map((c) => [c.careerId, c]));
  const voiceCountOf = (career: Career): number =>
    coverageByCareerId.get(career.id)?.voiceCount ?? 0;
  const hasReviews = (career: Career): boolean =>
    describeCareerReviews(coverageByCareerId.get(career.id)) !== null;

  const byFaculty = new Map<string, Career[]>();
  for (const career of careers) {
    const key = career.academicUnitName ?? UNASSIGNED_FACULTY_LABEL;
    const list = byFaculty.get(key) ?? [];
    list.push(career);
    byFaculty.set(key, list);
  }

  const sortCareers = (list: Career[]) =>
    [...list].sort((a, b) => {
      const aReviewed = hasReviews(a);
      const bReviewed = hasReviews(b);
      if (aReviewed !== bReviewed) return aReviewed ? -1 : 1;
      if (aReviewed) {
        const diff = voiceCountOf(b) - voiceCountOf(a);
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });

  /** El mayor voiceCount entre las carreras con reseñas de la facultad; -1 si ninguna tiene. */
  const maxReviewedVoiceCount = (list: Career[]): number =>
    list.reduce(
      (max, career) => (hasReviews(career) ? Math.max(max, voiceCountOf(career)) : max),
      -1,
    );

  const namedGroups = [...byFaculty.entries()]
    .filter(([name]) => name !== UNASSIGNED_FACULTY_LABEL)
    .map(([name, list]) => ({
      name,
      careers: sortCareers(list),
      maxVoiceCount: maxReviewedVoiceCount(list),
    }))
    .sort((a, b) => {
      const aReviewed = a.maxVoiceCount >= 0;
      const bReviewed = b.maxVoiceCount >= 0;
      if (aReviewed !== bReviewed) return aReviewed ? -1 : 1;
      if (aReviewed) {
        const diff = b.maxVoiceCount - a.maxVoiceCount;
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    })
    .map(({ name, careers: sorted }) => ({ name, careers: sorted }));

  const unassigned = byFaculty.get(UNASSIGNED_FACULTY_LABEL);

  return unassigned
    ? [...namedGroups, { name: UNASSIGNED_FACULTY_LABEL, careers: sortCareers(unassigned) }]
    : namedGroups;
}
