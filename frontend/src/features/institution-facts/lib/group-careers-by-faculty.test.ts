import { describe, expect, it } from 'vitest';
import type { Career } from '@/features/browse-catalog';
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

describe('groupCareersByFaculty', () => {
  it('agrupa las carreras por academicUnitName', () => {
    const careers = [
      career({ id: 'a', name: 'Ingeniería en Sistemas', academicUnitName: 'Cs. Exactas' }),
      career({ id: 'b', name: 'Abogacía', academicUnitName: 'Derecho' }),
      career({ id: 'c', name: 'Ingeniería Civil', academicUnitName: 'Cs. Exactas' }),
    ];

    const groups = groupCareersByFaculty(careers);

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

    const groups = groupCareersByFaculty(careers);

    expect(groups.map((g) => g.name)).toEqual(['Derecho', 'Sin facultad asignada']);
  });

  it('sin ninguna carrera sin facultad, no agrega el grupo "Sin facultad asignada"', () => {
    const groups = groupCareersByFaculty([career({ id: 'a', academicUnitName: 'Derecho' })]);

    expect(groups.map((g) => g.name)).not.toContain('Sin facultad asignada');
  });

  it('ordena las facultades y las carreras alfabético, nunca por voces ni por conveniencia', () => {
    const careers = [
      career({ id: 'z', name: 'Zoología', academicUnitName: 'Zoo' }),
      career({ id: 'a', name: 'Agronomía', academicUnitName: 'Agro' }),
    ];

    const groups = groupCareersByFaculty(careers);

    expect(groups.map((g) => g.name)).toEqual(['Agro', 'Zoo']);
  });

  it('una lista vacía no rompe: sin grupos', () => {
    expect(groupCareersByFaculty([])).toEqual([]);
  });
});
