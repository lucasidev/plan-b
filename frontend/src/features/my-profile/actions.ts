'use server';

import { revalidatePath } from 'next/cache';
import { patchMyProfile } from './api';
import { profileUpdateSchema } from './schema';
import type { UpdateProfileFormState } from './types';

/**
 * Server action del save del edit form (US-047). Recibe el shape parcial validado por Zod
 * (la validación profunda vive en el backend; acá chequeamos lo barato). Después del 204,
 * revalida /mi-perfil para que la próxima carga RSC traiga el snapshot fresco.
 */
export async function updateMyProfileAction(
  _prev: UpdateProfileFormState,
  patch: unknown,
): Promise<UpdateProfileFormState> {
  const parsed = profileUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Valor inválido.',
    };
  }

  let response: Response;
  try {
    response = await patchMyProfile(parsed.data);
  } catch {
    return {
      status: 'error',
      message: 'No pudimos guardar los cambios. Probá de nuevo.',
    };
  }

  if (response.status === 204) {
    revalidatePath('/mi-perfil');
    return { status: 'success' };
  }

  if (response.status === 401) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a ingresar.',
    };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      message: 'Datos inválidos. Revisá los campos.',
    };
  }

  return {
    status: 'error',
    message: 'No pudimos guardar los cambios. Probá de nuevo.',
  };
}
