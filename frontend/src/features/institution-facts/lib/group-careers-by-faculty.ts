import type { Career } from '@/features/browse-catalog';

/** Las carreras que dicta una institución, para la ficha de institución (SC-005). */
export type CareerFacultyGroup = {
  name: string;
  careers: Career[];
};

/** La etiqueta del grupo cuando el catálogo todavía no vinculó una carrera a su facultad. */
export const UNASSIGNED_FACULTY_LABEL = 'Sin facultad asignada';

/**
 * Agrupa las carreras de una institución por `academicUnitName`, alfabético por facultad y por
 * carrera dentro de cada una; las sin facultad quedan al final, bajo un grupo propio. No confía en
 * el orden del input: lo ordena acá, así la función es correcta sola y testeable sin depender de
 * que el caller ya la haya ordenado (mismo criterio que `group-careers-by-university.ts`).
 */
export function groupCareersByFaculty(careers: readonly Career[]): CareerFacultyGroup[] {
  const byFaculty = new Map<string, Career[]>();

  for (const career of careers) {
    const key = career.academicUnitName ?? UNASSIGNED_FACULTY_LABEL;
    const list = byFaculty.get(key) ?? [];
    list.push(career);
    byFaculty.set(key, list);
  }

  const sortByName = (list: Career[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  const namedGroups = [...byFaculty.entries()]
    .filter(([name]) => name !== UNASSIGNED_FACULTY_LABEL)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]) => ({ name, careers: sortByName(list) }));

  const unassigned = byFaculty.get(UNASSIGNED_FACULTY_LABEL);

  return unassigned
    ? [...namedGroups, { name: UNASSIGNED_FACULTY_LABEL, careers: sortByName(unassigned) }]
    : namedGroups;
}
