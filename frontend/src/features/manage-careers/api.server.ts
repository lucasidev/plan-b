import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminCareerRow, CareerDetail, CareerPlanRow } from './types';

/**
 * Listado admin de carreras de una universidad (US-061). GET
 * /api/academic/universities/{universityId}/careers, gateado a rol admin: se lee con el fetcher
 * server-only que forwardea la cookie de sesión. Trae activas + inactivas. Ojo: NO es la ruta
 * pública `/api/academic/careers` (esa es el catálogo AllowAnonymous que consume el onboarding).
 */
export async function fetchCareersByUniversityServer(
  universityId: string,
): Promise<AdminCareerRow[]> {
  const res = await apiFetchAuthenticated(`/api/academic/universities/${universityId}/careers`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin careers list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminCareerRow[] };
  return data.items;
}

/**
 * Detalle de una carrera para prefillear el form de edición y el header del detalle. GET
 * /api/academic/careers/{id} (admin). Devuelve null si no existe (404).
 */
export async function fetchCareerDetailServer(id: string): Promise<CareerDetail | null> {
  const res = await apiFetchAuthenticated(`/api/academic/careers/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`career detail failed with ${res.status}`);
  }
  return (await res.json()) as CareerDetail;
}

/**
 * Planes de estudio de una carrera (US-061). GET /api/academic/careers/{careerId}/plans (admin).
 * Trae Active + Deprecated, para el panel de planes del detalle.
 */
export async function fetchCareerPlansServer(careerId: string): Promise<CareerPlanRow[]> {
  const res = await apiFetchAuthenticated(`/api/academic/careers/${careerId}/plans`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`career plans list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: CareerPlanRow[] };
  return data.items;
}
