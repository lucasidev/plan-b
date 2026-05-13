'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PlanYear } from '@/features/mi-carrera/data/plan';
import {
  detectCycle,
  edgeTone,
  type GraphEdge,
  getAncestors,
  getDescendants,
  type LayoutNode,
  planToGraph,
} from '@/features/mi-carrera/lib/graph';
import { stateLabel } from '@/features/mi-carrera/lib/subject-status';
import { cn } from '@/lib/utils';

type Props = {
  plan: PlanYear[];
};

const NODE_RADIUS = 22;

/**
 * Tab "Correlativas" de Mi carrera (US-045-c). Grafo SVG hand-coded de
 * dependencias entre materias del plan. Cada nodo es un circle coloreado
 * por estado del alumno; cada arista es una `<line>` con marker de flecha.
 *
 * Layout: layered (año por fila, columnas equiespaciadas dentro de cada
 * año). Sin libs externas.
 *
 * Interacción:
 *   - Click en nodo highlightea ancestros (correlativas que requiere) +
 *     descendientes (materias que habilita). El resto se atenúa con
 *     opacity-30.
 *   - Click outside del SVG resetea el highlight.
 *   - Cada nodo es navegable a `/mi-carrera/materia/[code]` via click
 *     largo / ctrl-click; primary click selecciona en el grafo (para no
 *     atrapar el flow exploratorio del alumno). Para navegar al drawer
 *     hay un CTA explícito "Ver detalle" en el tooltip flotante.
 *
 * MVP: layout estático, sin pan/zoom, sin drag. Si crece a > 30 nodos,
 * pasa a deuda.
 */
export function CorrelativasGraph({ plan }: Props) {
  const graph = useMemo(() => planToGraph(plan), [plan]);
  const [selected, setSelected] = useState<string | null>(null);

  const ancestors = useMemo(() => {
    return selected ? getAncestors(selected, graph.edges) : new Set<string>();
  }, [selected, graph.edges]);

  const descendants = useMemo(() => {
    return selected ? getDescendants(selected, graph.edges) : new Set<string>();
  }, [selected, graph.edges]);

  const hasCycle = useMemo(() => detectCycle(graph.nodes, graph.edges), [graph.nodes, graph.edges]);

  if (graph.nodes.length === 0) {
    return (
      <div className="bg-bg-card border border-line rounded-lg p-10 text-center text-ink-3">
        Tu plan no tiene materias modeladas todavía.
      </div>
    );
  }

  if (graph.edges.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Legend />
        <div className="bg-bg-card border border-line rounded-lg p-10 text-center text-ink-3">
          <p>Tu plan no tiene correlativas modeladas todavía.</p>
          <p className="text-sm mt-1">
            Cuando el catálogo institucional las declare, las vas a ver acá.
          </p>
        </div>
      </div>
    );
  }

  const isHighlightable = selected != null;
  const selectedNode = selected != null ? graph.nodes.find((n) => n.code === selected) : null;

  return (
    <div className="flex flex-col gap-3">
      <Legend />

      <div className="bg-bg-card border border-line rounded-lg shadow-card overflow-auto">
        <svg
          viewBox={`0 0 ${graph.width} ${graph.height}`}
          role="img"
          aria-label="Grafo de correlativas del plan"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelected(null);
          }}
          style={{ width: '100%', height: 'auto', maxHeight: '70vh', display: 'block' }}
        >
          <title>Grafo de correlativas. Click en una materia para resaltar sus dependencias.</title>
          <defs>
            <marker
              id="arrow-pending"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ink-3)" />
            </marker>
            <marker
              id="arrow-satisfied"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-st-approved-fg)" />
            </marker>
          </defs>

          {/* Aristas primero (debajo de los nodos). */}
          {graph.edges.map((edge) => (
            <EdgeLine
              key={`${edge.from}->${edge.to}`}
              edge={edge}
              nodes={graph.nodes}
              plan={plan}
              dimmed={
                isHighlightable &&
                edge.from !== selected &&
                edge.to !== selected &&
                !ancestors.has(edge.from) &&
                !ancestors.has(edge.to) &&
                !descendants.has(edge.from) &&
                !descendants.has(edge.to)
              }
            />
          ))}

          {/* Nodos al frente. */}
          {graph.nodes.map((node) => {
            const isSelected = node.code === selected;
            const isAncestor = ancestors.has(node.code);
            const isDescendant = descendants.has(node.code);
            const dimmed = isHighlightable && !isSelected && !isAncestor && !isDescendant;
            return (
              <Node
                key={node.code}
                node={node}
                isSelected={isSelected}
                isAncestor={isAncestor}
                isDescendant={isDescendant}
                dimmed={dimmed}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected((prev) => (prev === node.code ? null : node.code));
                }}
              />
            );
          })}
        </svg>
      </div>

      {hasCycle && (
        <div className="text-xs text-accent-ink bg-accent-soft rounded-md p-2.5">
          Detectamos un ciclo en las correlativas declaradas. Algunas aristas pueden no estar
          renderizando bien. Avisanos por soporte.
        </div>
      )}

      {selectedNode && (
        <SelectionPanel
          selectedCode={selectedNode.code}
          selectedName={selectedNode.name}
          ancestors={ancestors}
          descendants={descendants}
          nodes={graph.nodes}
        />
      )}
    </div>
  );
}

