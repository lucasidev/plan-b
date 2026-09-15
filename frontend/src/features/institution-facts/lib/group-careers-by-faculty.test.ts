import { describe, expect, it } from 'vitest';
import type { Career, CareerCoverage } from '@/features/browse-catalog';
import { groupCareersByFaculty } from './group-careers-by-faculty';

function career(overrides: Partial<Career> & { id: string }): Career {
  return {
    universityId: 'unsta',
    name: 'Carrera',
    slug: 'carrera',
    isOfficial: true,
    academicUnitName: null,
    ...overrides,
  };
}

function coverage(overrides: Partial<CareerCoverage> & { careerId: string }): CareerCoverage {
  return {
    careerName: 'Carrera',
    universityId: 'unsta',
    universityName: 'UNSTA',
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

describe('groupCareersByFaculty', () => {
  it('agrupa las carreras por academicUnitName', () => {
    const careers = [
      career({ id: 'a', name: 'Ingeniería en Sistemas', academicUnitName: 'Cs. Exactas' }),
      career({ id: 'b', name: 'Abogacía', academicUnitName: 'Derecho' }),
      career({ id: 'c', name: 'Ingeniería Civil', academicUnitName: 'Cs. Exactas' }),
    ];

    const groups = groupCareersByFaculty(careers, []);

    expect(groups.map((g) => g.name)).toEqual(['Cs. Exactas', 'Derecho']);
    expect(groups.find((g) => g.name === 'Cs. Exactas')?.careers.map((c) => c.id)).toEqual([
      'c',
      'a',
    ]);
  });

  /** Las carreras que el catálogo todavía no vinculó a una facultad van al final, bajo su propio grupo. */
  it('las carreras sin facultad van al final, bajo "Sin facultad asignada"', () => {
    const careers = [
      career({ id: 'a', name: 'Zoología', academicUnitName: null }),
      career({ id: 'b', name: 'Abogacía', academicUnitName: 'Derecho' }),
    ];

    const groups = groupCareersByFaculty(careers, []);

    expect(groups.map((g) => g.name)).toEqual(['Derecho', 'Sin facultad asignada']);
  });

  it('sin ninguna carrera sin facultad, no agrega el grupo "Sin facultad asignada"', () => {
    const groups = groupCareersByFaculty([career({ id: 'a', academicUnitName: 'Derecho' })], []);

    expect(groups.map((g) => g.name)).not.toContain('Sin facultad asignada');
  });

  it('sin ninguna carrera con reseñas en ninguna facultad, ordena alfabético (nunca por conveniencia)', () => {
    const careers = [
      career({ id: 'z', name: 'Zoología', academicUnitName: 'Zoo' }),
      career({ id: 'a', name: 'Agronomía', academicUnitName: 'Agro' }),
    ];

    const groups = groupCareersByFaculty(careers, []);

    expect(groups.map((g) => g.name)).toEqual(['Agro', 'Zoo']);
  });

  it('una lista vacía no rompe: sin grupos', () => {
    expect(groupCareersByFaculty([], [])).toEqual([]);
  });

  /**
   * Orden real (V.university().main de la maqueta aprobada): Ingeniería, la única facultad con
   * una carrera con reseñas, va primero aunque "Ciencias Jurídicas" la gane en alfabético.
   */
  it('la facultad con alguna carrera con reseñas va antes que las que no tienen ninguna', () => {
    const careers = [
      career({ id: 'tudcs', name: 'Tecnicatura', academicUnitName: 'Facultad de Ingeniería' }),
      career({
        id: 'abogacia',
        name: 'Abogado',
        academicUnitName: 'Facultad de Ciencias Jurídicas',
      }),
    ];
    const coverageList = [coverage({ careerId: 'tudcs', voiceCount: 137 })];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups.map((g) => g.name)).toEqual([
      'Facultad de Ingeniería',
      'Facultad de Ciencias Jurídicas',
    ]);
  });

  it('entre facultades con reseñas, ordena por el mayor voiceCount de sus carreras, de mayor a menor', () => {
    const careers = [
      career({ id: 'a', academicUnitName: 'Facultad A' }),
      career({ id: 'b', academicUnitName: 'Facultad B' }),
    ];
    const coverageList = [
      coverage({ careerId: 'a', voiceCount: 10 }),
      coverage({ careerId: 'b', voiceCount: 50 }),
    ];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups.map((g) => g.name)).toEqual(['Facultad B', 'Facultad A']);
  });

  it('entre facultades con el mismo voiceCount máximo, alfabético', () => {
    const careers = [
      career({ id: 'a', academicUnitName: 'Facultad Z' }),
      career({ id: 'b', academicUnitName: 'Facultad A' }),
    ];
    const coverageList = [
      coverage({ careerId: 'a', voiceCount: 10 }),
      coverage({ careerId: 'b', voiceCount: 10 }),
    ];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups.map((g) => g.name)).toEqual(['Facultad A', 'Facultad Z']);
  });

  /** Dentro de la facultad, la Tecnicatura (la única con reseñas) va primera aunque no le toque alfabéticamente. */
  it('adentro de una facultad, las carreras con reseñas van primero, por voiceCount de mayor a menor', () => {
    const careers = [
      career({ id: 'abogacia', name: 'Abogado', academicUnitName: 'Facultad de Ingeniería' }),
      career({ id: 'tudcs', name: 'Tecnicatura', academicUnitName: 'Facultad de Ingeniería' }),
      career({
        id: 'informatica',
        name: 'Ingeniería en Informática',
        academicUnitName: 'Facultad de Ingeniería',
      }),
    ];
    const coverageList = [coverage({ careerId: 'tudcs', voiceCount: 137 })];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups[0].careers.map((c) => c.id)).toEqual(['tudcs', 'abogacia', 'informatica']);
  });

  it('adentro de una facultad, empate en voiceCount se resuelve alfabético', () => {
    const careers = [
      career({ id: 'z', name: 'Zoología', academicUnitName: 'Facultad' }),
      career({ id: 'a', name: 'Agronomía', academicUnitName: 'Facultad' }),
    ];
    const coverageList = [
      coverage({ careerId: 'z', voiceCount: 10 }),
      coverage({ careerId: 'a', voiceCount: 10 }),
    ];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups[0].careers.map((c) => c.id)).toEqual(['a', 'z']);
  });

  /** "Con reseñas" es la misma regla que decide la pill: describeCareerReviews no nulo, no solo voiceCount. */
  it('"con reseñas" también cuenta la carga bajo el piso (hasReviewsBelowFloor), no solo voiceCount', () => {
    const careers = [
      career({ id: 'a', name: 'Sin nada', academicUnitName: 'Facultad' }),
      career({ id: 'b', name: 'Bajo el piso', academicUnitName: 'Facultad' }),
    ];
    const coverageList = [coverage({ careerId: 'b', voiceCount: 0, hasReviewsBelowFloor: true })];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups[0].careers.map((c) => c.id)).toEqual(['b', 'a']);
  });

  /** "Sin facultad asignada" no compite en el orden por reseñas: sigue al final aunque junte más voces que cualquier otra. */
  it('"Sin facultad asignada" sigue al final aunque tenga la carrera más reseñada', () => {
    const careers = [
      career({ id: 'huerfana', name: 'Carrera huérfana', academicUnitName: null }),
      career({ id: 'derecho', name: 'Abogado', academicUnitName: 'Derecho' }),
    ];
    const coverageList = [coverage({ careerId: 'huerfana', voiceCount: 9999 })];

    const groups = groupCareersByFaculty(careers, coverageList);

    expect(groups.map((g) => g.name)).toEqual(['Derecho', 'Sin facultad asignada']);
  });
});
