import { describe, expect, it } from 'vitest';
import type { Career } from '@/features/browse-catalog';
import { describeInstitutionCareers, describeMeasuredCareers } from './describe-institution-header';

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

describe('describeInstitutionCareers', () => {
  it('sin carreras, no hay nada que contar', () => {
    expect(describeInstitutionCareers([])).toBeNull();
  });

  it('con todas las unidades llamadas facultad, la cuenta dice "facultades"', () => {
    const careers = [
      career({ id: 'a', academicUnitName: 'Facultad de Ingeniería' }),
      career({ id: 'b', academicUnitName: 'Facultad de Ingeniería' }),
      career({ id: 'c', academicUnitName: 'Facultad de Humanidades' }),
    ];

    expect(describeInstitutionCareers(careers)).toBe('3 carreras en 2 facultades.');
  });

  /**
   * Regla central: si alguna unidad académica no es una facultad (un centro regional, por
   * ejemplo), la cuenta nunca le pone "facultad" a ninguna, ni siquiera a las que sí lo son.
   */
  it('con una unidad que no es facultad, la cuenta dice "unidades académicas"', () => {
    const careers = [
      career({ id: 'a', academicUnitName: 'Facultad de Ingeniería' }),
      career({ id: 'b', academicUnitName: 'Centro Universitario Concepción' }),
    ];

    expect(describeInstitutionCareers(careers)).toBe('2 carreras en 2 unidades académicas.');
  });

  it('singular de carrera y de facultad', () => {
    const careers = [career({ id: 'a', academicUnitName: 'Facultad de Ingeniería' })];

    expect(describeInstitutionCareers(careers)).toBe('1 carrera en 1 facultad.');
  });

  it('singular de unidad académica cuando esa única unidad no es facultad', () => {
    const careers = [career({ id: 'a', academicUnitName: 'Centro Universitario Concepción' })];

    expect(describeInstitutionCareers(careers)).toBe('1 carrera en 1 unidad académica.');
  });

  it('las carreras sin unidad asignada no cuentan como una unidad', () => {
    const careers = [
      career({ id: 'a', academicUnitName: 'Facultad de Ingeniería' }),
      career({ id: 'b', academicUnitName: null }),
    ];

    expect(describeInstitutionCareers(careers)).toBe('2 carreras en 1 facultad.');
  });
});

describe('describeMeasuredCareers', () => {
  it('sin ninguna carrera medida, no hay nada que decir', () => {
    expect(describeMeasuredCareers([])).toBeNull();
  });

  it('con una sola, la nombra', () => {
    expect(
      describeMeasuredCareers([{ careerName: 'Tecnicatura en Desarrollo y Calidad de Software' }]),
    ).toBe('Una carrera medida: la Tecnicatura en Desarrollo y Calidad de Software.');
  });

  it('con varias, la cantidad en palabras, capitalizada al empezar la oración', () => {
    expect(
      describeMeasuredCareers([
        { careerName: 'Abogacía' },
        { careerName: 'Contador Público' },
        { careerName: 'Ingeniería en Informática' },
      ]),
    ).toBe('Tres carreras medidas.');
  });

  it('más allá de diez, usa el número: no rompe con el dígito tal cual', () => {
    const careers = Array.from({ length: 11 }, (_, i) => ({ careerName: `Carrera ${i}` }));

    expect(describeMeasuredCareers(careers)).toBe('11 carreras medidas.');
  });
});
