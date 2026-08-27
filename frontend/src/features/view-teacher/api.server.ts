import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { TeacherChair } from './components/teacher-chairs';
import type { TeacherDetail } from './types';

/**
 * Server fetchers de la ficha pública de un docente (US-003, US-132). La página es server-rendered
 * y los dos endpoints son públicos (AllowAnonymous): `apiFetchAuthenticated` reenvía la cookie de
 * sesión si la hay, pero anda igual sin ninguna, así que un visitante anónimo ve lo mismo.
 */

/**
 * Teacher metadata. Distinguishes three cases the page reacts to differently:
 *  - `ok`: the teacher exists and is active.
 *  - `removed`: the teacher was soft-deleted (backend returns 410 Gone, US-003 AC); the page shows
 *    "ya no figura en el catálogo" instead of a 404.
 *  - `notfound`: no teacher with that id (404); the page calls `notFound()`.
 */
export async function fetchTeacherServer(
  teacherId: string,
): Promise<{ kind: 'ok'; teacher: TeacherDetail } | { kind: 'removed' } | { kind: 'notfound' }> {
  const response = await apiFetchAuthenticated(`/api/academic/teachers/${teacherId}`, {
    cache: 'no-store',
  });
  if (response.status === 404) {
    return { kind: 'notfound' };
  }
  if (response.status === 410) {
    return { kind: 'removed' };
  }
  if (!response.ok) {
    throw new Error(`Teacher fetch failed: ${response.status}`);
  }
  return { kind: 'ok', teacher: (await response.json()) as TeacherDetail };
}

/**
 * Las cátedras que el docente integra o integró (US-132). Es el camino de la persona al sujeto:
 * lo que el producto publica es de la cátedra, no del docente.
 *
 * Devuelve lista vacía cuando no integra ninguna: la ficha simplemente no muestra la sección, en
 * vez de un bloque con un mensaje de que no hay nada.
 */
export async function fetchTeacherChairsServer(teacherId: string): Promise<TeacherChair[]> {
  const response = await apiFetchAuthenticated(`/api/academic/teachers/${teacherId}/chairs`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Teacher chairs fetch failed: ${response.status}`);
  }

  return (await response.json()) as TeacherChair[];
}
