'use server';

import type { ValidationProblemDetails } from '@/lib/api-problem';
import { registerUser } from './api';
import { signUpSchema } from './schema';
import type { SignUpFormState } from './types';

/**
 * Sign-up server action. Validates with signUpSchema (Zod), calls
 * POST /api/identity/register, and on 202 redirects to /sign-up/check-inbox
 * via Next's redirect() (which throws NEXT_REDIRECT, short-circuiting return
 * semantics). On errors maps the backend's ProblemDetails / ValidationProblem
 * payloads to the SignUpFormState shape useActionState consumes.
 *
 * Per frontend/CLAUDE.md, this file is `'use server'` at the top so it can
 * only export async functions. Types and the initial state live in ./types.
 */
// react-doctor-disable-next-line server-auth-actions, react-doctor/server-auth-actions -- sign-up is the registration entry point, must be public
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

  // El backend responde 202 exista o no la cuenta (ADR-0076): la pantalla dice "revisá tu
  // casilla" en los dos casos, y la diferencia viaja por mail. Por eso acá no hay rama 409.
  if (response.ok) {
    return {
      status: 'success',
      redirectTo: `/sign-up/check-inbox?email=${encodeURIComponent(parsed.data.email)}`,
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
