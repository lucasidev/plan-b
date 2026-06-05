'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ProblemDetails } from '@/lib/api-problem';
import { getSession } from '@/lib/session';
import { changePassword } from './api';
import { changePasswordSchema } from './schema';
import type { ChangePasswordFormState } from './types';

const ACCESS_COOKIE = 'planb_session';
const REFRESH_COOKIE = 'planb_refresh';

/**
 * Change-password server action (US-079-i). Client validation with Zod, PATCH to the
 * backend, mapping of the specific codes to FormState kinds. If the backend returns 204,
 * clears the local session cookies (the backend already revoked the refresh tokens via
 * Redis) and redirects to /sign-in with a flag to show the banner.
 *
 * The `getSession()` check at the top is defense-in-depth: the backend still validates
 * the JWT on every PATCH /api/me/password, but checking here avoids the round-trip if
 * the session is already gone.
 */
export async function changePasswordAction(
  _prev: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      kind: 'unknown',
      message: 'Tu sesión expiró. Volvé a ingresar.',
    };
  }

  const raw = {
    currentPassword: formData.get('currentPassword')?.toString() ?? '',
    newPassword: formData.get('newPassword')?.toString() ?? '',
    confirmPassword: formData.get('confirmPassword')?.toString() ?? '',
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: 'error',
      kind: 'validation',
      message: first?.message ?? 'Datos inválidos.',
    };
  }

  let response: Response;
  try {
    response = await changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch {
    return {
      status: 'error',
      kind: 'unknown',
      message: 'No pudimos conectarnos al servidor. Probá de nuevo.',
    };
  }

  if (response.status === 204) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_COOKIE);
    cookieStore.delete(REFRESH_COOKIE);
    redirect('/sign-in?password-changed=1');
  }

  if (response.status === 401) {
    return {
      status: 'error',
      kind: 'wrong_current',
      message: 'La contraseña actual no es correcta.',
    };
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as ProblemDetails | null;
    const code = body?.title ?? '';
    if (code === 'identity.password.same_as_current') {
      return {
        status: 'error',
        kind: 'same_as_current',
        message: 'La nueva contraseña tiene que ser distinta a la actual.',
      };
    }
    if (code === 'identity.password.too_weak') {
      return {
        status: 'error',
        kind: 'too_weak',
        message: 'La nueva contraseña tiene que tener al menos 12 caracteres.',
      };
    }
    if (code === 'identity.password.too_long') {
      return {
        status: 'error',
        kind: 'too_long',
        message: 'La contraseña no puede tener más de 200 caracteres.',
      };
    }
    return {
      status: 'error',
      kind: 'validation',
      message: body?.detail ?? 'Datos inválidos.',
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos cambiar la contraseña. Probá de nuevo.',
  };
}
