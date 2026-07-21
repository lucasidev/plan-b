import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { AvailableSubjectsResponse, SimulationEvaluation } from './types';

/**
 * Query client-side de las materias disponibles para el simulador (US-016). La página /plan
 * prefetchea con el fetcher server-only (api.server) seedeando este mismo queryKey; el drawer
 * "Agregar materia" consume con useSuspenseQuery.
 */
async function fetchAvailableSubjects(): Promise<AvailableSubjectsResponse> {
  const response = await clientApiFetch('/api/me/simulator/available', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`available subjects fetch failed: ${response.status}`);
  }
  return (await response.json()) as AvailableSubjectsResponse;
}

export const availableSubjectsQueries = {
  list: () =>
    queryOptions({
      queryKey: ['plan', 'available-subjects'] as const,
      queryFn: fetchAvailableSubjects,
    }),
};

async function fetchSimulationEvaluation(
  subjectIds: readonly string[],
): Promise<SimulationEvaluation> {
  const response = await clientApiFetch('/api/me/simulator/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subjectIds }),
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
 * Query (no mutation) de evaluar una combinación de materias (US-016). El verb HTTP es POST
 * porque el subset de materias no entra en una query string, pero el backend lo trata como una
 * consulta de lectura que no persiste nada (ver EvaluateSimulationCommand.cs, ADR-0029): mismo
 * criterio que GetAvailableSubjects. Por eso useQuery con el subset ordenado adentro del
 * queryKey, no useMutation: el panel de métricas tiene que reaccionar solo a que cambie la
 * combinación elegida, sin que el componente dispare un mutate() a mano en un efecto, y useQuery
 * cachea por combinación (volver a una combinación ya evaluada no vuelve a pegarle a la red).
 * useMutation es para acciones iniciadas por el usuario con efectos (crear, editar, borrar); acá
 * no hay ninguno de los dos. Se ordena antes de armar la key porque el combo es sin orden (los
 * mismos ids en cualquier orden tienen que resolver al mismo cache entry). `enabled` en false con
 * la lista vacía: sin materias elegidas, no hay nada que evaluar.
 */
export const simulationEvaluationQueries = {
  forSubjects: (subjectIds: readonly string[]) => {
    const sortedIds = [...subjectIds].sort();
    return queryOptions({
      queryKey: ['plan', 'simulator', 'evaluate', sortedIds] as const,
      queryFn: () => fetchSimulationEvaluation(sortedIds),
      enabled: sortedIds.length > 0,
    });
  },
};
