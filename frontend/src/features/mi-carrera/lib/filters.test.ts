import { describe, expect, it } from 'vitest';
import type { PlannedSubject } from '@/features/mi-carrera/data/plan';
import { distinctYears, emptyFilters, filterSubjects } from './filters';

type SubjectWithYear = PlannedSubject & { year: number };

const subject = (
  code: string,
  name: string,
  year: number,
  overrides: Partial<SubjectWithYear> = {},
): SubjectWithYear => ({
  code,
  name,
  year,
  modality: '1c',
  state: 'PD',
  grade: null,
  correlativas: [],
  ...overrides,
});

const fixture: SubjectWithYear[] = [
  subject('PRG101', 'Programación I', 1, { state: 'AP', grade: 9 }),
  subject('PRG102', 'Programación II', 1, { modality: '2c', state: 'AP', grade: 8 }),
  subject('MAT201', 'Análisis II', 2, { modality: 'anual', state: 'AP' }),
  subject('ISW302', 'Ingeniería de Software II', 4, { state: 'CU' }),
  subject('PFC501', 'Proyecto Final', 5, { modality: 'anual', state: 'PD' }),
];

describe('filterSubjects', () => {
  it('sin filtros devuelve todo', () => {
    expect(filterSubjects(fixture, emptyFilters)).toHaveLength(fixture.length);
  });

  it('filtra por query en el nombre (case insensitive)', () => {
    const r = filterSubjects(fixture, { ...emptyFilters, query: 'programación' });
    expect(r.map((s) => s.code)).toEqual(['PRG101', 'PRG102']);
  });

  it('filtra por query en el código', () => {
    const r = filterSubjects(fixture, { ...emptyFilters, query: 'PFC' });
    expect(r).toHaveLength(1);
    expect(r[0].code).toBe('PFC501');
  });

  it('trim del query no rompe matching', () => {
    const r = filterSubjects(fixture, { ...emptyFilters, query: '   Análisis  ' });
    expect(r).toHaveLength(1);
    expect(r[0].code).toBe('MAT201');
  });

  it('query vacía es equivalente a no filtrar', () => {
    expect(filterSubjects(fixture, { ...emptyFilters, query: '' })).toHaveLength(fixture.length);
    expect(filterSubjects(fixture, { ...emptyFilters, query: '   ' })).toHaveLength(fixture.length);
  });

  it('filtra por año', () => {
    expect(filterSubjects(fixture, { ...emptyFilters, year: 1 }).map((s) => s.code)).toEqual([
      'PRG101',
      'PRG102',
    ]);
  });

  it('filtra por modalidad', () => {
    expect(
      filterSubjects(fixture, { ...emptyFilters, modality: 'anual' }).map((s) => s.code),
    ).toEqual(['MAT201', 'PFC501']);
  });

  it('filtra por estado', () => {
    expect(filterSubjects(fixture, { ...emptyFilters, state: 'CU' }).map((s) => s.code)).toEqual([
      'ISW302',
    ]);
  });

  it('combina varios filtros con AND', () => {
    const r = filterSubjects(fixture, { ...emptyFilters, year: 1, modality: '2c' });
    expect(r.map((s) => s.code)).toEqual(['PRG102']);
  });

  it('devuelve array vacío cuando no hay matches', () => {
    expect(filterSubjects(fixture, { ...emptyFilters, query: 'inexistente' })).toEqual([]);
  });
});

describe('distinctYears', () => {
  it('devuelve años únicos ordenados ascendente', () => {
    expect(distinctYears(fixture)).toEqual([1, 2, 4, 5]);
  });

  it('devuelve array vacío sobre input vacío', () => {
    expect(distinctYears([])).toEqual([]);
  });
});
