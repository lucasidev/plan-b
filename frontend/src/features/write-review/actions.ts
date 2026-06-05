'use server';

import { redirect } from 'next/navigation';
import { reviewFormSchema } from './schema';
import type { PublishReviewResult } from './types';

/**
 * Stub server action to publish a review (US-049). Does NOT call the real backend: the
 * current `POST /api/reviews` (US-017) follows a legacy model
 * (subjectText/teacherText/finalGrade) that does not accept the new fields (rating,
 * hoursPerWeek, tags, recommendations). Until the backend rework lands, this action
 * simulates 700ms of latency and returns a synthetic id so the editor's end-to-end flow
 * is visible.
 *
 * When the real endpoint lands, this function will attach to
 * `apiFetchAuthenticated('POST', '/api/reviews', body)` and stop redirecting manually:
 * the caller will handle the response.
 */
export async function publishReviewAction(
  _prev: PublishReviewResult,
  formData: FormData,
): Promise<PublishReviewResult> {
  const raw = formData.get('payload');
  if (typeof raw !== 'string') {
    return { status: 'error', message: 'Payload inválido.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'No pude leer el formulario.' };
  }

  const validated = reviewFormSchema.safeParse(parsed);
  if (!validated.success) {
    // The client already runs Zod validation; reaching here means a tampered payload or
    // a bug.
    return {
      status: 'error',
      message: validated.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  // Latency mock. The synthetic id is stable per session so demos stay reproducible; in
  // production it comes from the backend.
  await new Promise((r) => setTimeout(r, 700));
  const reviewId = `mock-${Date.now().toString(36)}`;

  // After publishing, US-048 will send to `/reviews?tab=mine`. That shell does not exist
  // yet, so for now we redirect to `/home` with a searchParam the home page can read to
  // show a "review published" toast once that piece lands (TODO).
  redirect(`/home?published-review=${reviewId}`);
}
