import type { PlannedSubject, PlanYear, SubjectState } from '@/features/mi-carrera/data/plan';

/**
 * Helpers para el grafo de correlativas del tab "Correlativas" (US-045-c).
 * Trabajan sobre la shape `PlanYear[]` ya existente (mock de US-045-b). Las
 * aristas se derivan trivialmente del `correlativas` array de cada subject:
 * cada code en `correlativas` representa una arista `{ from: code, to: subjectCode }`.
 *
 * No hay archivo separado de edges porque sería duplicación pura (las
 * correlativas ya viven en el plan). Cuando aterrice el backend, el plan
 * va a venir de US-061 y este módulo no cambia.
 */

export type GraphNode = {
  code: string;
  name: string;
  state: SubjectState;
  year: number;
  /** Columna 0-indexada dentro del año (para layered layout). */
  column: number;
};

export type GraphEdge = {
  /** Código de la materia correlativa requerida. */
  from: string;
  /** Código de la materia que la requiere. */
  to: string;
};

export type LayoutNode = GraphNode & {
  /** Coordenada x en el viewport SVG. */
  x: number;
  /** Coordenada y en el viewport SVG. */
  y: number;
};

export type GraphLayout = {
  nodes: LayoutNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
};

/**
 * Convierte un `PlanYear[]` en nodos del grafo. Asigna `column` dentro de
 * cada año por el orden del array (1° del año = col 0, 2° = col 1, etc.).
 */
export function buildNodes(plan: PlanYear[]): GraphNode[] {
  return plan.flatMap((yearBlock) =>
    yearBlock.subjects.map(
      (s, idx): GraphNode => ({
        code: s.code,
        name: s.name,
        state: s.state,
        year: yearBlock.year,
        column: idx,
      }),
    ),
  );
}

/**
 * Deriva las aristas del plan: cada correlativa declarada en un subject
 * crea una arista `{ from: correlativa, to: subjectCode }`. Si una
 * correlativa apunta a un code que no existe en el plan, se ignora
 * silenciosamente (caso patológico que no debería pasar).
 */
export function buildEdges(plan: PlanYear[]): GraphEdge[] {
  const allCodes = new Set(plan.flatMap((y) => y.subjects.map((s) => s.code)));
  const edges: GraphEdge[] = [];
  for (const yearBlock of plan) {
    for (const subject of yearBlock.subjects) {
      for (const corr of subject.correlativas) {
        if (allCodes.has(corr)) {
          edges.push({ from: corr, to: subject.code });
        }
      }
    }
  }
  return edges;
}

/**
 * Devuelve el set de códigos que son ancestros de un nodo (sus correlativas
 * directas e indirectas, transitivas).
 */
export function getAncestors(nodeId: string, edges: GraphEdge[]): Set<string> {
  const ancestors = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current == null) continue;
    for (const edge of edges) {
      if (edge.to === current && !ancestors.has(edge.from)) {
        ancestors.add(edge.from);
        stack.push(edge.from);
      }
    }
  }
  return ancestors;
}

/**
 * Devuelve el set de códigos que son descendientes de un nodo (las
 * materias que lo requieren directa o indirectamente).
 */
export function getDescendants(nodeId: string, edges: GraphEdge[]): Set<string> {
  const descendants = new Set<string>();
  const stack = [nodeId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current == null) continue;
    for (const edge of edges) {
      if (edge.from === current && !descendants.has(edge.to)) {
        descendants.add(edge.to);
        stack.push(edge.to);
      }
    }
  }
  return descendants;
}

/**
 * Detecta si el grafo tiene un ciclo (caso patológico: planes reales son
 * DAGs estrictos). Devuelve `true` si encuentra ciclo, `false` si es DAG.
 *
 * Implementación: DFS con tres colores (white/gray/black). Si encuentra
 * un edge a un nodo "gray" (en proceso), es ciclo.
 */
