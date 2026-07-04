'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { RespondFormState } from './types';

/**
 * Server action de responder reseña (US-040). POST /api/reviews/{id}/teacher-response. Solo el
 * docente verificado reseñado puede; el backend valida la authz cross-BC. Mutación pura (ADR-0046):
 * el form reacciona al success con router.refresh() para re-renderizar la página con la respuesta.
 */
export async function respondToReviewAction(
  _prev: RespondFormState,
  formData: FormData,
): Promise<RespondFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const reviewId = formData.get('reviewId')?.toString();
  const text = formData.get('text')?.toString();
  if (!reviewId || !text) {
    return { status: 'error', message: 'Escribí tu respuesta.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/reviews/${reviewId}/teacher-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Tu respuesta tiene que tener entre 50 y 2000 caracteres.' };
  }
  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 403) {
    return {
      status: 'error',
      message: 'Solo el docente verificado de esta reseña puede responder.',
    };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la reseña.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Esta reseña ya tiene una respuesta.' };
  }
  return {
    status: 'error',
    message: 'No pudimos publicar la respuesta. Probá de nuevo en un rato.',
  };
}

/**
 * Server action de editar la respuesta del docente (US-041). PATCH /api/reviews/{id}/teacher-response.
 * Solo el docente verificado que respondió puede; el backend revalida verified + cooldown (3/24h).
 * Mutación pura (ADR-0046): el form reacciona al success con router.refresh().
 */
export async function editTeacherResponseAction(
  _prev: RespondFormState,
  formData: FormData,
): Promise<RespondFormState> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const reviewId = formData.get('reviewId')?.toString();
  const text = formData.get('text')?.toString();
  if (!reviewId || !text) {
    return { status: 'error', message: 'Escribí tu respuesta.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/reviews/${reviewId}/teacher-response`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    return { status: 'error', message: 'No pudimos conectarnos al servidor. Probá de nuevo.' };
  }

  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Tu respuesta tiene que tener entre 50 y 2000 caracteres.' };
  }
  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 403) {
    return {
      status: 'error',
      message: 'Solo el docente verificado de esta reseña puede editar la respuesta.',
    };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la respuesta.' };
  }
  if (response.status === 429) {
    return {
      status: 'error',
      message: 'Editaste tu respuesta demasiadas veces hoy. Probá mañana.',
    };
  }
  return { status: 'error', message: 'No pudimos guardar los cambios. Probá de nuevo en un rato.' };
}
