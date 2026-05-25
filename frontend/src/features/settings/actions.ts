'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { patchMySettings } from './api';
import { settingsPatchSchema } from './schema';
import type { UpdateSettingsFormState } from './types';

/**
 * Server action del auto-save por toggle. Recibe un patch parcial (cualquier subset de
 * settings), lo valida con Zod y pega PATCH al backend. Devuelve un FormState que el
 * componente cliente usa para reflejar éxito o mostrar copy de error.
 *
 * <para>
 * Invalida la cache de /ajustes para que un refresh server-rendered traiga la versión
 * actualizada. Mientras tanto el componente usa optimistic UI: el toggle se marca al click
 * y se rollbackea solo si el action devuelve error.
 * </para>
 *
 * <para>
 * `requireSession()` al tope es defense-in-depth: el backend igual valida JWT en cada
 * PATCH /api/me/settings, pero chequear acá ahorra el round-trip si la sesión cayó.
 * </para>
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
    revalidatePath('/ajustes');
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
