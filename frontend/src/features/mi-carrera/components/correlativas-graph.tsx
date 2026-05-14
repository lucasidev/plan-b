import Link from 'next/link';
import {
  edgePath,
  focusedNodeId,
  type GraphEdge,
  type GraphNode,
  graphEdges,
  graphNodes,
  LAYOUT,
  stateTokens,
  VIEWPORT,
} from '@/features/mi-carrera/data/correlativas-mock';
import { cn } from '@/lib/utils';

type Props = {
  /** Override del mock para tests. */
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  focusId?: string | null;
};

/**
 * Tab "Correlativas" de Mi carrera (US-045-c). Port literal del mock
 * `canvas-mocks/v2-screens.jsx::V2CarreraGrafo`.
 *
 * Layout: columnas por año, filas por slot dentro del año. Coords
 * lógicas (`x`, `y`) explícitas por nodo, traducidas a pixels con
 * `nodeOrigin()`. Aristas como curvas bezier horizontales entre nodos.
 *
 * Estados del grafo (más expandidos que los del PlanGrid):
 *   - AP aprobada (verde)
 *   - CU cursando (naranja)
 *   - AV disponible (correlativas cumplidas, no inscripta)
 *   - PL planeada (en borrador del próximo cuatri)
 *   - BL bloqueada (correlativas incompletas)
 *
 * Foco visual: la materia que el alumno está cursando ahora (`focusId`
 * default = ISW302 del mock) tiene stroke accent + las aristas que la
 * tocan se realzan.
 *
 * Server component (sin interacción JS). El click en nodos navega al
 * drawer real (US-045-d) via `<Link>`. No hay highlight on click; el
 * foco está dado por el contexto del alumno, no por interacción.
 */
export function CorrelativasGraph({
  nodes = graphNodes,
  edges = graphEdges,
  focusId = focusedNodeId,
}: Props) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const focusedNode = focusId != null ? (nodeById.get(focusId) ?? null) : null;
  const unlocks = focusedNode ? edges.filter((e) => e[0] === focusedNode.id).map((e) => e[1]) : [];

  return (
    <div className="flex flex-col gap-3.5">
      <Legend />

      <div className="bg-bg-card border border-line rounded-lg overflow-auto p-0">
        <svg
          width={VIEWPORT.width}
          height={VIEWPORT.height}
          style={{ display: 'block', minWidth: VIEWPORT.width }}
          role="img"
          aria-label="Grafo de correlativas del plan"
        >
          <title>
            Grafo de correlativas. Las flechas van de requisito a la materia que habilita.
          </title>

          <YearColumns />

          {edges.map(([fromId, toId]) => {
            const a = nodeById.get(fromId);
            const b = nodeById.get(toId);
            if (!a || !b) return null;
            const highlight = focusId != null && (fromId === focusId || toId === focusId);
            return (
              <path
                key={`${fromId}->${toId}`}
                d={edgePath(a, b)}
                fill="none"
                stroke={highlight ? 'var(--color-accent)' : 'var(--color-line)'}
                strokeWidth={highlight ? 1.5 : 1}
                opacity={highlight ? 0.9 : 0.7}
              />
            );
          })}

          {nodes.map((node) => (
            <NodeRect key={node.id} node={node} focused={node.id === focusId} />
          ))}
        </svg>
      </div>

      <TipBanner focusedNode={focusedNode} unlockedIds={unlocks} />
    </div>
  );
}

function Legend() {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2',
        'bg-bg-card border border-line rounded-lg px-4 py-2.5',
        'text-xs text-ink-3',
      )}
    >
      <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10.5 }}>
        Leyenda
      </span>
      {Object.entries(stateTokens).map(([state, tone]) => (
        <span key={state} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="rounded-sm"
            style={{
              width: 12,
              height: 12,
              background: tone.bg,
              border: `1px solid ${tone.dot}`,
            }}
          />
          <span className="text-ink-2">{tone.label}</span>
        </span>
      ))}
      <span className="flex-1" />
      <span style={{ fontSize: 11.5 }}>
        Las flechas van de <b className="text-ink-2">requisito</b> →{' '}
        <b className="text-ink-2">materia que habilita</b>
      </span>
    </div>
  );
}