function Legend() {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-2',
        'bg-bg-card border border-line rounded-lg px-4 py-2.5',
        'text-xs text-ink-3',
      )}
    >
      <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10.5 }}>
        Leyenda
      </span>
      <LegendSwatch state="AP" />
      <LegendSwatch state="CU" />
      <LegendSwatch state="PD" />
      <span className="flex-1" />
      <span style={{ fontSize: 11.5 }}>
        Click en una materia para ver qué la habilita y qué desbloquea.
      </span>
    </div>
  );
}

function LegendSwatch({ state }: { state: 'AP' | 'CU' | 'PD' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'w-3.5 h-3.5 rounded-full border',
          state === 'AP' && 'bg-st-approved-bg border-st-approved-fg',
          state === 'CU' && 'bg-st-coursing-bg border-st-coursing-fg',
          state === 'PD' && 'bg-bg-card border-line-2',
        )}
      />
      <span className="text-ink-2">{stateLabel[state]}</span>
    </span>
  );
}

type NodeProps = {
  node: LayoutNode;
  isSelected: boolean;
  isAncestor: boolean;
  isDescendant: boolean;
  dimmed: boolean;
  onClick: (e: React.MouseEvent) => void;
};

function Node({ node, isSelected, isAncestor, isDescendant, dimmed, onClick }: NodeProps) {
  const fill =
    node.state === 'AP'
      ? 'var(--color-st-approved-bg)'
      : node.state === 'CU'
        ? 'var(--color-st-coursing-bg)'
        : 'var(--color-bg-card)';
  const stroke =
    node.state === 'AP'
      ? 'var(--color-st-approved-fg)'
      : node.state === 'CU'
        ? 'var(--color-st-coursing-fg)'
        : 'var(--color-line-2)';
  const textFill =
    node.state === 'AP'
      ? 'var(--color-st-approved-fg)'
      : node.state === 'CU'
        ? 'var(--color-st-coursing-fg)'
        : 'var(--color-ink-3)';

  const ringColor = isSelected
    ? 'var(--color-accent)'
    : isAncestor
      ? 'var(--color-accent-ink)'
      : isDescendant
        ? 'var(--color-accent-hover)'
        : null;

  // Keyboard activation no implementada en MVP: SVG <g> no acepta role/tabIndex
  // sin enrolar en foreignObject. La selección por click funciona con mouse;
  // el SelectionPanel debajo y los links a /mi-carrera/materia/[code] cubren
  // el flow alternativo accesible. Deuda explícita para iteración futura.
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: SVG node es trigger de highlight visual; el flow keyboard pasa por el SelectionPanel y los links a /materia/[code]
    <g
      data-code={node.code}
      data-state={node.state}
      data-selected={isSelected}
      data-ancestor={isAncestor}
      data-descendant={isDescendant}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.25 : 1,
        transition: 'opacity 150ms ease',
      }}
      onClick={onClick}
    >
      <title>
        {node.name} · {stateLabel[node.state]} · {node.year}° año
      </title>
      {ringColor && (
        <circle
          cx={node.x}
          cy={node.y}
          r={NODE_RADIUS + 4}
          fill="none"
          stroke={ringColor}
          strokeWidth={2}
          style={{ transition: 'all 150ms ease' }}
        />
      )}
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={node.x}
        y={node.y + 4}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fontWeight={600}
        fill={textFill}
        pointerEvents="none"
      >
        {node.code}
      </text>
      <text
        x={node.x}
        y={node.y + NODE_RADIUS + 14}
        textAnchor="middle"
        fontSize={10.5}
        fill="var(--color-ink-3)"
        pointerEvents="none"
      >
        {truncate(node.name, 16)}
      </text>
    </g>
  );
}

