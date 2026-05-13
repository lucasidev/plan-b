import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import { CorrelativasGraph } from './correlativas-graph';

const subject = (
  code: string,
  correlativas: string[] = [],
  state: 'AP' | 'CU' | 'PD' = 'PD',
): PlannedSubject => ({
  code,
  name: `${code} fixture`,
  modality: '1c',
  state,
  grade: state === 'AP' ? 8 : null,
  correlativas,
});

const planFixture: PlanYear[] = [
  {
    year: 1,
    subjects: [subject('A', [], 'AP'), subject('B', [], 'AP')],
  },
  {
    year: 2,
    subjects: [subject('C', ['A']), subject('D', ['B'])],
  },
  {
    year: 3,
    subjects: [subject('E', ['C', 'D'])],
  },
];

describe('CorrelativasGraph', () => {
  it('renderea un grupo svg por cada nodo del plan', () => {
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    const nodes = container.querySelectorAll('g[data-code]');
    expect(nodes).toHaveLength(5);
  });

  it('aplica data-state al nodo según el plan', () => {
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    expect(container.querySelector('g[data-code="A"]')).toHaveAttribute('data-state', 'AP');
    expect(container.querySelector('g[data-code="C"]')).toHaveAttribute('data-state', 'PD');
  });

  it('muestra leyenda con los 3 estados', () => {
    render(<CorrelativasGraph plan={planFixture} />);
    expect(screen.getByText('Leyenda')).toBeInTheDocument();
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByText('Cursando')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('al hacer click en un nodo, marca data-selected=true y data-ancestor en sus ancestros', async () => {
    const user = userEvent.setup();
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    const nodeE = container.querySelector('g[data-code="E"]') as HTMLElement;
    await user.click(nodeE);

    expect(nodeE).toHaveAttribute('data-selected', 'true');
    // A, B, C, D son ancestros transitivos de E
    expect(container.querySelector('g[data-code="A"]')).toHaveAttribute('data-ancestor', 'true');
    expect(container.querySelector('g[data-code="C"]')).toHaveAttribute('data-ancestor', 'true');
  });

  it('al click en nodo root, marca descendientes', async () => {
    const user = userEvent.setup();
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    const nodeA = container.querySelector('g[data-code="A"]') as HTMLElement;
    await user.click(nodeA);

    expect(container.querySelector('g[data-code="C"]')).toHaveAttribute('data-descendant', 'true');
    expect(container.querySelector('g[data-code="E"]')).toHaveAttribute('data-descendant', 'true');
  });

  it('muestra panel de selección con CTA "Ver detalle" cuando hay nodo seleccionado', async () => {
    const user = userEvent.setup();
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    await user.click(container.querySelector('g[data-code="E"]') as HTMLElement);

    expect(screen.getByText(/Materia seleccionada/)).toBeInTheDocument();
    const cta = screen.getByText(/Ver detalle/);
    expect(cta.closest('a')).toHaveAttribute('href', '/mi-carrera/materia/E');
  });

  it('click en el mismo nodo dos veces deselecciona', async () => {
    const user = userEvent.setup();
    const { container } = render(<CorrelativasGraph plan={planFixture} />);
    const nodeE = container.querySelector('g[data-code="E"]') as HTMLElement;
    await user.click(nodeE);
    expect(nodeE).toHaveAttribute('data-selected', 'true');
    await user.click(nodeE);
    expect(nodeE).toHaveAttribute('data-selected', 'false');
  });

  it('renderea empty state si el plan no tiene correlativas', () => {
    const planSinCorr: PlanYear[] = [{ year: 1, subjects: [subject('X', []), subject('Y', [])] }];
    render(<CorrelativasGraph plan={planSinCorr} />);
    expect(screen.getByText(/Tu plan no tiene correlativas modeladas/)).toBeInTheDocument();
  });

  it('renderea empty state grande si el plan está vacío', () => {
    render(<CorrelativasGraph plan={[]} />);
    expect(screen.getByText(/Tu plan no tiene materias modeladas/)).toBeInTheDocument();
  });
});
