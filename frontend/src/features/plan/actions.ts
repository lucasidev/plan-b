'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ProblemDetails } from '@/lib/api-problem';
import { getSession } from '@/lib/session';
import type {
  CommissionSelection,
  DeleteDraftResult,
  PromoteDraftResult,
  SaveDraftResult,
  ShareDraftResult,
  SimulationDraftStatus,
  SimulationDraftVisibility,
} from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const RATE_LIMITED = 'Alcanzaste el límite de guardados por hora. Probá de nuevo más tarde.';

function toItemsBody(items: readonly CommissionSelection[]) {
  return items.map((item) => ({ subjectId: item.subjectId, commissionId: item.commissionId }));
}

/**
 * Guarda la combinación armada en "En curso" como un borrador nuevo (US-023). POST
 * /api/me/simulations/drafts. Mutación pura (ADR-0046): el cliente invalida
 * `SIMULATION_DRAFTS_QUERY_KEY` al ver `status: 'success'`.
 */
export async function createSimulationDraftAction(
  termId: string,
  label: string | null,
  items: readonly CommissionSelection[],
): Promise<SaveDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/simulations/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId, label, items: toItemsBody(items) }),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 201) {
    const body = (await response.json()) as { id: string };
    return { status: 'success', id: body.id };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos guardar el borrador. Probá de nuevo en un rato.',
    ),
  };
}

/**
 * Edita label + materias de un borrador propio (US-023): reemplazo atómico. PATCH
 * /api/me/simulations/drafts/{id}.
 */
export async function updateSimulationDraftAction(
  draftId: string,
  label: string | null,
  items: readonly CommissionSelection[],
): Promise<SaveDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/simulations/drafts/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, items: toItemsBody(items) }),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 200) {
    const body = (await response.json()) as { id: string };
    return { status: 'success', id: body.id };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos guardar los cambios. Probá de nuevo en un rato.',
    ),
  };
}

/** Borra un borrador propio (US-023). DELETE /api/me/simulations/drafts/{id}, hard delete. */
export async function deleteSimulationDraftAction(draftId: string): Promise<DeleteDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/simulations/drafts/${draftId}`, {
      method: 'DELETE',
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 204) {
    return { status: 'success' };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos borrar el borrador. Probá de nuevo en un rato.',
    ),
  };
}

/**
 * Publica un borrador propio como plan vigente del período (US-023). POST
 * /api/me/simulations/drafts/{id}/promote. El backend archiva el plan Active anterior del mismo
 * período en la misma transacción; es idempotente si el borrador ya estaba Active.
 */
export async function promoteSimulationDraftAction(draftId: string): Promise<PromoteDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/simulations/drafts/${draftId}/promote`, {
      method: 'POST',
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 200) {
    const body = (await response.json()) as { id: string; status: SimulationDraftStatus };
    return { status: 'success', draftStatus: body.status };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos publicar el borrador. Probá de nuevo en un rato.',
    ),
  };
}

/**
 * Comparte un borrador propio al corpus público (US-024). POST
 * /api/me/simulations/drafts/{id}/share. Idempotente en el backend (compartir uno ya Shared
 * responde 200 con el estado actual, no falla): el cliente no distingue "recién compartido" de "ya
 * estaba compartido", ambos casos son success. Reusa `mapDraftError`: los únicos códigos que puede
 * devolver este endpoint (`not_found`, `not_owner`, `student_profile_required`) ya están cubiertos
 * ahí por las otras mutaciones de borrador.
 */
export async function shareSimulationDraftAction(draftId: string): Promise<ShareDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/simulations/drafts/${draftId}/share`, {
      method: 'POST',
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 200) {
    const body = (await response.json()) as { id: string; visibility: SimulationDraftVisibility };
    return { status: 'success', visibility: body.visibility };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos compartir el borrador. Probá de nuevo en un rato.',
    ),
  };
}

/**
 * Deja de compartir un borrador propio (US-024). POST /api/me/simulations/drafts/{id}/unshare.
 * Mismo criterio idempotente que compartir: uno ya Private responde 200 sin fallar.
 */
export async function unshareSimulationDraftAction(draftId: string): Promise<ShareDraftResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/simulations/drafts/${draftId}/unshare`, {
      method: 'POST',
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.status === 200) {
    const body = (await response.json()) as { id: string; visibility: SimulationDraftVisibility };
    return { status: 'success', visibility: body.visibility };
  }

  return {
    status: 'error',
    message: await mapDraftError(
      response,
      'No pudimos dejar de compartir el borrador. Probá de nuevo en un rato.',
    ),
  };
}

/**
 * Mapeo de errores compartido por las mutaciones de borradores (US-023 + US-024). El backend
 * responde RFC 7807 (`title` = código de dominio, `detail` = mensaje): se distingue primero por
 * `title` (cubre todos los códigos de negocio, incluido el 429 de rate limit) y recién después por
 * status HTTP genérico para lo que no matcheó ningún código conocido.
 */
async function mapDraftError(response: Response, fallback: string): Promise<string> {
  const body = await readJsonBody<ProblemDetails>(response);
  switch (body?.title) {
    case 'planning.simulation_draft.items_required':
      return 'Elegí al menos una materia para guardar el borrador.';
    case 'planning.simulation_draft.duplicate_subject':
      return 'Una materia no puede aparecer dos veces en el mismo borrador.';
    case 'planning.simulation_draft.label_too_long':
      return 'El nombre del borrador es demasiado largo.';
    case 'planning.simulation_draft.subject_not_in_plan':
      return 'Alguna de estas materias no pertenece a tu plan de estudios.';
    case 'planning.simulation_draft.not_found':
      return 'No encontramos ese borrador. Puede que ya lo hayas borrado.';
    case 'planning.simulation_draft.not_owner':
      return 'Ese borrador no te pertenece.';
    case 'planning.simulation_draft.cannot_promote':
      return 'Este borrador ya no se puede publicar: no está en estado borrador.';
    case 'planning.simulation_draft.rate_limit_exceeded':
      return RATE_LIMITED;
    case 'planning.simulator.student_profile_required':
      return 'No encontramos tu perfil de alumno. Volvé a iniciar sesión.';
    default:
      break;
  }

  if (response.status === 429) return RATE_LIMITED;
  if (response.status === 401) return SESSION_EXPIRED;
  if (response.status === 403) return 'Ese borrador no te pertenece.';
  if (response.status === 404) return 'No encontramos ese borrador. Puede que ya lo hayas borrado.';
  return fallback;
}

/** Lee el body JSON de una response de error sin tirar si no es JSON válido o está vacío. */
async function readJsonBody<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}