function YearColumns() {
  const labels = ['Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5'];
  return (
    <>
      {labels.map((label, i) => (
        <g key={label}>
          <text
            x={LAYOUT.PAD_X + i * LAYOUT.COL_W + LAYOUT.NODE_W / 2}
            y={LAYOUT.PAD_Y + 12}
            textAnchor="middle"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              fill: 'var(--color-ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </text>
          {i > 0 && (
            <line
              x1={LAYOUT.PAD_X + i * LAYOUT.COL_W - 26}
              y1={LAYOUT.PAD_Y}
              x2={LAYOUT.PAD_X + i * LAYOUT.COL_W - 26}
              y2={VIEWPORT.height - LAYOUT.PAD_Y}
              stroke="var(--color-line)"
              strokeDasharray="2 4"
            />
          )}
        </g>
      ))}
    </>
  );
}

function NodeRect({ node, focused }: { node: GraphNode; focused: boolean }) {
  const tone = stateTokens[node.state];
  const origin = {
    x: LAYOUT.PAD_X + node.x * LAYOUT.COL_W,
    y: LAYOUT.PAD_Y + LAYOUT.YEAR_LABEL_OFFSET + node.y * LAYOUT.ROW_H,
  };

  return (
    <Link
      href={`/mi-carrera/materia/${node.id}`}
      aria-label={`${node.name}, ${tone.label}, año ${node.x + 1}`}
    >
      <g data-code={node.id} data-state={node.state} style={{ cursor: 'pointer' }}>
        <title>
          {node.name} · {tone.label} · Año {node.x + 1}
        </title>
        <rect
          x={origin.x}
          y={origin.y}
          width={LAYOUT.NODE_W}
          height={LAYOUT.NODE_H}
          rx={7}
          ry={7}
          fill={tone.bg}
          stroke={focused ? 'var(--color-accent)' : tone.dot}
          strokeWidth={focused ? 1.5 : 0.8}
          opacity={node.state === 'BL' ? 0.55 : 1}
        />
        <text
          x={origin.x + 10}
          y={origin.y + 14}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            fill: tone.fg,
            letterSpacing: '0.04em',
          }}
        >
          {node.id}
        </text>
        <text
          x={origin.x + 10}
          y={origin.y + 28}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 11.5,
            fontWeight: 500,
            fill: 'var(--color-ink)',
          }}
        >
          {node.name}
        </text>
      </g>
    </Link>
  );
}

function TipBanner({
  focusedNode,
  unlockedIds,
}: {
  focusedNode: GraphNode | null;
  unlockedIds: string[];
}) {
  if (!focusedNode || unlockedIds.length === 0) {
    return (
      <div
        className={cn(
          'flex gap-3 items-start',
          'bg-bg-elev border border-line rounded-lg px-3.5 py-2.5',
          'text-xs text-ink-2',
        )}
      >
        <InfoCircle />
        <span>
          Tocá un nodo para ver el detalle de la materia y qué otras se desbloquean al aprobarla.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 items-start',
        'bg-bg-elev border border-line rounded-lg px-3.5 py-2.5',
        'text-xs text-ink-2',
      )}
    >
      <InfoCircle />
      <span>
        Tocá un nodo para ver el detalle de la materia y qué otras se desbloquean al aprobarla.
        Estás cursando <b className="text-ink">{focusedNode.id}</b>. Al aprobarla habilitás{' '}
        {unlockedIds.map((id, i) => (
          <span key={id}>
            <b className="text-ink">{id}</b>
            {i < unlockedIds.length - 1 ? (i === unlockedIds.length - 2 ? ' y ' : ', ') : '.'}
          </span>
        ))}
      </span>
    </div>
  );
}

function InfoCircle() {
  return (
    <span
      aria-hidden
      className={cn(
        'shrink-0 inline-grid place-items-center rounded-full',
        'bg-accent-soft text-accent-ink',
      )}
      style={{ width: 18, height: 18, fontSize: 11, fontWeight: 600 }}
    >
      i
    </span>
  );
}
