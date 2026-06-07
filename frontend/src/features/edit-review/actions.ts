'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { PublishReviewResult } from '@/features/write-review/types';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';

/**
 * Schema for the edit payload. Looser than <c>reviewFormSchema</c>: rating and the
 * recommend / retake toggles are not required because the lossy backend mapping ignores
 * them anyway. Only the fields the backend persists today (difficulty + text) are
 * validated strictly.
 */
const editPayloadSchema = z.object({
  difficulty: z
    .number()
    .int('Tiene que ser un número entero')
    .min(1, 'Elegí una dificultad')
    .max(5, 'Máximo 5'),
  text: z
    .string()
    .trim()
    .max(4000, 'Máximo 4000 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

/**
 * Edit-review server action (US-018). Reads <c>reviewId</c> + <c>payload</c> from the
 * editor form (the same hidden inputs the publish flow uses, with the id field name
 * configurable), validates the draft with the shared Zod schema, and PATCHes the legacy
 * US-017 fields onto the backend.
 *
 * Carries the same lossy mapping as the publish action: rating, hoursPerWeek, tags,
 * wouldRecommendCourse and wouldRetakeTeacher are NOT persisted because the backend
 * still uses the US-017 model. They survive in the browser state during the editing
 * session but the backend never sees them. Lifting that ceiling is the backend-rework US.
 *
 * After a 200 we revalidate <c>/reviews</c> (Mías is server-rendered) and redirect to
 * the Mías tab so the student sees the updated card.
 */
export async function editReviewAction(
  _prev: PublishReviewResult,
  formData: FormData,
): Promise<PublishReviewResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const reviewId = formData.get('reviewId')?.toString();
  const raw = formData.get('payload');
  if (!reviewId || typeof raw !== 'string') {
    return { status: 'error', message: 'Faltan datos del formulario.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'No pude leer el formulario.' };
  }

  const validated = editPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    return {
      status: 'error',
      message: validated.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  // Only the backend-mappable fields go in the patch. The "provided" semantics on the
  // backend (US-018) treat any present key as "set this value": we always send the same
  // shape here so the diff is computed from the full editor state.
  const body = {
    difficultyRating: validated.data.difficulty,
    subjectText: validated.data.text ?? '',
  };

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/me/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (response.status === 200) {
    revalidatePath('/reviews');
    redirect('/reviews?tab=mine');
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la reseña.' };
  }
  if (response.status === 409) {
    return {
      status: 'error',
      message: 'La reseña está en revisión: no podés editarla hasta que el equipo decida.',
    };
  }
  if (response.status === 429) {
    return {
      status: 'error',
      message: 'Llegaste al máximo de ediciones por día. Probá mañana.',
    };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Los datos no son válidos. Revisá los campos.' };
  }
  return {
    status: 'error',
    message: 'No pudimos guardar los cambios. Probá de nuevo en un rato.',
  };
}