export function detectCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const colors = new Map<string, 'white' | 'gray' | 'black'>();
  for (const n of nodes) colors.set(n.code, 'white');

  const visit = (code: string): boolean => {
    colors.set(code, 'gray');
    for (const edge of edges) {
      if (edge.from === code) {
        const targetColor = colors.get(edge.to);
        if (targetColor === 'gray') return true;
        if (targetColor === 'white' && visit(edge.to)) return true;
      }
    }
    colors.set(code, 'black');
    return false;
  };

  for (const n of nodes) {
    if (colors.get(n.code) === 'white' && visit(n.code)) return true;
  }
  return false;
}

/**
 * Layered layout: cada año en una fila horizontal, materias del año en
 * columnas equiespaciadas. Devuelve coordenadas x/y absolutas en el
 * viewport SVG.
 *
 * Parámetros tunables (en pixels):
 *   - `nodeSpacingX`: separación horizontal entre nodos del mismo año.
 *   - `rowSpacingY`: separación vertical entre años.
 *   - `paddingX` / `paddingY`: margen interno del viewport.
 *   - `nodeRadius`: radio de cada nodo (no afecta layout, lo usa el render).
 */
export type LayoutOptions = {
  nodeSpacingX?: number;
  rowSpacingY?: number;
  paddingX?: number;
  paddingY?: number;
  nodeRadius?: number;
};

export function layeredLayout(nodes: GraphNode[], options: LayoutOptions = {}): GraphLayout {
  const nodeSpacingX = options.nodeSpacingX ?? 130;
  const rowSpacingY = options.rowSpacingY ?? 110;
  const paddingX = options.paddingX ?? 40;
  const paddingY = options.paddingY ?? 50;

  // Agrupar por año.
  const byYear = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const list = byYear.get(node.year) ?? [];
    list.push(node);
    byYear.set(node.year, list);
  }

  const years = [...byYear.keys()].toSorted((a, b) => a - b);
  const maxNodesPerYear = Math.max(...[...byYear.values()].map((arr) => arr.length), 1);

  const layoutNodes: LayoutNode[] = [];
  years.forEach((year, rowIndex) => {
    const yearNodes = (byYear.get(year) ?? []).toSorted((a, b) => a.column - b.column);
    const rowWidth = yearNodes.length * nodeSpacingX;
    const offset = (maxNodesPerYear * nodeSpacingX - rowWidth) / 2;
    yearNodes.forEach((node, colIndex) => {
      layoutNodes.push({
        ...node,
        x: paddingX + offset + colIndex * nodeSpacingX + nodeSpacingX / 2,
        y: paddingY + rowIndex * rowSpacingY,
      });
    });
  });

  const width = paddingX * 2 + maxNodesPerYear * nodeSpacingX;
  const height = paddingY * 2 + Math.max(years.length - 1, 0) * rowSpacingY;

  return {
    nodes: layoutNodes,
    edges: [],
    width,
    height,
  };
}

/**
 * Combina `buildNodes` + `buildEdges` + `layeredLayout` con un input
 * `PlanYear[]`. Conveniencia para el componente.
 */
export function planToGraph(plan: PlanYear[], options?: LayoutOptions): GraphLayout {
  const nodes = buildNodes(plan);
  const edges = buildEdges(plan);
  const layout = layeredLayout(nodes, options);
  return { ...layout, edges };
}

/**
 * Devuelve la "tone" visual de un edge según el state del target (la
 * materia que requiere). Útil para colorear aristas (ej. atenuar las que
 * ya están cumplidas).
 */
export function edgeTone(edge: GraphEdge, plan: PlanYear[]): 'satisfied' | 'pending' {
  const target = findSubject(plan, edge.to);
  if (target?.state === 'AP' || target?.state === 'CU') return 'satisfied';
  return 'pending';
}

function findSubject(plan: PlanYear[], code: string): PlannedSubject | null {
  for (const yearBlock of plan) {
    const found = yearBlock.subjects.find((s) => s.code === code);
    if (found) return found;
  }
  return null;
}
