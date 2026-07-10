'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { ReportDecision, ResolveResult } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para moderar.';
const MAX_NOTE = 1000;

async function isStaff(): Promise<boolean> {
  const session = await getSession();
  return !!session && (session.role === 'moderator' || session.role === 'admin');
}

/**
 * Resuelve un report (US-051): `dismiss` (aprobar, la reseña se queda) o `uphold` (ocultar la reseña +
 * cascade a los otros reports open). Mutación pura (ADR-0046): hace el POST y devuelve el resultado; el
 * cliente reacciona navegando de vuelta a la cola. El 409 (otro moderador ganó la race) se marca con
 * `conflict` para que el cliente muestre el toast correcto y vuelva a la cola.
 */
export async function resolveReportAction(
  reportId: string,
  decision: ReportDecision,
  resolutionNote: string,
): Promise<ResolveResult> {
  if (!(await isStaff())) {
    return { ok: false, message: SESSION_EXPIRED };
  }

  const note = resolutionNote.trim();
  if (note.length > MAX_NOTE) {
    return { ok: false, message: `La nota no puede superar los ${MAX_NOTE} caracteres.` };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/moderation/reports/${reportId}/${decision}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolutionNote: note.length > 0 ? note : null }),
    });
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }

  if (response.ok) {
    const data = (await response.json()) as { cascadedCount?: number };
    return { ok: true, cascadedCount: data.cascadedCount ?? 0 };
  }
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos el reporte.' };
  if (response.status === 409) {
    return { ok: false, message: 'Este reporte ya lo resolvió otro moderador.', conflict: true };
  }
  return { ok: false, message: 'No pudimos aplicar la decisión. Probá de nuevo.' };
}
