'use server';

import { redirect } from 'next/navigation';
import type { ProblemDetails } from '@/lib/api-problem';
import { resetPassword } from './api';
import { resetPasswordSchema } from './schema';
import type { ResetPasswordFormState } from './types';

/**
 * Reset-password server action. The token is carried as a hidden input on
 * the form (the page reads it from the search params and injects it),
 * so the action signature stays the same uniform shape `useActionState`
 * expects. On 204 it redirects to `/auth?reset=success`; the auth page
 * reacts to that param and renders a "ya podés ingresar con tu nueva
 * contraseña" banner.
 */
export async function resetPasswordAction(
  _prev: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const raw = {
    token: formData.get('token')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
    confirm: formData.get('confirm')?.toString() ?? '',
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path[0];
    return {
      status: 'error',
      kind: 'validation',
      message: issue.message,
      field: path === 'password' || path === 'confirm' ? path : undefined,
    };
  }

  const response = await resetPassword({
    token: parsed.data.token,
    newPassword: parsed.data.password,
  });

  if (response.status === 204) {
    redirect('/auth?reset=success');
  }

  const body = (await response.json().catch(() => null)) as ProblemDetails | null;
  const code = body?.title ?? '';

  if (response.status === 404 && code === 'identity.verification.invalid') {
    return {
      status: 'error',
      kind: 'token_invalid',
      message: 'Este link no es válido. Pedí uno nuevo.',
    };
  }
  if (response.status === 409 && code === 'identity.verification.expired') {
    return {
      status: 'error',
      kind: 'token_expired',
      message: 'Este link ya expiró. Pedí uno nuevo.',
    };
  }
  if (response.status === 409 && code === 'identity.verification.already_consumed') {
    return {
      status: 'error',
      kind: 'token_consumed',
      message: 'Este link ya se usó. Pedí uno nuevo.',
    };
  }
  if (response.status === 409 && code === 'identity.verification.wrong_purpose') {
    return {
      status: 'error',
      kind: 'wrong_purpose',
      message: 'Este link no sirve para recuperar tu contraseña. Pedí uno nuevo.',
    };
  }
  if (response.status === 409 && code === 'identity.account.disabled') {
    return {
      status: 'error',
      kind: 'account_disabled',
      message:
        'Tu cuenta fue suspendida. Contactá al equipo de moderación si creés que es un error.',
    };
  }
  if (response.status === 409 && code === 'identity.account.email_not_verified') {
    return {
      status: 'error',
      kind: 'email_not_verified',
      message: 'Tu cuenta todavía no está verificada. Revisá el mail de bienvenida.',
    };
  }
  if (response.status === 400 && code === 'identity.password.too_weak') {
    return {
      status: 'error',
      kind: 'password_too_weak',
      message: 'La contraseña tiene que tener al menos 12 caracteres.',
      field: 'password',
    };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      kind: 'validation',
      message: body?.detail ?? 'Los datos no son válidos. Revisalos y probá de nuevo.',
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos procesar tu pedido. Probá de nuevo en un rato.',
  };
}
