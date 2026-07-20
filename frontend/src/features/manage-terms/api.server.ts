import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminTermRow, TermDetail } from './types';

/**
 * Listado admin de períodos lectivos de una universidad (US-064). GET
 * /api/academic/universities/{universityId}/terms, gateado a rol admin: se lee con el fetcher
 * server-only que forwardea la cookie de sesión. Orden year desc, number desc (lo define el reader
 * Dapper del backend).
 */
export async function fetchTermsByUniversityServer(universityId: string): Promise<AdminTermRow[]> {
  const res = await apiFetchAuthenticated(`/api/academic/universities/${universityId}/terms`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`admin terms list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminTermRow[] };
  return data.items;
}

/**
 * Detalle de un período lectivo para prefillear el form de edición. GET
 * /api/academic/academic-terms/{id} (admin). Devuelve null si no existe (404).
 */
export async function fetchTermDetailServer(id: string): Promise<TermDetail | null> {
  const res = await apiFetchAuthenticated(`/api/academic/academic-terms/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`academic term detail failed with ${res.status}`);
  }
  return (await res.json()) as TermDetail;
}
