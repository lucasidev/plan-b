import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GraphEdge, GraphNode } from '@/features/mi-carrera/data/correlativas-mock';
import { CorrelativasGraph } from './correlativas-graph';

const node = (id: string, x: number, y: number, state: GraphNode['state'] = 'AP'): GraphNode => ({
  id,
  name: `${id} fixture`,
  x,
  y,
  state,
});

const fixtureNodes: GraphNode[] = [
  node('A', 0, 0, 'AP'),
  node('B', 1, 0, 'CU'),
  node('C', 1, 1, 'AV'),
  node('D', 2, 0, 'PL'),
  node('E', 2, 1, 'BL'),
];

const fixtureEdges: GraphEdge[] = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'D'],
  ['C', 'D'],
  ['B', 'E'],
];

describe('CorrelativasGraph', () => {
  it('renderea un grupo SVG por cada nodo del mock', () => {
    const { container } = render(
      <CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />,
    );
    expect(container.querySelectorAll('g[data-code]')).toHaveLength(5);
  });

  it('aplica data-state a cada nodo según el mock', () => {
    const { container } = render(
      <CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />,
    );
    expect(container.querySelector('g[data-code="A"]')).toHaveAttribute('data-state', 'AP');
    expect(container.querySelector('g[data-code="B"]')).toHaveAttribute('data-state', 'CU');
    expect(container.querySelector('g[data-code="C"]')).toHaveAttribute('data-state', 'AV');
    expect(container.querySelector('g[data-code="D"]')).toHaveAttribute('data-state', 'PL');
    expect(container.querySelector('g[data-code="E"]')).toHaveAttribute('data-state', 'BL');
  });

  it('muestra leyenda con los 5 estados visuales', () => {
    render(<CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />);
    expect(screen.getByText('Leyenda')).toBeInTheDocument();
    for (const label of ['aprobada', 'cursando', 'disponible', 'planeada', 'bloqueada']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('cada nodo es un link al drawer /mi-carrera/materia/[id]', () => {
    render(<CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />);
    expect(screen.getByLabelText(/A fixture, aprobada/).closest('a')).toHaveAttribute(
      'href',
      '/mi-carrera/materia/A',
    );
  });

  it('muestra etiquetas de años (Año 1 hasta Año 5)', () => {
    render(<CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />);
    for (const label of ['Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renderea un path por cada arista válida', () => {
    const { container } = render(
      <CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />,
    );
    expect(container.querySelectorAll('svg path')).toHaveLength(5);
  });

  it('ignora aristas a nodos inexistentes', () => {
    const edgesConGhost: GraphEdge[] = [
      ['A', 'B'],
      ['A', 'GHOST'],
    ];
    const { container } = render(
      <CorrelativasGraph nodes={fixtureNodes} edges={edgesConGhost} focusId={null} />,
    );
    expect(container.querySelectorAll('svg path')).toHaveLength(1);
  });

  it('muestra tip default cuando no hay foco', () => {
    render(<CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId={null} />);
    expect(screen.getByText(/Tocá un nodo para ver el detalle/)).toBeInTheDocument();
    expect(screen.queryByText(/Estás cursando/)).not.toBeInTheDocument();
  });

  it('cuando hay focus, el banner menciona la materia y las que habilita', () => {
    render(<CorrelativasGraph nodes={fixtureNodes} edges={fixtureEdges} focusId="B" />);
    const banner = screen.getByText(/Estás cursando/).closest('div');
    expect(banner).toHaveTextContent('B');
    // B habilita D + E
    expect(banner).toHaveTextContent('D');
    expect(banner).toHaveTextContent('E');
  });
});
