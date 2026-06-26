'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { reviewFormSchema } from './schema';
import type { PublishReviewResult } from './types';

/**
 * Publish-review server action (US-049 editor + US-048 e2e wiring).
 *
 * Maps the full v2 editor draft (rating, difficulty, hoursPerWeek, tags, text, recommendations)
 * onto the `POST /api/reviews` body. US-089 extended the `Review` aggregate + table so every
 * editor field now persists; the previously lossy mapping (only difficulty + text reached the
 * backend) is gone.
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

  // Docente real elegido en el picker (US-065): la reseña se ancla a un docente de la comisión de
  // la cursada, no a un placeholder. El backend valida que pertenezca a la comisión.
  const docenteResenadoId = formData.get('docenteResenadoId')?.toString();
  if (!docenteResenadoId) {
    return { status: 'error', message: 'Elegí el docente que te dio la cursada.' };
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
    docenteResenadoId,
    difficultyRating: validated.data.difficulty,
    overallRating: validated.data.rating,
    hoursPerWeek: validated.data.hoursPerWeek ?? null,
    tags: validated.data.tags,
    wouldRecommendCourse: validated.data.wouldRecommendCourse,
    wouldRetakeTeacher: validated.data.wouldRetakeTeacher,
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
