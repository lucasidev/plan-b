import { describe, expect, it } from 'vitest';
import type { Subject } from '@/features/browse-catalog';
import { groupSubjectsByYearOnly } from './group-subjects-by-year';

function subject(overrides: Partial<Subject> & { id: string }): Subject {
  return {
    careerPlanId: 'plan-1',
    code: '101',
    name: 'Materia',
    yearInPlan: 1,
    termInYear: 1,
    termKind: 'FourMonth',
    ...overrides,
  };
}

describe('groupSubjectsByYearOnly', () => {
  it('sin materias, no hay grupos', () => {
    expect(groupSubjectsByYearOnly([])).toEqual([]);
  });

  it('agrupa solo por año, sin importar el término', () => {
    const groups = groupSubjectsByYearOnly([
      subject({ id: 'a', yearInPlan: 1, termInYear: 1, code: '101' }),
      subject({ id: 'b', yearInPlan: 1, termInYear: 2, code: '102' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].yearInPlan).toBe(1);
    expect(groups[0].subjects.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('ordena los años ascendente, sin depender del orden de entrada', () => {
    const groups = groupSubjectsByYearOnly([
      subject({ id: 'y3', yearInPlan: 3, code: '311' }),
      subject({ id: 'y1', yearInPlan: 1, code: '101' }),
      subject({ id: 'y2', yearInPlan: 2, code: '201' }),
    ]);

    expect(groups.map((g) => g.yearInPlan)).toEqual([1, 2, 3]);
  });

  it('dentro de cada año, ordena por código', () => {
    const groups = groupSubjectsByYearOnly([
      subject({ id: 'b', yearInPlan: 1, code: '123' }),
      subject({ id: 'a', yearInPlan: 1, code: '101' }),
    ]);

    expect(groups[0].subjects.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
