import type { CareerCoverage, University, UniversityWithCoverage } from '../types';
import { hasReviews } from './describe-career-coverage';

/**
 * Cuántas carreras tiene cada institución y cuántas de esas tienen reseñas (US-222, ADR-0096): la
 * lente de Universidades. Datos oficiales solos no cuentan como "con reseñas" (ver `hasReviews`).
 * Parte de la lista completa de instituciones (no de las que aparecen en `careers`) para que una
 * institución sin ninguna carrera cargada todavía siga en la lista con cero, en vez de faltar. No
 * ordena: el orden de la lista lo decide quien arma la pantalla.
 */
export function summarizeUniversitiesCoverage(
  universities: readonly University[],
  careers: readonly CareerCoverage[],
): UniversityWithCoverage[] {
  const byUniversityId = new Map<string, CareerCoverage[]>();
  for (const career of careers) {
    const list = byUniversityId.get(career.universityId);
    if (list) {
      list.push(career);
    } else {
      byUniversityId.set(career.universityId, [career]);
    }
  }

  return universities.map((university) => {
    const universityCareers = byUniversityId.get(university.id) ?? [];
    return {
      ...university,
      careerCount: universityCareers.length,
      careersWithReviews: universityCareers.filter(hasReviews).length,
    };
  });
}
