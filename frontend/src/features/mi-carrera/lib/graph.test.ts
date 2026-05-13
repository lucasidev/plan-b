import { describe, expect, it } from 'vitest';
import type { PlannedSubject, PlanYear } from '@/features/mi-carrera/data/plan';
import {
  buildEdges,
  buildNodes,
  detectCycle,
  edgeTone,
  getAncestors,
  getDescendants,
  layeredLayout,
  planToGraph,
} from './graph';

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
    subjects: [subject('E', ['C', 'D']), subject('F', ['Z' /* inexistente */])],
  },
];

describe('buildNodes', () => {
  it('mapea cada subject a un node con year + column', () => {
    const nodes = buildNodes(planFixture);
    expect(nodes).toHaveLength(6);
    const a = nodes.find((n) => n.code === 'A');
    expect(a).toMatchObject({ year: 1, column: 0, state: 'AP' });
    const e = nodes.find((n) => n.code === 'E');
    expect(e).toMatchObject({ year: 3, column: 0 });
  });
});

describe('buildEdges', () => {
  it('crea una edge por cada correlativa válida', () => {
    const edges = buildEdges(planFixture);
    expect(edges).toContainEqual({ from: 'A', to: 'C' });
    expect(edges).toContainEqual({ from: 'B', to: 'D' });
    expect(edges).toContainEqual({ from: 'C', to: 'E' });
    expect(edges).toContainEqual({ from: 'D', to: 'E' });
  });

  it('ignora correlativas hacia codes inexistentes', () => {
    const edges = buildEdges(planFixture);
    expect(edges.some((e) => e.from === 'Z')).toBe(false);
  });
});

describe('getAncestors', () => {
  it('devuelve ancestros directos + transitivos', () => {
    const edges = buildEdges(planFixture);
    expect(getAncestors('E', edges)).toEqual(new Set(['C', 'D', 'A', 'B']));
  });

  it('devuelve set vacío para nodos root', () => {
    const edges = buildEdges(planFixture);
    expect(getAncestors('A', edges)).toEqual(new Set());
  });
});

describe('getDescendants', () => {
  it('devuelve descendientes directos + transitivos', () => {
    const edges = buildEdges(planFixture);
    expect(getDescendants('A', edges)).toEqual(new Set(['C', 'E']));
  });

  it('devuelve set vacío para nodos leaf', () => {
    const edges = buildEdges(planFixture);
    expect(getDescendants('E', edges)).toEqual(new Set());
  });
});

describe('detectCycle', () => {
  it('devuelve false para un DAG válido', () => {
    expect(detectCycle(buildNodes(planFixture), buildEdges(planFixture))).toBe(false);
  });

  it('devuelve true cuando hay un ciclo directo A→B→A', () => {
    const cyclicPlan: PlanYear[] = [
      {
        year: 1,
        subjects: [subject('A', ['B']), subject('B', ['A'])],
      },
    ];
    expect(detectCycle(buildNodes(cyclicPlan), buildEdges(cyclicPlan))).toBe(true);
  });

  it('devuelve true para ciclo indirecto A→B→C→A', () => {
    const cyclicPlan: PlanYear[] = [
      {
        year: 1,
        subjects: [subject('A', ['C']), subject('B', ['A']), subject('C', ['B'])],
      },
    ];
    expect(detectCycle(buildNodes(cyclicPlan), buildEdges(cyclicPlan))).toBe(true);
  });
});

describe('layeredLayout', () => {
  it('asigna y por año (años ordenados ascendente)', () => {
    const layout = layeredLayout(buildNodes(planFixture));
    const ys = new Set(layout.nodes.map((n) => n.y));
    expect(ys.size).toBe(3);
    const a = layout.nodes.find((n) => n.code === 'A');
    const e = layout.nodes.find((n) => n.code === 'E');
    expect(a).toBeDefined();
    expect(e).toBeDefined();
    if (a && e) expect(a.y).toBeLessThan(e.y);
  });

  it('centra cada fila respecto al máximo de nodos por año', () => {
    const layout = layeredLayout(buildNodes(planFixture));
    const yearNodes = layout.nodes.filter((n) => n.year === 1).toSorted((a, b) => a.x - b.x);
    expect(yearNodes[0].x).toBeLessThan(yearNodes[1].x);
  });

  it('devuelve width + height calculados según el máximo', () => {
    const layout = layeredLayout(buildNodes(planFixture));
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});

describe('planToGraph', () => {
  it('combina nodes + edges + layout en un solo objeto', () => {
    const graph = planToGraph(planFixture);
    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.width).toBeGreaterThan(0);
  });
});

describe('edgeTone', () => {
  it('marca arista como satisfied si la materia target está AP o CU', () => {
    expect(edgeTone({ from: 'A', to: 'A' }, planFixture)).toBe('satisfied');
  });

  it('marca arista como pending si target está PD', () => {
    expect(edgeTone({ from: 'A', to: 'C' }, planFixture)).toBe('pending');
  });
});
