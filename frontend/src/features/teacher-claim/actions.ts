'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { ClaimFormState } from './types';

/**
 * Server action de iniciar claim docente (US-030). POST /api/me/teacher-claims con el teacherId.
 *
 * Mutación pura (ADR-0046): devuelve `{ status }` sin `revalidatePath`/`redirect`. El componente
 * reacciona al `status: 'success'` haciendo `router.refresh()` para re-renderizar la página server
 * (re-fetch de los claims) y limpiar la búsqueda.
 */
export async function initiateTeacherClaimAction(
  _prev: ClaimFormState,
  formData: FormData,
): Promise<ClaimFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const teacherId = formData.get('teacherId')?.toString();
  if (!teacherId) {
    return { status: 'error', message: 'Elegí un docente para reclamar.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/me/teacher-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId }),
    });
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.status === 201) {
    return { status: 'success', teacherId };
  }
  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ya reclamaste este docente.' };
  }
  if (response.status === 410) {
    return { status: 'error', message: 'Ese docente ya no está disponible.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos ese docente.' };
  }
  if (response.status === 403) {
    return { status: 'error', message: 'Tu cuenta no puede reclamar identidad docente.' };
  }
  return { status: 'error', message: 'No pudimos iniciar el reclamo. Probá de nuevo en un rato.' };
}
