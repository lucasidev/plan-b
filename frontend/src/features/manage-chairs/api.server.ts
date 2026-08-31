import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AdminChair } from './types';

/**
 * Las cátedras de una materia para el backoffice (US-196), con su equipo y sus tramos cerrados.
 *
 * Cuelga de `/api/academic/chairs` y no de `/subjects/{id}/chairs`: esa ruta la ocupa el listado
 * público, que devuelve solo las activas con su titular vigente. Son dos representaciones del mismo
 * conjunto, y quien carga necesita ver lo que archivó para poder corregirse.
 */
export async function fetchAdminChairsServer(subjectId: string): Promise<AdminChair[]> {
  const res = await apiFetchAuthenticated(`/api/academic/chairs?subjectId=${subjectId}`, {
    cache: 'no-store',
  });

  // El 401 es la carrera entre el guard del layout y la page, que renderizan en paralelo: no es una
  // falla, y tirar acá la convierte en un 500 en la pantalla que el guard estaba por dejar atrás.
  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`admin chairs list failed with ${res.status}`);
  }

  return (await res.json()) as AdminChair[];
}
