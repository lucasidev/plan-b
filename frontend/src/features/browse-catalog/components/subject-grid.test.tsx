import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { groupSubjectsByYear } from '../lib/group-subjects';
import type { Subject } from '../types';
import { SubjectGrid } from './subject-grid';

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

  /**
   * Contrato: una materia puede venir sin `termKind` (además de sin `termInYear`, ya cubierto por
   * las anuales). Va a un grupo propio dentro de su año, sin título de cuatrimestre: distinto del
   * grupo anual (`termKind: 'FullYear'`), que sí tiene su propio título ("anual").
   */
  it('agrupa las materias sin tipo de cursada en un grupo propio, aparte del anual', () => {
    const subjects = [
      subject({ id: 'sin-cadencia', code: null, yearInPlan: 1, termInYear: null, termKind: null }),
      subject({ id: 'anual', code: 'Z900', yearInPlan: 1, termInYear: null, termKind: 'FullYear' }),
      subject({ id: 'c1', code: 'A100', yearInPlan: 1, termInYear: 1, termKind: 'FourMonth' }),
    ];

    const [year1] = groupSubjectsByYear(subjects);

    expect(year1.terms).toHaveLength(3);
    const withoutKind = year1.terms.find((t) => t.termKind === null);
    expect(withoutKind?.subjects.map((s) => s.id)).toEqual(['sin-cadencia']);
  });

  /**
   * Anual y sin cadencia comparten `termInYear: null`, así que ese campo solo no alcanza para
   * ordenarlos entre sí. El grupo sin cadencia va último: no hay dato que lo ubique en el año,
   * ni siquiera "corre todo el año" como el anual.
   */
  it('ubica el grupo sin cadencia después del anual, sin importar el orden del input', () => {
    const subjects = [
      subject({ id: 'sin-cadencia', code: null, yearInPlan: 1, termInYear: null, termKind: null }),
      subject({ id: 'anual', code: 'Z900', yearInPlan: 1, termInYear: null, termKind: 'FullYear' }),
      subject({ id: 'c1', code: 'A100', yearInPlan: 1, termInYear: 1, termKind: 'FourMonth' }),
    ];

    const [year1] = groupSubjectsByYear(subjects);

    expect(year1.terms.map((t) => t.termKind)).toEqual(['FourMonth', 'FullYear', null]);
  });
});

describe('SubjectGrid, cuánto junta cada materia (US-134, SC-018)', () => {
  const covered = subject({ id: 'covered', code: 'A100', name: 'Con ficha' });
  const uncovered = subject({ id: 'uncovered', code: 'B200', name: 'Sin ficha todavía' });

  function coverageMap(
    entries: [string, { reviewCount: number; chairCount: number; isCovered: boolean }][],
  ) {
    return new Map(entries.map(([id, c]) => [id, { subjectId: id, ...c }]));
  }

  it('la materia con cobertura dice cuántas cátedras y reseñas junta, en negrita', () => {
    render(
      <SubjectGrid
        subjects={[covered, uncovered]}
        subjectCoverage={coverageMap([
          ['covered', { reviewCount: 28, chairCount: 3, isCovered: true }],
        ])}
      />,
    );

    const coveredCard = screen.getByRole('link', { name: /con ficha/i });
    const uncoveredCard = screen.getByRole('link', { name: /sin ficha todavía/i });

    expect(within(coveredCard).getByText('28 reseñas en 3 cátedras')).toHaveClass('font-semibold');
    expect(within(uncoveredCard).getByText('sin reseñas')).toBeInTheDocument();
  });

  it('con reseñas pero sin cruzar el piso, dice el conteo sin negrita', () => {
    render(
      <SubjectGrid
        subjects={[covered, uncovered]}
        subjectCoverage={coverageMap([
          ['covered', { reviewCount: 4, chairCount: 1, isCovered: false }],
        ])}
      />,
    );

    const coveredCard = screen.getByRole('link', { name: /con ficha/i });
    const text = within(coveredCard).getByText('4 reseñas en 1 cátedra');
    expect(text).not.toHaveClass('font-semibold');
  });

  it('sin subjectCoverage, todas las materias dicen "sin reseñas"', () => {
    render(<SubjectGrid subjects={[covered, uncovered]} />);

    expect(screen.getAllByText('sin reseñas')).toHaveLength(2);
  });
});

/**
 * El grupo sin cadencia (termKind null) no tiene título propio para separarse visualmente: el
 * borde superior es lo único que evita que sus materias se lean como parte del grupo anterior. Sin
 * grupo anterior en el mismo año (plan entero sin cuatrimestres, como UNSTA y UTN), ese borde
 * quedaría pegado debajo de "Año N" sin separar nada, así que no va.
 */
describe('SubjectGrid, el borde del grupo sin cadencia', () => {
  it('aparece cuando el grupo sin cadencia tiene otro grupo antes en el mismo año', () => {
    render(
      <SubjectGrid
        subjects={[
          subject({
            id: 'con-cadencia',
            code: 'A100',
            name: 'Con cadencia',
            yearInPlan: 1,
            termInYear: 1,
            termKind: 'FourMonth',
          }),
          subject({
            id: 'sin-cadencia',
            code: null,
            name: 'Sin cadencia',
            yearInPlan: 1,
            termInYear: null,
            termKind: null,
          }),
        ]}
      />,
    );

    const card = screen.getByRole('link', { name: /sin cadencia/i });
    const termGroup = card.parentElement?.parentElement;
    expect(termGroup).toHaveClass('border-t', 'border-line', 'pt-4');
  });

  it('no aparece cuando el grupo sin cadencia es el único del año', () => {
    render(
      <SubjectGrid
        subjects={[
          subject({
            id: 'sin-cadencia',
            code: null,
            name: 'Sin cadencia sola',
            yearInPlan: 1,
            termInYear: null,
            termKind: null,
          }),
        ]}
      />,
    );

    const card = screen.getByRole('link', { name: /sin cadencia sola/i });
    const termGroup = card.parentElement?.parentElement;
    expect(termGroup).not.toHaveClass('border-t');
  });
});
