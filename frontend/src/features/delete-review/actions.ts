'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import type { DeleteReviewResult } from './types';

/**
 * Delete-review server action (US-055). Soft-deletes the author's own review via
 * DELETE /api/me/reviews/{id}. The backend is idempotent, so a retry after a flaky
 * network is safe.
 *
 * Pure mutation: no `revalidatePath` (it made the action response inline a re-render of
 * /reviews, which intermittently stalls the response stream in prod; see
 * `write-review/actions.ts` for the rationale, and /reviews is force-dynamic anyway).
 * The modal handles the rest client-side: invalidate the TanStack queries + navigate.
 */
export async function deleteReviewAction(
  _prev: DeleteReviewResult,
  formData: FormData,
): Promise<DeleteReviewResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const reviewId = formData.get('reviewId')?.toString();
  if (!reviewId) {
    return { status: 'error', message: 'Faltan datos del formulario.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (response.status === 200) {
    return { status: 'success' };
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la reseña.' };
  }
  return {
    status: 'error',
    message: 'No pudimos borrar la reseña. Probá de nuevo en un rato.',
  };
}
