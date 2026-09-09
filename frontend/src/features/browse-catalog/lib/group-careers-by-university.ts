import type { CareerCoverage, University, UniversityWithCoverage } from '../types';
import { hasSomethingToRead } from './describe-career-coverage';

/** Las carreras de una institución, para la lente de Carreras (US-222): agrupa sin ordenar por cobertura ni voces. */
export type CareerUniversityGroup = {
  universityId: string;
  universityName: string;
  careers: CareerCoverage[];
};

/**
 * Agrupa el catálogo entero de carreras por institución, alfabético por institución y por carrera
 * dentro de cada una (US-171: nunca por cobertura, voces ni conveniencia). No confía en el orden
 * del input: lo ordena acá, así la función es correcta sola y testeable sin depender de que el
 * caller ya la haya ordenado.
 */
export function groupCareersByUniversity(
  careers: readonly CareerCoverage[],
): CareerUniversityGroup[] {
  const groups = new Map<string, CareerUniversityGroup>();

  for (const career of careers) {
    let group = groups.get(career.universityId);
    if (!group) {
      group = {
        universityId: career.universityId,
        universityName: career.universityName,
        careers: [],
      };
      groups.set(career.universityId, group);
    }
    group.careers.push(career);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      careers: [...group.careers].sort((a, b) => a.careerName.localeCompare(b.careerName)),
    }))
    .sort((a, b) => a.universityName.localeCompare(b.universityName));
}

/**
 * Cuántas carreras tiene cada institución y cuántas de esas tienen algo para leer (US-222): la
 * lente de Universidades. Parte de la lista completa de instituciones (no de las agrupadas) para
 * que una institución sin ninguna carrera cargada todavía siga en la lista con cero, en vez de
 * faltar porque no tiene filas en `careers`.
 */
export function summarizeUniversitiesCoverage(
  universities: readonly University[],
  careers: readonly CareerCoverage[],
): UniversityWithCoverage[] {
  const byUniversity = groupCareersByUniversity(careers);
  const groupById = new Map(byUniversity.map((group) => [group.universityId, group]));

  return universities.map((university) => {
    const group = groupById.get(university.id);
    const universityCareers = group?.careers ?? [];
    return {
      ...university,
      careerCount: universityCareers.length,
      careersWithSomethingToRead: universityCareers.filter(hasSomethingToRead).length,
    };
  });
}