type EdgeLineProps = {
  edge: GraphEdge;
  nodes: LayoutNode[];
  plan: PlanYear[];
  dimmed: boolean;
};

function EdgeLine({ edge, nodes, plan, dimmed }: EdgeLineProps) {
  const from = nodes.find((n) => n.code === edge.from);
  const to = nodes.find((n) => n.code === edge.to);
  if (!from || !to) return null;

  const tone = edgeTone(edge, plan);

  // Recortar la línea para que no se meta dentro del círculo del nodo
  // destino (deja espacio visual al marker de flecha).
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = NODE_RADIUS + 6;
  const tx = to.x - (dx / dist) * offset;
  const ty = to.y - (dy / dist) * offset;
  const sx = from.x + (dx / dist) * NODE_RADIUS;
  const sy = from.y + (dy / dist) * NODE_RADIUS;

  return (
    <line
      x1={sx}
      y1={sy}
      x2={tx}
      y2={ty}
      stroke={tone === 'satisfied' ? 'var(--color-st-approved-fg)' : 'var(--color-ink-3)'}
      strokeWidth={tone === 'satisfied' ? 1.4 : 1}
      strokeDasharray={tone === 'pending' ? '4 3' : undefined}
      markerEnd={tone === 'satisfied' ? 'url(#arrow-satisfied)' : 'url(#arrow-pending)'}
      style={{
        opacity: dimmed ? 0.18 : 0.8,
        transition: 'opacity 150ms ease',
      }}
    />
  );
}

function SelectionPanel({
  selectedCode,
  selectedName,
  ancestors,
  descendants,
  nodes,
}: {
  selectedCode: string;
  selectedName: string;
  ancestors: Set<string>;
  descendants: Set<string>;
  nodes: LayoutNode[];
}) {
  const ancestorNodes = nodes.filter((n) => ancestors.has(n.code));
  const descendantNodes = nodes.filter((n) => descendants.has(n.code));

  return (
    <div className="bg-bg-card border border-line rounded-lg p-4 shadow-card">
      <div className="flex justify-between items-baseline mb-3 gap-3">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            Materia seleccionada
          </div>
          <h3 className="font-display font-semibold text-lg text-ink">
            <span className="font-mono text-sm text-ink-3 mr-2">{selectedCode}</span>
            {selectedName}
          </h3>
        </div>
        <Link
          href={`/mi-carrera/materia/${selectedCode}`}
          className="text-sm text-accent-ink hover:text-accent-hover whitespace-nowrap"
        >
          Ver detalle →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NodeChipList
          title="Te habilita esta materia"
          subtitle="(materias que la requieren)"
          nodes={descendantNodes}
          emptyText="No habilita ninguna otra materia."
        />
        <NodeChipList
          title="Necesita estas materias"
          subtitle="(correlativas declaradas)"
          nodes={ancestorNodes}
          emptyText="Sin correlativas."
        />
      </div>
    </div>
  );
}

function NodeChipList({
  title,
  subtitle,
  nodes,
  emptyText,
}: {
  title: string;
  subtitle: string;
  nodes: LayoutNode[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 mb-1.5">
        {title}{' '}
        <span className="normal-case text-ink-4" style={{ letterSpacing: 0 }}>
          {subtitle}
        </span>
      </div>
      {nodes.length === 0 ? (
        <p className="text-xs text-ink-3">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {nodes.map((n) => (
            <Link
              key={n.code}
              href={`/mi-carrera/materia/${n.code}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
                'bg-bg-elev border border-line hover:border-accent',
                'text-xs text-ink-2 transition-colors',
              )}
            >
              <span className="font-mono text-[10.5px] text-ink-3">{n.code}</span>
              <span>{n.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}…`;
}
