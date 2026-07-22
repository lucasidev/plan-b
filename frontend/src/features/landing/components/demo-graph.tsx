type SubjectState = 'AP' | 'CU' | 'PL' | 'AV';

type GraphNode = {
  x: number;
  y: number;
  code: string;
  state: SubjectState;
};

// Grafo mini de correlativas: 3 columnas, 6 nodos. Data de ejemplo (vidriera de
// marketing), no representa un plan de estudios real.
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

const COL_WIDTH = 100;
const ROW_HEIGHT = 56;
const NODE_W = 70;
const NODE_H = 24;
// viewBox = contenido real + 12px de margen por lado (la última columna arranca
// en x=212 y el nodo mide 70: un ancho menor recorta la columna derecha).
const WIDTH = 12 + 2 * COL_WIDTH + NODE_W + 12;
const HEIGHT = 12 + ROW_HEIGHT + NODE_H + 12;

function nodeX(node: GraphNode) {
  return 12 + node.x * COL_WIDTH;
}

function nodeY(node: GraphNode) {
  return 12 + node.y * ROW_HEIGHT;
}

/**
 * Demo embebido de la feature "Mi carrera" (US-054-f). Grafo SVG mini de correlativas con
 * curvas bézier entre nodos. Visual puro, sin fetch, datos de ejemplo.
 *
 * Nodos y líneas viven ambos DENTRO del SVG (mismo sistema de coordenadas del
 * `viewBox`), así escalan juntos y quedan alineados en cualquier ancho. Antes los
 * nodos eran `<div>` absolutos en px fijos: al cambiar el viewport, el SVG estiraba
 * las líneas y los divs se quedaban clavados, rompiendo la alineación.
 */
export function DemoGraph() {
  return (
    <div className="bg-bg" style={{ borderRadius: 10, padding: 14 }}>
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ display: 'block', maxWidth: WIDTH, margin: '0 auto' }}
        aria-hidden="true"
      >
        {EDGES.map(([fromIndex, toIndex]) => {
          const from = NODES[fromIndex];
          const to = NODES[toIndex];
          const x1 = nodeX(from) + NODE_W;
          const y1 = nodeY(from) + NODE_H / 2;
          const x2 = nodeX(to);
          const y2 = nodeY(to) + NODE_H / 2;
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
        {NODES.map((node) => {
          const [bg, fg] = STATE_COLOR[node.state];
          return (
            <g key={node.code} transform={`translate(${nodeX(node)} ${nodeY(node)})`}>
              <rect width={NODE_W} height={NODE_H} rx={6} fill={bg} />
              <text
                x={8}
                y={16}
                fill={fg}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {node.code}
              </text>
              <text
                x={NODE_W - 8}
                y={16}
                textAnchor="end"
                fill={fg}
                opacity={0.7}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}
              >
                {node.state}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
