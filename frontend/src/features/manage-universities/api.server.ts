import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminUniversityRow, UniversityDetail } from './types';

/**
 * Listado admin de universidades (US-060). GET /api/academic/universities/admin, gateado a rol
 * admin: se lee con el fetcher server-only que forwardea la cookie de sesión. Trae activas +
 * inactivas. Ojo: NO es la ruta desnuda (`/api/academic/universities`, sin `/admin`) - esa sigue
 * siendo el catálogo público AllowAnonymous que consume el onboarding (US-037).
 */
export async function fetchAdminUniversitiesServer(): Promise<AdminUniversityRow[]> {
  const res = await apiFetchAuthenticated('/api/academic/universities/admin', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin universities list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminUniversityRow[] };
  return data.items;
}

/**
 * Detalle de una universidad para prefillear el form de edición. GET /api/academic/universities/{id}
 * (admin: a diferencia del endpoint homólogo de docentes, este no es público). Devuelve null si no
 * existe (404).
 */
export async function fetchUniversityDetailServer(id: string): Promise<UniversityDetail | null> {
  const res = await apiFetchAuthenticated(`/api/academic/universities/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`university detail failed with ${res.status}`);
  }
  return (await res.json()) as UniversityDetail;
}
