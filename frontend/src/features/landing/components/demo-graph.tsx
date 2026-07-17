type SubjectState = 'AP' | 'CU' | 'PL' | 'AV';

type GraphNode = {
  x: number;
  y: number;
  code: string;
  state: SubjectState;
};

// Grafo mini de correlativas: 3 columnas, 6 nodos. Data hardcodeada del mock
// (US-054-f), no representa un plan de estudios real.
const NODES: GraphNode[] = [
  { x: 0, y: 0, code: 'MAT101', state: 'AP' },
  { x: 0, y: 1, code: 'PRG101', state: 'AP' },
  { x: 1, y: 0, code: 'MAT201', state: 'CU' },
  { x: 1, y: 1, code: 'PRG201', state: 'AP' },
  { x: 2, y: 0, code: 'INT302', state: 'PL' },
  { x: 2, y: 1, code: 'ISW302', state: 'AV' },
];

const EDGES: [number, number][] = [
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [3, 5],
];

// Colores por estado en oklch, literales del mock: no son tokens del design
// system (mantenidos intactos por uniformidad perceptual entre hues).
const STATE_COLOR: Record<SubjectState, [bg: string, fg: string]> = {
  AP: ['oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
  CU: ['oklch(0.93 0.06 70)', 'oklch(0.45 0.12 60)'],
  PL: ['oklch(0.92 0.05 290)', 'oklch(0.42 0.14 290)'],
  AV: ['oklch(0.94 0.012 80)', 'oklch(0.35 0.012 80)'],
};

const WIDTH = 240;
const HEIGHT = 120;
const COL_WIDTH = 100;
const ROW_HEIGHT = 56;

function nodeX(node: GraphNode) {
  return 12 + node.x * COL_WIDTH;
}

function nodeY(node: GraphNode) {
  return 12 + node.y * ROW_HEIGHT;
}

/**
 * Demo embebido de la feature "Plan" (US-054-f). Port de `DemoGraph`
 * (docs/design/reference/canvas-mocks/landing.jsx, líneas 224-282): grafo SVG
 * mini de correlativas con curvas bézier entre nodos. Visual puro, sin fetch.
 */
export function DemoGraph() {
  return (
    <div
      className="bg-bg relative overflow-hidden"
      style={{ borderRadius: 10, padding: 14, height: HEIGHT }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {EDGES.map(([fromIndex, toIndex]) => {
          const from = NODES[fromIndex];
          const to = NODES[toIndex];
          const x1 = nodeX(from) + 70;
          const y1 = nodeY(from) + 14;
          const x2 = nodeX(to);
          const y2 = nodeY(to) + 14;
          const midX = (x1 + x2) / 2;
          return (
            <path
              key={`${from.code}-${to.code}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="var(--color-line-2)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      {NODES.map((node) => {
        const [bg, fg] = STATE_COLOR[node.state];
        return (
          <div
            key={node.code}
            className="absolute flex justify-between font-mono font-semibold"
            style={{
              left: nodeX(node),
              top: nodeY(node),
              width: 70,
              padding: '5px 8px',
              borderRadius: 6,
              background: bg,
              color: fg,
              fontSize: 10,
              letterSpacing: '0.02em',
            }}
          >
            <span>{node.code}</span>
            <span style={{ opacity: 0.7 }}>{node.state}</span>
          </div>
        );
      })}
    </div>
  );
}
