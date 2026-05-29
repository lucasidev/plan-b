'use server';

import { redirect } from 'next/navigation';
import { reviewFormSchema } from './schema';
import type { PublishReviewResult } from './types';

/**
 * Server action stub para publicar reseña (US-049). NO llama al backend real: el `POST
 * /api/reviews` actual (US-017) sigue un modelo viejo (subjectText/teacherText/finalGrade)
 * que no acepta los campos nuevos (rating, hoursPerWeek, tags, recommendations). Hasta que
 * aterrice el backend rework, este action simula 700ms de latencia y devuelve un id
 * sintético para que el flujo end-to-end del editor sea visible.
 *
 * Cuando aterrice el endpoint real, esta función se acopla a `apiFetchAuthenticated('POST',
 * '/api/reviews', body)` y deja de redirigir manualmente: el caller maneja la respuesta.
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
    // El client ya tiene Zod validando; si llega acá, es payload manipulado o bug.
    return {
      status: 'error',
      message: validated.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  // Mock de latencia. El id sintético es estable por sesión para que demos sean
  // reproducibles; en producción viene del backend.
  await new Promise((r) => setTimeout(r, 700));
  const reviewId = `mock-${Date.now().toString(36)}`;

  // Después de publicar, US-048 manda a `/reseñas?tab=mias`. Ese shell no existe todavía,
  // así que por ahora redirigimos a `/inicio` con un searchParam que la home puede leer
  // para mostrar un toast "reseña publicada" cuando aterrice esa pieza (TODO).
  redirect(`/inicio?published-review=${reviewId}`);
}
