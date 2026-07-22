import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AvailableSubjectsResponse } from './types';

/**
 * Materias del plan evaluadas por el planificador (US-016). GET /api/me/simulator/available,
 * autenticado (alumno con StudentProfile activo). Usado por la RSC de /plan para prefetchear +
 * hidratar el drawer "Agregar materia" (`components/subject-picker-drawer.tsx`), así consume con
 * useSuspenseQuery sin un roundtrip extra al abrirse.
 */
export async function fetchAvailableSubjectsServer(): Promise<AvailableSubjectsResponse> {
  const res = await apiFetchAuthenticated('/api/me/simulator/available', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`available subjects fetch failed with ${res.status}`);
  }
  return (await res.json()) as AvailableSubjectsResponse;
}
