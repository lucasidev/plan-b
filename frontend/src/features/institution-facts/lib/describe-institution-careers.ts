import type { CareerCoverage } from '@/features/browse-catalog';

/**
 * Cuánto dice la ficha de institución de una carrera puntual, en "Facultades y carreras" y en
 * "Por dónde empezar" (SC-005): "reseñas" cuando hay voces publicadas (ya respeta el piso), "con
 * reseñas" cuando hay carga que todavía no lo cruza, y nada cuando no hay ninguna señal.
 */
export function describeCareerReviews(coverage: CareerCoverage | undefined): string | null {
  if (!coverage) return null;
  if (coverage.voiceCount > 0) {
    return `${coverage.voiceCount} ${coverage.voiceCount === 1 ? 'reseña' : 'reseñas'}`;
  }
  if (coverage.hasReviewsBelowFloor) {
    return 'con reseñas';
  }
  return null;
}
