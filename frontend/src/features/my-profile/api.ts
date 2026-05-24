import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { MyProfile } from './types';

/**
 * GET /api/me/student-profile (US-047). Devuelve el perfil activo con todos los campos
 * editables + email + memberSince. Si el user no tiene profile (404), devuelve null y la
 * page redirige a onboarding (el layout guard ya cubre ese caso, así que en práctica acá
 * casi nunca llegamos a null).
 */
export async function fetchMyProfile(): Promise<MyProfile | null> {
  const response = await apiFetchAuthenticated('/api/me/student-profile');
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch profile (status=${response.status})`);
  }
  return (await response.json()) as MyProfile;
}

/**
 * PATCH /api/me/student-profile (US-047). Devuelve el Response crudo para que el caller
 * branchee por status: 204 OK, 400 validation, 401 sesión expirada, 403 inactivo.
 */
export function patchMyProfile(patch: Record<string, unknown>): Promise<Response> {
  return apiFetchAuthenticated('/api/me/student-profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
