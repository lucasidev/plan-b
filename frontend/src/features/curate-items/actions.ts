'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { editItemSchema, supersedeItemSchema } from './schema';
import type { CurateItemState } from './types';

const NO_PERMISSION = 'No tenés permisos para curar el catálogo.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';

/** Los códigos de error del backend, cada uno diciendo qué pasó y no "algo salió mal". */
const MESSAGES: Record<string, string> = {
  'reviews.item.not_found': 'Esa pregunta ya no está en el catálogo.',
  'reviews.item.code_already_exists': 'Ya hay una pregunta con ese código.',
  'reviews.item.invalid_layer': 'Esa capa no existe.',
  'reviews.item.invalid_valence': 'Esa valencia no existe.',
  'reviews.item.retired_cannot_change':
    'Esa pregunta está retirada. Su texto es el enunciado bajo el que ya se respondió y no se cambia.',
  'reviews.item.cannot_supersede_retired': 'Esa pregunta ya está retirada.',
  'reviews.item.cannot_supersede_the_outcome_item':
    'La pregunta del desenlace no puede cambiar de código: es de donde sale la tasa de finalización de todas las fichas. Su texto y sus opciones sí se editan.',
  'reviews.item.option_value_already_used':
    'Sacaste una opción que ya tiene respuestas. Podés cambiarle la etiqueta, pero no borrarla.',
  'reviews.item.context_options_cannot_have_valence':
    'Las preguntas de contexto no se publican dato por dato, así que sus opciones no llevan lado bueno ni malo.',
  'reviews.item.multiple_negative_options': 'Una pregunta lleva a lo sumo una opción mala.',
  'reviews.instrument.not_found': 'No hay un cuestionario vigente al que cambiarle la pregunta.',
};

/**
 * Edita una frase sin cortar su serie (US-198, E1). Mutación pura (ADR-0046): hace el write y
 * devuelve el status; la pantalla reacciona.
 */
export async function editItemAction(
  _prev: CurateItemState,
  formData: FormData,
): Promise<CurateItemState> {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return { status: 'error', message: NO_PERMISSION };
  }

  const itemId = formData.get('itemId')?.toString() ?? '';
  if (!itemId) {
    return { status: 'error', message: 'No supimos qué pregunta estabas editando.' };
  }

  const options = readOptions(formData);
  if (options === null) {
    return { status: 'error', message: 'Las opciones llegaron mal armadas.' };
  }

  const parsed = editItemSchema.safeParse({
    text: formData.get('text')?.toString() ?? '',
    help: formData.get('help')?.toString() || undefined,
    layer: formData.get('layer')?.toString() ?? '',
    options,
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated(`/api/reviews/curation/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (response.ok) return { status: 'saved' };
    return await problem(response, 'No pudimos guardar el cambio.');
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

/**
 * Abre un código nuevo porque cambió lo que se pregunta (US-198, E2). Del lado del backend es una
 * sola operación: nace la frase nueva, se retira la vieja y se publica la versión siguiente del
 * cuestionario, así que acá no hay dos pasos que puedan quedar a medias.
 *
 * Que el significado haya cambiado lo declara quien cura en la pantalla. El sistema no puede
 * saberlo, y esta acción existe separada de la edición justamente para no adivinarlo.
 */
export async function supersedeItemAction(
  _prev: CurateItemState,
  formData: FormData,
): Promise<CurateItemState> {
  const session = await getSession();
  if (session?.role !== 'admin') {
    return { status: 'error', message: NO_PERMISSION };
  }

  const itemId = formData.get('itemId')?.toString() ?? '';
  if (!itemId) {
    return { status: 'error', message: 'No supimos qué pregunta estabas reemplazando.' };
  }

  const options = readOptions(formData);
  if (options === null) {
    return { status: 'error', message: 'Las opciones llegaron mal armadas.' };
  }

  const parsed = supersedeItemSchema.safeParse({
    code: formData.get('code')?.toString() ?? '',
    text: formData.get('text')?.toString() ?? '',
    help: formData.get('help')?.toString() || undefined,
    layer: formData.get('layer')?.toString() ?? '',
    options,
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated(
      `/api/reviews/curation/items/${itemId}/supersede`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      },
    );

    if (response.ok) {
      const cut = (await response.json()) as {
        code: string;
        supersededCode: string;
        instrumentVersion: number;
      };
      return {
        status: 'cut',
        code: cut.code,
        supersededCode: cut.supersededCode,
        instrumentVersion: cut.instrumentVersion,
      };
    }

    return await problem(response, 'No pudimos abrir el código nuevo.');
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

/**
 * Las opciones viajan como un JSON en un campo: son un array de largo variable y `FormData` no
 * tiene forma de expresar eso sin inventar una convención de nombres. Null si vino roto.
 */
function readOptions(formData: FormData): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(formData.get('options')?.toString() || '[]');
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function problem(response: Response, fallback: string): Promise<CurateItemState> {
  if (response.status === 401 || response.status === 403) {
    return { status: 'error', message: NO_PERMISSION };
  }

  const body = (await response.json().catch(() => null)) as { title?: string } | null;
  return { status: 'error', message: MESSAGES[body?.title ?? ''] ?? fallback };
}
