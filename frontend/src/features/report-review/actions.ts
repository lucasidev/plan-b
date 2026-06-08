'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { reportReviewSchema } from './schema';
import type { ReportReviewResult } from './types';

/**
 * Report-review server action (US-019). Posts to POST /api/reviews/{id}/reports. No
 * redirect: the modal stays mounted to show a success confirmation or an inline error
 * (e.g. you already reported it, or you tried to report your own).
 *
 * The public feed is anonymous, so the UI cannot pre-hide the report action on the user's
 * own reviews; the backend returns 403 in that case and we surface a friendly message.
 */
export async function reportReviewAction(
  _prev: ReportReviewResult,
  formData: FormData,
): Promise<ReportReviewResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const reviewId = formData.get('reviewId')?.toString();
  if (!reviewId) {
    return { status: 'error', message: 'Faltan datos del formulario.' };
  }

  const parsed = reportReviewSchema.safeParse({
    reason: formData.get('reason')?.toString(),
    details: formData.get('details')?.toString(),
  });
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Elegí un motivo válido.',
    };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/reviews/${reviewId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: parsed.data.reason, details: parsed.data.details ?? null }),
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (response.status === 201) {
    return { status: 'success' };
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 403) {
    return { status: 'error', message: 'No podés reportar tu propia reseña.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la reseña.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ya reportaste esta reseña.' };
  }
  if (response.status === 429) {
    return { status: 'error', message: 'Hiciste demasiados reportes. Probá más tarde.' };
  }
  return {
    status: 'error',
    message: 'No pudimos enviar el reporte. Probá de nuevo en un rato.',
  };
}
