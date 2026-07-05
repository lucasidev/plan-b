import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminTeacherRow, TeacherDetail, University } from './types';

/**
 * Listado admin de docentes (US-063). GET /api/academic/teachers, gateado a rol admin: se lee con
 * el fetcher server-only que forwardea la cookie de sesión. Trae activos + inactivos.
 */
export async function fetchAdminTeachersServer(): Promise<AdminTeacherRow[]> {
  const res = await apiFetchAuthenticated('/api/academic/teachers', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`admin teachers list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AdminTeacherRow[] };
  return data.items;
}

/**
 * Detalle de un docente para prefillear el form de edición. Usa el GET público por id (trae
 * bio/photoUrl, a diferencia del listado). Devuelve null si no existe o está soft-deleted (410): la
 * edición es solo para activos, los inactivos se reactivan primero.
 */
export async function fetchTeacherDetailServer(id: string): Promise<TeacherDetail | null> {
  const res = await apiFetchAuthenticated(`/api/academic/teachers/${id}`, { cache: 'no-store' });
  if (res.status === 404 || res.status === 410) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`teacher detail failed with ${res.status}`);
  }
  return (await res.json()) as TeacherDetail;
}

/** Universidades para el select del alta. GET público. */
export async function fetchUniversitiesServer(): Promise<University[]> {
  const res = await apiFetchAuthenticated('/api/academic/universities', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`universities list failed with ${res.status}`);
  }
  return (await res.json()) as University[];
}
