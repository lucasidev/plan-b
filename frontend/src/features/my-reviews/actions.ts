'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ActionState } from './types';

/**
 * Server Actions de corregir y borrar lo aportado (US-165, ADR-0046).
 *
 * Mutaciones puras: hacen el write y devuelven el estado. No llaman `revalidatePath` ni `redirect`
 * adentro; de eso se encarga el cliente cuando ve el `status`.
 */

/**
 * Corrige una reseña propia.
 *
 * `answers` es el set **completo** de lo que queda respondido: lo que no viene deja de contarse.
 * Eso es deliberado y es la mitad de por qué alguien edita, porque dejar de contestar algo es una
 * corrección tan válida como cambiar la respuesta.
 */
export async function reviseReviewAction(
  reviewId: string,
  answers: Record<string, number>,
  freeText: string | null,
): Promise<ActionState> {
  const response = await apiFetchAuthenticated(`/api/reviews/courses/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify({
      answers: Object.entries(answers).map(([itemCode, optionValue]) => ({
        itemCode,
        optionValue,
      })),
      freeText: freeText && freeText.trim().length > 0 ? freeText.trim() : null,
    }),
  });

  if (response.ok) {
    return { status: 'success' };
  }

  if (response.status === 404) {
    return { status: 'error', message: 'Esa reseña ya no está.' };
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  return {
    status: 'error',
    message: 'No pudimos guardar la corrección. Probá de nuevo en un rato.',
  };
}

/**
 * Borra una reseña propia.
 *
 * Es borrado real: los conteos de la ficha lo reflejan en la siguiente lectura, y eso está bien,
 * porque lo que se publica es lo que hoy sostienen sus voces. Es además el mecanismo que la
 * pantalla de baja de cuenta ya promete: quien quiere sacar algo lo borra antes, de a uno.
 */
export async function deleteReviewAction(reviewId: string): Promise<ActionState> {
  const response = await apiFetchAuthenticated(`/api/reviews/courses/${reviewId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    return { status: 'success' };
  }

  if (response.status === 404) {
    return { status: 'error', message: 'Esa reseña ya no está.' };
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  return { status: 'error', message: 'No pudimos borrarla. Probá de nuevo en un rato.' };
}
