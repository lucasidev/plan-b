'use server';

import { redirect } from 'next/navigation';
import { signIn } from '../api';
import { signInSchema } from '../schemas';
import type { ProblemDetails } from '../types';
import { forwardSetCookies } from './forward-set-cookies';

/**
 * Form state surfaced to useActionState in the sign-in form. We deliberately
 * do not echo email/password back into the state on error: the form keeps
 * its own input via uncontrolled HTML defaults, and we don't want to risk
 * sending a password back through the action serialization.
 */
export type SignInFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind: 'invalid_credentials' | 'email_not_verified' | 'account_disabled' | 'unknown';
      message: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };

export async function signInAction(
  _prev: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      kind: 'invalid_credentials',
      message: parsed.error.issues[0].message,
    };
  }

  const response = await signIn({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (response.status === 200) {
    await forwardSetCookies(response);
    // Throws NEXT_REDIRECT, see sign-up.ts for context.
    redirect('/dashboard');
  }

  if (response.status === 401) {
    return {
      status: 'error',
      kind: 'invalid_credentials',
      message: 'Email o contraseña incorrectos',
    };
  }

  if (response.status === 403) {
    const body = (await response.json().catch(() => null)) as ProblemDetails | null;
    const code = body?.title ?? '';
    if (code === 'identity.account.email_not_verified') {
      return {
        status: 'error',
        kind: 'email_not_verified',
        message:
          'Tu cuenta todavía no está verificada. Revisá el mail que te mandamos al registrarte.',
      };
    }
    if (code === 'identity.account.disabled') {
      return {
        status: 'error',
        kind: 'account_disabled',
        message:
          'Tu cuenta fue suspendida. Contactá al equipo de moderación si creés que es un error.',
      };
    }
    return {
      status: 'error',
      kind: 'unknown',
      message: body?.detail ?? 'No podemos iniciar sesión con esa cuenta.',
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos iniciar sesión. Probá de nuevo en un rato.',
  };
}
