'use server';

import { redirect } from 'next/navigation';
import type { ProblemDetails } from '@/lib/api-problem';
import { forwardSetCookies } from '@/lib/forward-set-cookies';
import { signIn } from './api';
import { signInSchema } from './schema';
import type { SignInFormState } from './types';

/**
 * Sign-in server action. Validates with signInSchema, calls
 * POST /api/identity/sign-in, forwards Set-Cookie headers (planb_session,
 * planb_refresh) on 200, then redirects to /home.
 *
 * Per frontend/CLAUDE.md, this file is `'use server'` at the top so it
 * can only export async functions. Types and the initial state live in
 * ./types.
 */
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
    redirect('/home');
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
        email: parsed.data.email,
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
