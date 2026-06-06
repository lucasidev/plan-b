'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { reviewFormSchema } from './schema';
import type { PublishReviewResult } from './types';

/**
 * Placeholder teacher id. The Teacher aggregate does not exist yet in Academic; once
 * US-063 lands the editor will receive the real teacherId from the enrollment context
 * and we can drop this.
 *
 * Has to be a non-empty Guid so the backend's `NotEmpty()` validator on
 * `DocenteResenadoId` passes (the empty UUID would 400). The Reviews backend does NOT
 * verify against an existing Teacher row yet (per US-017 doc), so any well-formed Guid
 * is accepted.
 */
const PLACEHOLDER_TEACHER_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Publish-review server action (US-049 editor + US-048 e2e wiring).
 *
 * Maps the v2 editor draft (rating, difficulty, hoursPerWeek, tags, text, recommendations)
 * onto the legacy US-017 publish payload (difficultyRating, subjectText, teacherText,
 * finalGrade). This is **lossy**: rating, hoursPerWeek, tags, wouldRecommendCourse and
 * wouldRetakeTeacher are NOT persisted today. They will be once the backend rework US
 * extends the `Review` aggregate + table; until then the editor stores them in browser
 * state only.
 *
 * The lossy decision is intentional for PR-A of US-048: the goal of this slice is to
 * close the e2e flow (see pending → click → write → publish → cursada disappears from
 * pending). Persisting every editor field is scope for a separate US.
 *
 * After a 201 we revalidate `/reviews` (the pending list is server-rendered) and
 * redirect to the Pendientes tab so the student observes the cursada disappearing.
 */
export async function publishReviewAction(
  _prev: PublishReviewResult,
  formData: FormData,
): Promise<PublishReviewResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const enrollmentId = formData.get('enrollmentId')?.toString();
  const raw = formData.get('payload');
  if (!enrollmentId || typeof raw !== 'string') {
    return { status: 'error', message: 'Faltan datos del formulario.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'No pude leer el formulario.' };
  }

  const validated = reviewFormSchema.safeParse(parsed);
  if (!validated.success) {
    return {
      status: 'error',
      message: validated.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const body = {
    enrollmentId,
    docenteResenadoId: PLACEHOLDER_TEACHER_ID,
    difficultyRating: validated.data.difficulty,
    subjectText: validated.data.text ?? null,
    teacherText: null,
    finalGrade: null,
  };

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (response.status === 201) {
    revalidatePath('/reviews');
    redirect('/reviews?tab=pending');
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la cursada.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ya escribiste una reseña para esta cursada.' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Los datos no son válidos. Revisá los campos.' };
  }
  return {
    status: 'error',
    message: 'No pudimos publicar la reseña. Probá de nuevo en un rato.',
  };
}
