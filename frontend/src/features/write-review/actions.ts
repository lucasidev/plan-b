'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { courseReviewSchema } from './schema';
import type { PublishReviewResult } from './types';

/**
 * Publica la reseña de una cursada (US-146, ADR-0082).
 *
 * Devuelve `{ status }` y nada más: sin `revalidatePath` ni `redirect()` adentro. El cliente
 * reacciona al success invalidando y navegando ([ADR-0046](docs/decisions/0046)): meter el
 * re-render en el stream de la respuesta cuelga intermitente en producción.
 *
 * El campo libre viaja igual que el resto, pero no se publica: lo lee la curaduría (ADR-0084). La
 * pantalla se lo dice al usuario antes de enviar.
 */
export async function publishReviewAction(
  _prev: PublishReviewResult,
  formData: FormData,
): Promise<PublishReviewResult> {
  const session = await getSession();
  if (!session) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  const raw = formData.get('payload');
  if (typeof raw !== 'string') {
    return { status: 'error', message: 'Faltan datos del formulario.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'No pudimos leer lo que respondiste. Probá de nuevo.' };
  }

  const result = courseReviewSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0]?.message ?? 'Revisá lo que completaste.';
    return { status: 'error', message: first };
  }

  const { subjectId, termId, chairId, answers, freeText } = result.data;

  const response = await apiFetchAuthenticated('/api/reviews/courses', {
    method: 'POST',
    body: JSON.stringify({
      subjectId,
      termId,
      chairId,
      // El backend recibe pares (código de frase, valor de opción). Lo salteado no viaja: no hay un
      // "no dijo" que mandar, porque no cuenta en ningún denominador.
      answers: Object.entries(answers).map(([itemCode, optionValue]) => ({
        itemCode,
        optionValue,
      })),
      freeText: freeText && freeText.trim().length > 0 ? freeText.trim() : null,
    }),
  });

  if (response.status === 201) {
    const body = (await response.json()) as { id: string; answeredItems: number };
    return { status: 'success', reviewId: body.id, answeredItems: body.answeredItems };
  }

  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya reseñaste esta cursada. Podés editar la que tenés desde Mis aportes.',
    };
  }

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Volvé a iniciar sesión.' };
  }

  return {
    status: 'error',
    message: 'No pudimos guardar tu reseña. Probá de nuevo en un rato.',
  };
}
