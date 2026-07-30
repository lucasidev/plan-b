import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type {
  AvailableSubjectsResponse,
  CommissionSelection,
  ListPublicSimulationsResponse,
  ListSimulationDraftsResponse,
  SimulationEvaluation,
} from './types';

/**
 * Query client-side de las materias disponibles para el planificador (US-016), con la oferta de
 * comisiones de un período puntual (US-096, `termId` opcional). La página /plan prefetchea con el
 * fetcher server-only (api.server) seedeando este mismo queryKey; el drawer "Agregar materia" y el
 * picker de comisión consumen con useSuspenseQuery.
 */
async function fetchAvailableSubjects(termId: string | null): Promise<AvailableSubjectsResponse> {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : '';
  const response = await clientApiFetch(`/api/me/simulator/available${query}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`available subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as AvailableSubjectsResponse;
}

export const availableSubjectsQueries = {
  list: (termId: string | null = null) =>
    queryOptions({
      queryKey: ['plan', 'available-subjects', termId] as const,
      queryFn: () => fetchAvailableSubjects(termId),
    }),
};

async function fetchSimulationEvaluation(
  subjectIds: readonly string[],
  commissions: readonly { subjectId: string; commissionId: string }[],
): Promise<SimulationEvaluation> {
  const response = await clientApiFetch('/api/me/simulator/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectIds, commissions }),
  });
  // El 409 no es una falla de transporte acá: el endpoint lo usa para viajar la misma respuesta
  // con isValid=false (materias bloqueadas), no un ProblemDetails (ver EvaluateSimulationEndpoint
  // en el backend). Cualquier otro !ok sí es una falla real (materia fuera del plan, sin sesión, etc).
  if (!response.ok && response.status !== 409) {
    throw new Error(`simulation evaluate fetch failed: ${response.status}`);
  }
  return (await response.json()) as SimulationEvaluation;
}

/**
 * Query (no mutation) de evaluar una combinación de materias + comisiones elegidas (US-016 +
 * US-096). El verb HTTP es POST porque el subset de materias no entra en una query string, pero el
 * backend lo trata como una consulta de lectura que no persiste nada (ver
 * EvaluateSimulationCommand.cs, ADR-0029): mismo criterio que GetAvailableSubjects. Por eso
 * useQuery con la combinación ordenada adentro del queryKey, no useMutation: el panel de métricas y
 * el calendario tienen que reaccionar solos a que cambie la combinación elegida (materias +
 * comisiones), sin que el componente dispare un mutate() a mano en un efecto, y useQuery cachea por
 * combinación (volver a una combinación ya evaluada no vuelve a pegarle a la red). useMutation es
 * para acciones iniciadas por el usuario con efectos (crear, editar, borrar); acá no hay ninguno de
 * los dos.
 *
 * `selections` es sin orden (los mismos ids en cualquier orden tienen que resolver al mismo cache
 * entry): se ordena por `subjectId` antes de armar la key y el body, así que sumar/reordenar
 * materias o comisiones en la UI no invalida el cache de una combinación ya vista. `enabled` en
 * false con la lista vacía: sin materias elegidas, no hay nada que evaluar. Las comisiones sin
 * elegir (`commissionId: null`) no viajan en el body: el backend trata "sin elegir ninguna" y
 * "mandé un array vacío" igual (`EvaluateSimulationCommandHandler`, `command.Commissions ?? []`).
 */
export const simulationEvaluationQueries = {
  forSelections: (selections: readonly CommissionSelection[]) => {
    const sorted = [...selections].sort((a, b) => a.subjectId.localeCompare(b.subjectId));
    const subjectIds = sorted.map((s) => s.subjectId);
    const commissions = sorted
      .filter((s) => s.commissionId !== null)
      .map((s) => ({ subjectId: s.subjectId, commissionId: s.commissionId as string }));

    return queryOptions({
      queryKey: ['plan', 'simulator', 'evaluate', subjectIds, commissions] as const,
      queryFn: () => fetchSimulationEvaluation(subjectIds, commissions),
      enabled: subjectIds.length > 0,
    });
  },
};

async function fetchSimulationDrafts(): Promise<ListSimulationDraftsResponse> {
  const response = await clientApiFetch('/api/me/simulations/drafts', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`simulation drafts fetch failed: ${response.status}`);
  }
  return (await response.json()) as ListSimulationDraftsResponse;
}

/** Query key único de "mis borradores" (US-023): crear/editar/borrar/publicar invalidan este mismo
 * key, así que vive exportado en vez de repetir el literal en cada action/componente. */
export const SIMULATION_DRAFTS_QUERY_KEY = ['plan', 'simulation-drafts'] as const;

/**
 * Borradores guardados del alumno (US-023): todos los estados (Draft/Active/Archived), sin
 * filtrar. `PlanShell` agrupa por status + `termId` para decidir qué mostrar en "En curso" (el
 * Active del período elegido) y en "Borradores" (los Draft).
 */
export const simulationDraftsQueries = {
  list: () =>
    queryOptions({
      queryKey: SIMULATION_DRAFTS_QUERY_KEY,
      queryFn: fetchSimulationDrafts,
    }),
};

async function fetchPublicSimulations(
  careerPlanId: string,
  termId: string,
  cursor: string | null,
): Promise<ListPublicSimulationsResponse> {
  const params = new URLSearchParams({ careerPlanId, termId });
  if (cursor) params.set('cursor', cursor);
  const response = await clientApiFetch(`/api/simulations/public?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`public simulations fetch failed: ${response.status}`);
  }
  return (await response.json()) as ListPublicSimulationsResponse;
}

/**
 * Feed de simulaciones públicas del mismo plan de carrera + período (US-027), paginado por cursor
 * opaco (no offset/page): primer `useInfiniteQuery` del frontend (Reviews pagina por page/pageSize,
 * ver `browse-reviews`). `initialPageParam` es `null` (primera página, sin cursor); `getNextPageParam`
 * devuelve `nextCursor` tal cual, que TanStack Query trata como "no hay más páginas" tanto si es
 * `null` como `undefined` (`hasNextPage` chequea `!= null`), así que no hace falta mapear el null a
 * undefined a mano.
 */
/**
 * Prefijo del feed público. Se invalida por prefijo (sin plan ni período) porque una mutación no
 * sabe en qué combinación está parado el que mira: `invalidateQueries` matchea por prefijo.
 *
 * **Toda mutación sobre un borrador que pueda cambiar lo que ve la comunidad invalida esto**, no
 * solo `SIMULATION_DRAFTS_QUERY_KEY`: compartir agrega al feed, descompartir y borrar sacan,
 * editar cambia el contenido, y publicar archiva el Active anterior, que si estaba compartido
 * también desaparece. Crear es la única que no puede afectarlo, porque un borrador nace privado.
 */
export const PUBLIC_SIMULATIONS_QUERY_KEY = ['plan', 'public-simulations'] as const;

export const publicSimulationsQueries = {
  feed: (careerPlanId: string, termId: string) =>
    infiniteQueryOptions({
      queryKey: [...PUBLIC_SIMULATIONS_QUERY_KEY, careerPlanId, termId] as const,
      queryFn: ({ pageParam }: { pageParam: string | null }) =>
        fetchPublicSimulations(careerPlanId, termId, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage: ListPublicSimulationsResponse) => lastPage.nextCursor,
    }),
};
