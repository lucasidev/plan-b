import { describe, expect, it } from 'vitest';
import type { CareerCoverage, University } from '../types';
import { summarizeUniversitiesCoverage } from './group-careers-by-university';

/**
 * US-222 (browse-catalog/stories/US-222-browse-what-there-is-to-study/scenarios.md): cuántas
 * carreras tiene cada institución y cuántas de esas tienen algo para leer, para la lente de
 * Universidades. El orden alfabético por institución, para la lente de Carreras, lo prueba
 * `group-careers-by-canonical.test.ts` (E3, N1).
 */

function career(overrides: Partial<CareerCoverage>): CareerCoverage {
  return {
    careerId: 'career-id',
    careerName: 'Carrera',
    universityId: 'uni-id',
    universityName: 'Universidad',
    isOfficial: true,
    hasOfficialData: false,
    voiceCount: 0,
    hasReviewsBelowFloor: false,
    totalSubjects: 0,
    coveredSubjects: 0,
    canonicalGroupName: null,
    ...overrides,
  };
}

describe('summarizeUniversitiesCoverage', () => {
  const unsta: University = { id: 'unsta', name: 'UNSTA', slug: 'unsta' };
  const utn: University = { id: 'utn', name: 'UTN', slug: 'utn' };

  /**
   * El bug que este test fija (ADR-0096): un dato oficial solo, sin ninguna reseña, no cuenta
   * como "con reseñas". Solo cuentan las voces publicadas o las reseñas cargándose bajo el piso.
   */
  it('cuenta las carreras de cada institución y cuántas tienen reseñas, no solo datos oficiales', () => {
    const careers = [
      career({ universityId: 'unsta', hasOfficialData: true, voiceCount: 0 }),
      career({
        universityId: 'unsta',
        hasOfficialData: false,
        voiceCount: 0,
        hasReviewsBelowFloor: true,
      }),
      career({ universityId: 'unsta', hasOfficialData: false, voiceCount: 5 }),
    ];

    const [result] = summarizeUniversitiesCoverage([unsta], careers);

    expect(result.careerCount).toBe(3);
    expect(result.careersWithReviews).toBe(2);
  });

  /**
   * Una institución sin ninguna carrera en el catálogo de cobertura (porque no le cargaron
   * ninguna) sigue en la lista con cero, no desaparece: viene de la lista completa de
   * universidades, no de las que `careers` menciona.
   */
  it('una institución sin carreras cargadas queda en la lista con cero, no falta', () => {
    const careers = [career({ universityId: 'unsta' })];

    const result = summarizeUniversitiesCoverage([unsta, utn], careers);

    const utnResult = result.find((r) => r.id === 'utn');
    expect(utnResult).toBeDefined();
    expect(utnResult?.careerCount).toBe(0);
    expect(utnResult?.careersWithReviews).toBe(0);
  });
});
