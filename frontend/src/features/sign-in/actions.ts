'use server';

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
// react-doctor-disable-next-line server-auth-actions, react-doctor/server-auth-actions -- sign-in is the auth entry point, must be public
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
      kind: 'unknown',
      message: parsed.error.issues[0].message,
    };
  }

  const response = await signIn({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (response.status === 200) {
    await forwardSetCookies(response);
    return { status: 'success', redirectTo: '/home' };
  }

  if (response.status === 401) {
    // ADR-0076: el backend responde 401 tanto para credenciales malas como para una cuenta
    // sin verificar, para no revelar que el mail tiene cuenta. Por eso el reenvío de
    // verificación cuelga de acá, del mensaje que ve todo el mundo, con el email que la
    // persona ya tipeó (echoarlo a su propio cliente no agrega información).
    return {
      status: 'error',
      kind: 'invalid_credentials',
      message: 'El mail o la contraseña no coinciden.',
      email: parsed.data.email,
    };
  }

  if (response.status === 403) {
    const body = (await response.json().catch(() => null)) as ProblemDetails | null;
    const code = body?.title ?? '';
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
