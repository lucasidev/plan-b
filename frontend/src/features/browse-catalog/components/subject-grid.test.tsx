import { describe, expect, it } from 'vitest';
import { formatTermLabel, groupSubjectsByYear } from '../lib/group-subjects';
import type { Subject } from '../types';

/**
 * Cubre la lógica pura de agrupamiento/orden de `subject-grid.tsx` (rama "Utils" de la
 * pirámide, ADR-0036): sin DOM, sin render. `groupSubjectsByYear` es lo que decide qué
 * secciones año/término ve el visitante y en qué orden.
 */

function subject(overrides: Partial<Subject>): Subject {
  return {
    id: 'sub-id',
    careerPlanId: 'plan-id',
    code: 'AAA000',
    name: 'Materia',
    yearInPlan: 1,
    termInYear: 1,
    termKind: 'FourMonth',
    ...overrides,
  };
}

describe('groupSubjectsByYear', () => {
  it('devuelve vacío para una lista vacía', () => {
    expect(groupSubjectsByYear([])).toEqual([]);
  });

  it('agrupa por yearInPlan y ordena los años ascendente aunque el input venga desordenado', () => {
    const subjects = [
      subject({ id: '3', code: 'C300', yearInPlan: 3 }),
      subject({ id: '1', code: 'A100', yearInPlan: 1 }),
      subject({ id: '2', code: 'B200', yearInPlan: 2 }),
    ];

    const groups = groupSubjectsByYear(subjects);

    expect(groups.map((g) => g.yearInPlan)).toEqual([1, 2, 3]);
  });

  it('agrupa dentro de un año por (termInYear, termKind) y ordena los términos ascendente', () => {
    const subjects = [
      subject({ id: '2c', code: 'B200', yearInPlan: 1, termInYear: 2 }),
      subject({ id: '1c', code: 'A100', yearInPlan: 1, termInYear: 1 }),
    ];

    const [year1] = groupSubjectsByYear(subjects);

    expect(year1.terms.map((t) => t.termInYear)).toEqual([1, 2]);
  });

  it('ordena las materias de cada término por code', () => {
    const subjects = [
      subject({ id: 'b', code: 'PRG201', yearInPlan: 2, termInYear: 1 }),
      subject({ id: 'a', code: 'MAT201', yearInPlan: 2, termInYear: 1 }),
    ];

    const [year2] = groupSubjectsByYear(subjects);

    expect(year2.terms[0].subjects.map((s) => s.code)).toEqual(['MAT201', 'PRG201']);
  });

  it('agrupa las materias anuales (termInYear null) en un grupo propio, después de los términos numerados', () => {
    const subjects = [
      subject({ id: 'anual', code: 'Z900', yearInPlan: 1, termInYear: null, termKind: 'FullYear' }),
      subject({ id: 'c1', code: 'A100', yearInPlan: 1, termInYear: 1, termKind: 'FourMonth' }),
    ];

    const [year1] = groupSubjectsByYear(subjects);

    expect(year1.terms.map((t) => t.termInYear)).toEqual([1, null]);
    expect(year1.terms[1].subjects.map((s) => s.code)).toEqual(['Z900']);
  });

  it('no mezcla términos con el mismo número pero distinta cadencia', () => {
    const subjects = [
      subject({
        id: 'cuatri',
        code: 'A100',
        yearInPlan: 1,
        termInYear: 1,
        termKind: 'FourMonth',
      }),
      subject({ id: 'bim', code: 'B100', yearInPlan: 1, termInYear: 1, termKind: 'TwoMonth' }),
    ];

    const [year1] = groupSubjectsByYear(subjects);

    expect(year1.terms).toHaveLength(2);
  });
});

describe('formatTermLabel', () => {
  it('formatea cuatrimestres', () => {
    expect(formatTermLabel(1, 'FourMonth')).toBe('1er cuatrimestre');
    expect(formatTermLabel(2, 'FourMonth')).toBe('2do cuatrimestre');
  });

  it('formatea bimestres', () => {
    expect(formatTermLabel(3, 'TwoMonth')).toBe('3er bimestre');
    expect(formatTermLabel(4, 'TwoMonth')).toBe('4to bimestre');
  });

  it('formatea semestres', () => {
    expect(formatTermLabel(1, 'SixMonth')).toBe('1er semestre');
  });

  it('devuelve "Anual" para termKind Anual sin importar termInYear', () => {
    expect(formatTermLabel(null, 'FullYear')).toBe('Anual');
  });

  it('devuelve "Anual" cuando termInYear es null aunque el termKind no lo sea (defensivo)', () => {
    expect(formatTermLabel(null, 'FourMonth')).toBe('Anual');
  });
});
