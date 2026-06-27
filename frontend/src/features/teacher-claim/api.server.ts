import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { TeacherClaim } from './types';

/**
 * Server fetcher de los claims docentes del user autenticado (US-030). La página /teacher-claim lo
 * usa para mostrar el estado de cada reclamo (pendiente / verificado).
 */
export async function fetchMyTeacherClaimsServer(): Promise<TeacherClaim[]> {
  const response = await apiFetchAuthenticated('/api/me/teacher-claims', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Teacher claims fetch failed: ${response.status}`);
  }
  return (await response.json()) as TeacherClaim[];
}
