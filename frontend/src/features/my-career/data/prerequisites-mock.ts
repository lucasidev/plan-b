/**
 * Mock del grafo de correlativas (US-045-c). Port literal del canvas
 * `canvas-mocks/v2-screens.jsx::V2CarreraGrafo`.
 *
 * Importante: usa códigos + estados DISTINTOS al `plan.ts` del PlanGrid
 * (US-045-b). El canvas mismo tiene esa inconsistencia (ej. en PlanGrid
 * "PRG201" es Estructuras de Datos, en el grafo es "EDA201"; estados
 * expandidos AP/CU/AV/PL/BL en lugar de AP/CU/PD). Cuando aterrice el
 * backend real, ambas vistas se unifican en `GET /api/me/career-plan`.
 *
 * Estados del grafo:
 *   - AP: aprobada (verde)
 *   - CU: cursando (naranja)
 *   - AV: disponible (gris cálido, correlativas cumplidas, no inscripta)
 *   - PL: planeada (violeta, agregada al borrador del próximo cuatri)
 *   - BL: bloqueada (gris desaturado, correlativas incompletas)
 */

export type GraphSubjectState = 'AP' | 'CU' | 'AV' | 'PL' | 'BL';

export type GraphNode = {
  id: string;
  name: string;
  /** Columna lógica (0-indexed). Cada columna = un año del plan. */
  x: number;
  /** Fila lógica dentro de la columna (0-indexed). */
  y: number;
  state: GraphSubjectState;
};

export type GraphEdge = readonly [from: string, to: string];

export const graphNodes: GraphNode[] = [
  // Año 1
  { id: 'MAT101', name: 'Análisis Mat. I', x: 0, y: 0, state: 'AP' },
  { id: 'ALG101', name: 'Álgebra', x: 0, y: 1, state: 'AP' },
  { id: 'PRG101', name: 'Programación I', x: 0, y: 2, state: 'AP' },
  { id: 'MAT102', name: 'Análisis Mat. II', x: 0, y: 3, state: 'AP' },
  { id: 'PRG102', name: 'Programación II', x: 0, y: 4, state: 'AP' },
  // Año 2
  { id: 'FIS201', name: 'Física I', x: 1, y: 0, state: 'AP' },
  { id: 'BD201', name: 'Bases de Datos', x: 1, y: 1, state: 'AP' },
  { id: 'EDA201', name: 'Estructuras de Datos', x: 1, y: 2, state: 'AP' },
  { id: 'MAT201', name: 'Probabilidad', x: 1, y: 3, state: 'AP' },
  // Año 3
  { id: 'ISW301', name: 'Ing. de Software I', x: 2, y: 0, state: 'AP' },
  { id: 'BD301', name: 'BD II', x: 2, y: 1, state: 'AP' },
  { id: 'COM301', name: 'Comunic. de Datos', x: 2, y: 2, state: 'AP' },
  // Año 4 (cursando)
  { id: 'ISW302', name: 'Ing. de Software II', x: 3, y: 0, state: 'CU' },
  { id: 'INT302', name: 'IA I', x: 3, y: 1, state: 'CU' },
  { id: 'SEG302', name: 'Seguridad', x: 3, y: 2, state: 'CU' },
  { id: 'MAT401', name: 'Mat. Aplicada', x: 3, y: 3, state: 'CU' },
  { id: 'MOV302', name: 'Apps Móviles', x: 3, y: 4, state: 'AV' },
  { id: 'QUI201', name: 'Química', x: 3, y: 5, state: 'CU' },
  // Año 5 (planeadas / bloqueadas)
  { id: 'INT402', name: 'IA II', x: 4, y: 0, state: 'PL' },
  { id: 'SEG402', name: 'Sist. Distribuidos', x: 4, y: 1, state: 'BL' },
  { id: 'TES501', name: 'Trabajo Final', x: 4, y: 2, state: 'BL' },
];

