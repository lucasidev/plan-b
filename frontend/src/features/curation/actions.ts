'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { distilItemSchema } from './schema';
import type { DistilItemState, EditorialNoteState } from './types';

const NO_PERMISSION = 'No tenés permisos para curar el instrumento.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';

/** Los códigos de error del backend, cada uno diciendo qué pasó y no "algo salió mal". */
const MESSAGES: Record<string, string> = {
  'reviews.item.code_already_exists': 'Ya hay una pregunta con ese código.',
  'reviews.item.invalid_layer': 'Esa capa no existe.',
  'reviews.item.invalid_subject': 'Ese sujeto no existe.',
  'reviews.item.invalid_valence': 'Esa valencia no existe.',
  'reviews.instrument.not_found': 'No hay un cuestionario vigente al que sumarle la pregunta.',
};

/**
 * Destila una pregunta del campo libre (ADR-0084). Mutación pura (ADR-0046): hace el write y
 * devuelve el status; la pantalla reacciona.
 *
 * <p>
 * El alta y la versión nueva del instrumento son una sola operación del lado del backend, así que
 * acá no hay dos pasos que puedan quedar a medias.
 * </p>
 */
export async function distilItemAction(
  _prev: DistilItemState,
  formData: FormData,
): Promise<DistilItemState> {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return { status: 'error', message: NO_PERMISSION };
  }

  // Las opciones viajan como un JSON en un campo: son un array de largo variable y `FormData` no
  // tiene forma de expresar eso sin inventar una convención de nombres.
  let rawOptions: unknown = [];
  try {
    rawOptions = JSON.parse(formData.get('options')?.toString() || '[]');
  } catch {
    return { status: 'error', message: 'Las opciones llegaron mal armadas.' };
  }

  const parsed = distilItemSchema.safeParse({
    code: formData.get('code')?.toString() ?? '',
    text: formData.get('text')?.toString() ?? '',
    help: formData.get('help')?.toString() || undefined,
    layer: formData.get('layer')?.toString() ?? '',
    subject: formData.get('subject')?.toString() ?? '',
    options: rawOptions,
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated('/api/reviews/curation/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (response.ok) {
      const created = (await response.json()) as { code: string; instrumentVersion: number };
      return {
        status: 'success',
        code: created.code,
        instrumentVersion: created.instrumentVersion,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return { status: 'error', message: NO_PERMISSION };
    }

    const problem = (await response.json().catch(() => null)) as { title?: string } | null;
    return {
      status: 'error',
      message: MESSAGES[problem?.title ?? ''] ?? 'No pudimos destilar la pregunta.',
    };
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

/**
 * Publica una nota del equipo sobre una carrera (ADR-0084). Mutación pura (ADR-0046).
 *
 * La nota cuelga de una carrera y nunca de una cátedra: a ese nivel el docente es identificable, y
 * una síntesis ahí sería decir algo sobre una persona a partir de textos que prometimos no
 * publicar. El backend lo impone; acá no hay forma de elegir otra cosa.
 */
export async function publishEditorialNoteAction(
  _prev: EditorialNoteState,
  formData: FormData,
): Promise<EditorialNoteState> {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return { status: 'error', message: NO_PERMISSION };
  }

  const careerId = formData.get('careerId')?.toString() ?? '';
  const text = formData.get('text')?.toString().trim() ?? '';

  if (!careerId) {
    return { status: 'error', message: 'Elegí sobre qué carrera es la nota.' };
  }
  if (!text) {
    return { status: 'error', message: 'Escribí la nota.' };
  }

  try {
    const response = await apiFetchAuthenticated(
      `/api/reviews/curation/careers/${careerId}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      },
    );

    if (response.ok) return { status: 'success' };
    if (response.status === 401 || response.status === 403) {
      return { status: 'error', message: NO_PERMISSION };
    }

    const problem = (await response.json().catch(() => null)) as { title?: string } | null;
    return {
      status: 'error',
      message: NOTE_MESSAGES[problem?.title ?? ''] ?? 'No pudimos publicar la nota.',
    };
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

const NOTE_MESSAGES: Record<string, string> = {
  'reviews.editorial_note.career_not_found': 'Esa carrera no existe.',
  'reviews.editorial_note.text_required': 'Escribí la nota.',
  'reviews.editorial_note.text_too_long': 'La nota es demasiado larga.',
};
