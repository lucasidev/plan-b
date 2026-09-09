import { describe, expect, it } from 'vitest';
import type { CareerCoverage, University } from '../types';
import {
  groupCareersByUniversity,
  summarizeUniversitiesCoverage,
} from './group-careers-by-university';

/**
 * US-222 (browse-catalog/stories/US-222-browse-what-there-is-to-study/scenarios.md), E3 y N1: el
 * orden es alfabético, nunca por voces ni por cobertura. Los tests fuerzan un input desordenado
 * por voces/cobertura a propósito, para que un ordenamiento accidental por esos campos caiga.
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
    ...overrides,
  };
}

describe('groupCareersByUniversity', () => {
  it('agrupa las carreras por su universityId', () => {
    const careers = [
      career({ careerId: 'a', universityId: 'unt', universityName: 'UNT' }),
      career({ careerId: 'b', universityId: 'utn', universityName: 'UTN' }),
      career({ careerId: 'c', universityId: 'unt', universityName: 'UNT' }),
    ];

    const groups = groupCareersByUniversity(careers);

    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.universityId === 'unt')?.careers.map((c) => c.careerId)).toEqual([
      'a',
      'c',
    ]);
  });

  /**
   * US-222 E3/N1: UNT (412 voces, mayor cobertura) va antes que UTN (96 voces, menor cobertura)
   * por orden alfabético de institución, no porque tenga más voces ni más cobertura. El input
   * viene con UTN primero para que un `.sort` que mire `voiceCount` en vez del nombre se note.
   */
  it('E3/N1: ordena las instituciones alfabético, no por voces ni por cobertura', () => {
    const careers = [
      career({
        careerId: 'ing-utn',
        universityId: 'utn',
        universityName: 'UTN',
        voiceCount: 96,
        totalSubjects: 44,
        coveredSubjects: 20,
      }),
      career({
        careerId: 'ing-unt',
        universityId: 'unt',
        universityName: 'UNT',
        voiceCount: 412,
        totalSubjects: 51,
        coveredSubjects: 23,
      }),
    ];

    const groups = groupCareersByUniversity(careers);

    expect(groups.map((g) => g.universityName)).toEqual(['UNT', 'UTN']);
  });

  it('ordena las carreras de cada institución alfabético, no por voces', () => {
    const careers = [
      career({ careerId: 'z', careerName: 'Zoología', voiceCount: 500 }),
      career({ careerId: 'a', careerName: 'Agronomía', voiceCount: 1 }),
    ];

    const [group] = groupCareersByUniversity(careers);

    expect(group.careers.map((c) => c.careerName)).toEqual(['Agronomía', 'Zoología']);
  });

  it('una lista vacía no rompe: sin grupos', () => {
    expect(groupCareersByUniversity([])).toEqual([]);
  });
});

describe('summarizeUniversitiesCoverage', () => {
  const unsta: University = { id: 'unsta', name: 'UNSTA', slug: 'unsta' };
  const utn: University = { id: 'utn', name: 'UTN', slug: 'utn' };

  it('cuenta las carreras de cada institución y cuántas tienen algo para leer', () => {
    const careers = [
      career({ universityId: 'unsta', hasOfficialData: true, voiceCount: 0 }),
      career({ universityId: 'unsta', hasOfficialData: false, voiceCount: 0 }),
      career({ universityId: 'unsta', hasOfficialData: false, voiceCount: 5 }),
    ];

    const [result] = summarizeUniversitiesCoverage([unsta], careers);

    expect(result.careerCount).toBe(3);
    expect(result.careersWithSomethingToRead).toBe(2);
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
    expect(utnResult?.careersWithSomethingToRead).toBe(0);
  });
});
