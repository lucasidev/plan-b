'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { patchMyProfile } from './api';
import { profileUpdateSchema } from './schema';
import type { UpdateProfileFormState } from './types';

/**
 * Server action for the edit form save (US-047). Receives the partial shape validated
 * by Zod (deep validation lives in the backend; we only check the cheap stuff here).
 * After 204 it revalidates /my-profile so the next RSC load brings the fresh snapshot.
 *
 * The getSession check at the top is defense-in-depth: the backend still validates the
 * JWT on every PATCH /api/me/student-profile, but checking here saves the round-trip if
 * the session is already gone.
 */
export async function updateMyProfileAction(
  _prev: UpdateProfileFormState,
  patch: unknown,
): Promise<UpdateProfileFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a ingresar.',
    };
  }

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
    revalidatePath('/my-profile');
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
