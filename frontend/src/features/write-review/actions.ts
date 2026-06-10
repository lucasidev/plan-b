'use server';

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
 * The lossy decision is intentional (US-048): the goal was to close the e2e flow
 * (pending → click → write → publish → cursada disappears from pending). Persisting
 * every editor field is US-089.
 *
 * On a 201 this returns `{ status: 'success' }` and nothing else: no `revalidatePath`,
 * no `redirect()`. The editor reacts client-side (invalidate + router.push). See the
 * comment at the 201 branch for why inlining a re-render into the action response is
 * not safe in this app.
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
    // Pure mutation: no revalidatePath / redirect here. Inlining the re-render of
    // /reviews into the action response intermittently stalls the response stream in
    // prod (`next start`): the client gets the 303 headers and a chunked body that
    // never terminates, leaving the form transition pending forever (verified against
    // Next 15.5.15 with a statistical repro; plain flight GETs to the same page never
    // stall). /reviews is force-dynamic, so revalidatePath bought nothing anyway.
    // The editor component reacts to this success result: it invalidates the affected
    // TanStack queries and router.push()es, which re-fetches the page as a normal
    // flight request.
    const created = (await response.json().catch(() => null)) as { id?: string } | null;
    return { status: 'success', reviewId: created?.id ?? '' };
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
