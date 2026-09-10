'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { ImportAgnAuditsResult } from './types';

const NO_PERMISSION = 'No tenés permisos para actualizar las auditorías.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';

/** Los códigos de error del backend, cada uno diciendo qué pasó y no "algo salió mal" (issue #506, "la trampa" incluida). */
const MESSAGES: Record<string, string> = {
  'academic.agn_audit.fetch_failed':
    'No pudimos consultar a la AGN. Puede estar caída o tardando: probá de nuevo en un rato.',
  'academic.agn_audit.incomplete_report':
    'Un informe llegó incompleto (sin título, año o link). No se cargó nada: revisalo a mano.',
  'academic.agn_audit.sanity_check_failed':
    'La consulta a la AGN no es confiable ahora mismo: el control de prueba no devolvió nada. No se cargó nada, probá de nuevo más tarde.',
};

/**
 * Dispara la importación de auditorías de la AGN (issue #506). Mutación pura (ADR-0046): hace el
 * POST y devuelve el status; la pantalla reacciona refrescando el listado (que trae el detalle por
 * institución, no duplicado acá).
 */
export async function importAgnAuditsAction(): Promise<ImportAgnAuditsResult> {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return { status: 'error', message: NO_PERMISSION };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/academic/agn-audits/import', { method: 'POST' });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.ok) {
    const body = (await response.json()) as { auditsLoaded: number };
    return { status: 'success', auditsLoaded: body.auditsLoaded };
  }

  if (response.status === 401 || response.status === 403) {
    return { status: 'error', message: NO_PERMISSION };
  }

  const problem = (await response.json().catch(() => null)) as { title?: string } | null;
  return {
    status: 'error',
    message:
      MESSAGES[problem?.title ?? ''] ?? 'No pudimos actualizar las auditorías. Probá de nuevo.',
  };
}
