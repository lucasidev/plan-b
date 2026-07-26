import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { AvailableSubjectsResponse, CommissionSelection, SimulationEvaluation } from './types';

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
