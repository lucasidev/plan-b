'use server';

import { redirect } from 'next/navigation';
import { registerUser, signIn } from './api';
import { forwardSetCookies } from './forward-set-cookies';
import { signInSchema, signUpSchema } from './schemas';
import type {
  ProblemDetails,
  SignInFormState,
  SignUpFormState,
  ValidationProblemDetails,
} from './types';

/**
 * Server actions for the Identity feature. Per frontend/CLAUDE.md, every
 * server action lives in this single file with `'use server'` at the top.
 * Types and initial states for these actions live in `./types`; helpers
 * that aren't actions (e.g. forwardSetCookies) live in their own files.
 */

/**
 * Sign-up action. Validates with signUpSchema, calls POST /api/identity/register,
 * and on 201 redirects to /sign-up/check-inbox via Next's redirect()
 * (which throws NEXT_REDIRECT, short-circuiting return semantics).
 */
export async function signUpAction(
  _prev: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
    confirm: formData.get('confirm')?.toString() ?? '',
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path[0];
    return {
      status: 'error',
      message: issue.message,
      field: path === 'email' || path === 'password' || path === 'confirm' ? path : undefined,
    };
  }

  const response = await registerUser({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (response.status === 201) {
    redirect(`/sign-up/check-inbox?email=${encodeURIComponent(parsed.data.email)}`);
  }

  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya existe una cuenta con ese email',
      field: 'email',
    };
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as ValidationProblemDetails | null;
    const fieldName = body?.errors ? Object.keys(body.errors)[0] : undefined;
    const message =
      (fieldName && body?.errors?.[fieldName]?.[0]) ||
      body?.detail ||
      'Los datos no son válidos. Revisalos y probá de nuevo.';
    const lowered = fieldName?.toLowerCase();
    return {
      status: 'error',
      message,
      field: lowered?.includes('email')
        ? 'email'
        : lowered?.includes('password')
          ? 'password'
          : undefined,
    };
  }

  return {
    status: 'error',
    message: 'No pudimos completar el registro. Probá de nuevo en un rato.',
  };
}

/**
 * Sign-in action. Validates with signInSchema, calls POST /api/identity/sign-in,
 * forwards Set-Cookie headers (planb_session, planb_refresh) on 200, then
 * redirects to /dashboard. State carries a `kind` discriminator so the form
 * can react to specific failure modes (e.g. show resend hint when
 * email_not_verified) without re-parsing the message.
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
