import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminSubjectRow, PrerequisiteEdge, SubjectDetail } from './types';

/**
 * Listado admin de materias de un plan de estudios (US-062). GET
 * /api/academic/career-plans/{planId}/subjects, gateado a rol admin: se lee con el fetcher
 * server-only que forwardea la cookie de sesión. Trae activas + archivadas.
 */
export async function fetchSubjectsByPlanServer(planId: string): Promise<AdminSubjectRow[]> {
  const res = await apiFetchAuthenticated(`/api/academic/career-plans/${planId}/subjects`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin subjects list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminSubjectRow[] };
  return data.items;
}

/**
 * Detalle de una materia para prefillear el form de edición. GET
 * /api/academic/career-plans/{planId}/subjects/{subjectId} (admin). Devuelve null si no existe (404).
 */
export async function fetchSubjectDetailServer(
  planId: string,
  subjectId: string,
): Promise<SubjectDetail | null> {
  const res = await apiFetchAuthenticated(
    `/api/academic/career-plans/${planId}/subjects/${subjectId}`,
    { cache: 'no-store' },
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`subject detail failed with ${res.status}`);
  }
  return (await res.json()) as SubjectDetail;
}

/**
 * Grafo de correlativas del plan entero (US-062), los dos tipos juntos (ADR-0003). GET
 * /api/academic/career-plans/{planId}/prerequisites (admin).
 */
export async function fetchPrerequisitesByPlanServer(planId: string): Promise<PrerequisiteEdge[]> {
  const res = await apiFetchAuthenticated(`/api/academic/career-plans/${planId}/prerequisites`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`prerequisites list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: PrerequisiteEdge[] };
  return data.items;
}
