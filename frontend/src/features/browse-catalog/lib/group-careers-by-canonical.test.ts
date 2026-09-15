import { describe, expect, it } from 'vitest';
import type { CareerCoverage } from '../types';
import { groupCareersByCanonical } from './group-careers-by-canonical';

/**
 * US-222 (browse-catalog/stories/US-222-browse-what-there-is-to-study/scenarios.md) E3, N1 y
 * ADR-0096: la lente de Carreras separa lo que se dicta en más de una institución (para comparar
 * lado a lado) de lo que no, siempre alfabético, nunca por voces ni por cobertura.
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

describe('groupCareersByCanonical', () => {
  it('un grupo canónico con dos instituciones distintas va a multiInstitution', () => {
    const careers = [
      career({
        careerId: 'unsta-tudcs',
        universityId: 'unsta',
        universityName: 'UNSTA',
        canonicalGroupName: 'Tecnicatura o técnico en programación',
      }),
      career({
        careerId: 'unt-programador',
        universityId: 'unt',
        universityName: 'UNT',
        canonicalGroupName: 'Tecnicatura o técnico en programación',
      }),
    ];

    const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);

    expect(multiInstitution).toHaveLength(1);
    expect(multiInstitution[0].canonicalGroupName).toBe('Tecnicatura o técnico en programación');
    expect(multiInstitution[0].offerings.map((o) => o.careerId)).toEqual([
      'unsta-tudcs',
      'unt-programador',
    ]);
    expect(singleInstitution).toHaveLength(0);
  });

  /** Un grupo canónico declarado pero con una sola institución real no tiene con qué comparar: cae a la segunda sección. */
  it('un grupo canónico con una sola institución cae a singleInstitution, no a multiInstitution', () => {
    const careers = [
      career({
        careerId: 'solitaria',
        careerName: 'Solitaria',
        universityId: 'unsta',
        canonicalGroupName: 'Grupo con una sola oferta cargada',
      }),
    ];

    const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);

    expect(multiInstitution).toHaveLength(0);
    expect(singleInstitution.map((c) => c.careerId)).toEqual(['solitaria']);
  });

  it('una carrera sin grupo canónico (null) va a singleInstitution', () => {
    const careers = [career({ careerId: 'sin-grupo', canonicalGroupName: null })];

    const { multiInstitution, singleInstitution } = groupCareersByCanonical(careers);

    expect(multiInstitution).toHaveLength(0);
    expect(singleInstitution.map((c) => c.careerId)).toEqual(['sin-grupo']);
  });

  /**
   * US-222 E3, N1: el orden es siempre alfabético, nunca por voces ni por cobertura. El input
   * viene desordenado a propósito (mayor voiceCount primero) para que un `.sort` accidental por
   * ese campo se note.
   */
  it('E3, N1: multiInstitution ordena alfabético por nombre canónico y por institución, no por voces', () => {
    const careers = [
      career({
        careerId: 'z-b',
        careerName: 'Zoología B',
        universityId: 'utn',
        universityName: 'UTN',
        canonicalGroupName: 'Zoología',
        voiceCount: 500,
      }),
      career({
        careerId: 'z-a',
        careerName: 'Zoología A',
        universityId: 'unt',
        universityName: 'UNT',
        canonicalGroupName: 'Zoología',
        voiceCount: 1,
      }),
      career({
        careerId: 'a-b',
        universityId: 'utn',
        universityName: 'UTN',
        canonicalGroupName: 'Agronomía',
        voiceCount: 999,
      }),
      career({
        careerId: 'a-a',
        universityId: 'unsta',
        universityName: 'UNSTA',
        canonicalGroupName: 'Agronomía',
        voiceCount: 0,
      }),
    ];

    const { multiInstitution } = groupCareersByCanonical(careers);

    expect(multiInstitution.map((g) => g.canonicalGroupName)).toEqual(['Agronomía', 'Zoología']);
    expect(multiInstitution[1].offerings.map((o) => o.universityName)).toEqual(['UNT', 'UTN']);
  });

  it('singleInstitution ordena alfabético por nombre de carrera, no por voces', () => {
    const careers = [
      career({ careerId: 'z', careerName: 'Zoología', voiceCount: 500, canonicalGroupName: null }),
      career({ careerId: 'a', careerName: 'Agronomía', voiceCount: 1, canonicalGroupName: null }),
    ];

    const { singleInstitution } = groupCareersByCanonical(careers);

    expect(singleInstitution.map((c) => c.careerName)).toEqual(['Agronomía', 'Zoología']);
  });

  it('una lista vacía no rompe: sin grupos', () => {
    expect(groupCareersByCanonical([])).toEqual({ multiInstitution: [], singleInstitution: [] });
  });
});