export const graphEdges: GraphEdge[] = [
  ['MAT101', 'MAT102'],
  ['MAT101', 'FIS201'],
  ['ALG101', 'MAT201'],
  ['PRG101', 'PRG102'],
  ['PRG102', 'BD201'],
  ['PRG102', 'EDA201'],
  ['MAT102', 'MAT201'],
  ['BD201', 'ISW301'],
  ['BD201', 'BD301'],
  ['EDA201', 'ISW301'],
  ['EDA201', 'INT302'],
  ['ISW301', 'ISW302'],
  ['MAT201', 'INT302'],
  ['COM301', 'SEG302'],
  ['BD301', 'ISW302'],
  ['INT302', 'INT402'],
  ['ISW302', 'SEG402'],
  ['SEG302', 'SEG402'],
  ['ISW302', 'TES501'],
  ['MAT201', 'MAT401'],
];

/** Materia "en foco" del grafo: la que el alumno está cursando ahora. */
export const focusedNodeId = 'ISW302';

/** Tokens visuales por estado (en sync con el canvas `tone` map). */
export const stateTokens: Record<
  GraphSubjectState,
  { bg: string; fg: string; dot: string; label: string }
> = {
  AP: {
    bg: 'oklch(0.94 0.05 145)',
    fg: 'oklch(0.42 0.09 145)',
    dot: 'oklch(0.55 0.13 145)',
    label: 'aprobada',
  },
  CU: {
    bg: 'oklch(0.93 0.06 70)',
    fg: 'oklch(0.45 0.12 60)',
    dot: 'oklch(0.62 0.16 60)',
    label: 'cursando',
  },
  AV: {
    bg: 'oklch(0.94 0.012 80)',
    fg: 'oklch(0.35 0.012 80)',
    dot: 'oklch(0.58 0.02 80)',
    label: 'disponible',
  },
  PL: {
    bg: 'oklch(0.92 0.05 290)',
    fg: 'oklch(0.42 0.14 290)',
    dot: 'oklch(0.55 0.14 290)',
    label: 'planeada',
  },
  BL: {
    bg: '#f7efe5',
    fg: 'var(--color-ink-4)',
    dot: 'var(--color-ink-4)',
    label: 'bloqueada',
  },
};

/** Coords del layout (en sync con el canvas). */
export const LAYOUT = {
  COL_W: 220,
  ROW_H: 56,
  PAD_X: 36,
  PAD_Y: 40,
  NODE_W: 168,
  NODE_H: 38,
  YEAR_LABEL_OFFSET: 24,
  YEAR_COUNT: 5,
  /** Máximo de filas por columna (la mayor altura entre todas las cols). */
  MAX_ROWS: 6,
} as const;

/** Width/height totales del viewport SVG (computados de LAYOUT). */
export const VIEWPORT = {
  width: LAYOUT.PAD_X * 2 + LAYOUT.YEAR_COUNT * LAYOUT.COL_W,
  height: LAYOUT.PAD_Y * 2 + LAYOUT.MAX_ROWS * LAYOUT.ROW_H + LAYOUT.YEAR_LABEL_OFFSET,
};

/** Coordenadas en pixels de un node. */
export function nodeOrigin(node: GraphNode): { x: number; y: number } {
  return {
    x: LAYOUT.PAD_X + node.x * LAYOUT.COL_W,
    y: LAYOUT.PAD_Y + LAYOUT.YEAR_LABEL_OFFSET + node.y * LAYOUT.ROW_H,
  };
}

/** SVG path de la curva bezier entre dos nodos (`a` requisito, `b` habilita). */
export function edgePath(a: GraphNode, b: GraphNode): string {
  const aOrigin = nodeOrigin(a);
  const bOrigin = nodeOrigin(b);
  const ax = aOrigin.x + LAYOUT.NODE_W;
  const ay = aOrigin.y + LAYOUT.NODE_H / 2;
  const bx = bOrigin.x;
  const by = bOrigin.y + LAYOUT.NODE_H / 2;
  const mx = (ax + bx) / 2;
  return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
}

/** Lookup por id. */
export function findGraphNode(id: string): GraphNode | undefined {
  return graphNodes.find((n) => n.id === id);
}
