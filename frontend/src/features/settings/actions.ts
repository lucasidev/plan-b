'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { patchMySettings } from './api';
import { settingsPatchSchema } from './schema';
import type { UpdateSettingsFormState } from './types';

/**
 * Per-toggle auto-save server action. Receives a partial patch (any subset of
 * settings), validates it with Zod and PATCHes the backend. Returns a FormState the
 * client component uses to reflect success or show error copy.
 *
 * Invalidates the /settings cache so a server-rendered refresh brings the updated
 * version. Meanwhile the component uses optimistic UI: the toggle flips on click and
 * only rolls back if the action returns an error.
 *
 * The getSession check at the top is defense-in-depth: the backend still validates the
 * JWT on every PATCH /api/me/settings, but checking here saves the round-trip if the
 * session is already gone.
 */
export async function updateSettingsAction(
  _prev: UpdateSettingsFormState,
  patch: unknown,
): Promise<UpdateSettingsFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      kind: 'auth',
      message: 'Tu sesión expiró. Volvé a ingresar.',
    };
  }

  const parsed = settingsPatchSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      status: 'error',
      kind: 'validation',
      message: parsed.error.issues[0]?.message ?? 'Valor inválido.',
    };
  }

  let response: Response;
  try {
    response = await patchMySettings(parsed.data);
  } catch {
    return {
      status: 'error',
      kind: 'unknown',
      message: 'No pudimos guardar el cambio. Probá de nuevo.',
    };
  }

  if (response.status === 204) {
    revalidatePath('/settings');
    return { status: 'success', patch: parsed.data };
  }

  if (response.status === 401) {
    return {
      status: 'error',
      kind: 'auth',
      message: 'Tu sesión expiró. Volvé a ingresar.',
    };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      kind: 'validation',
      message: 'El backend rechazó el valor. Recargá la página.',
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos guardar el cambio. Probá de nuevo.',
  };
}
