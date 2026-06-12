'use server';

import { z } from 'zod';
import type { PublishReviewResult } from '@/features/write-review/types';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';

/**
 * Schema for the edit payload. <c>difficulty</c> and <c>text</c> map straight to the PATCH;
 * <c>rating</c> is parsed but optional because in edit mode the editor starts it at the 0
 * "unset" sentinel (the persisted rating is not loaded into the editor yet, that is the read
 * side US-002 wires). The recommend/retake toggles and hoursPerWeek/tags are intentionally NOT
 * parsed here: see the body-construction comment for why sending them on edit would clobber.
 */
const editPayloadSchema = z.object({
  difficulty: z
    .number()
    .int('Tiene que ser un número entero')
    .min(1, 'Elegí una dificultad')
    .max(5, 'Máximo 5'),
  rating: z.number().int().min(0).max(5).optional(),
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
 * US-089 added full-model persistence on the backend, but edit only sends what it can
 * represent faithfully: difficulty, text, and overallRating (the latter only when the user
 * actually picked a rating). hoursPerWeek, tags and the recommend/retake toggles are NOT sent
 * on edit yet: the editor does not load their persisted values (read side is US-002), so the
 * draft holds editor defaults, and PATCHing those would silently overwrite the real stored
 * values. The backend partial-update semantics leave any omitted field untouched. Once the
 * read side hydrates the editor with the persisted review, this action can send them all.
 *
 * On a 200 this returns `{ status: 'success' }` and nothing else: no `revalidatePath`,
 * no `redirect()`. The editor reacts client-side (invalidate + router.push). Inlining a
 * re-render of /reviews into the action response intermittently stalls the response
 * stream in prod; see `write-review/actions.ts` for the full rationale.
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

  // The backend partial-update treats any present key as "set this value", so we only include
  // the fields the editor can represent without clobbering: difficulty + text always, and
  // overallRating only when the user actually picked one (rating >= 1; the 0 sentinel means
  // "untouched in edit mode", so we omit it and the backend keeps the stored value).
  const body: Record<string, unknown> = {
    difficultyRating: validated.data.difficulty,
    subjectText: validated.data.text ?? '',
  };
  if (typeof validated.data.rating === 'number' && validated.data.rating >= 1) {
    body.overallRating = validated.data.rating;
  }

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
    return { status: 'success', reviewId };
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
