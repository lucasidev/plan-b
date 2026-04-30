'use server';

import { redirect } from 'next/navigation';
import { forgotPassword } from './api';
import { forgotPasswordSchema } from './schema';
import type { ForgotPasswordFormState } from './types';

/**
 * Forgot-password server action. Validates the email, hits the backend, and
 * redirects to /forgot-password/check-inbox on the 204 silent-success path
 * (which is what the backend returns for every legitimate input regardless
 * of whether the email actually exists, per anti-enumeration AC of US-033).
 *
 * 429 returns the form to the page with a `rate_limit` error so the user
 * sees "esperá unos minutos antes de pedir otro link" without a redirect.
 *
 * Per frontend/CLAUDE.md, `'use server'` at the top means only async
 * functions can be exported here. Types and initial state live in ./types.
 */
export async function forgotPasswordAction(
  _prev: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      kind: 'validation',
      message: parsed.error.issues[0].message,
      field: 'email',
    };
  }

  const response = await forgotPassword({ email: parsed.data.email });

  if (response.status === 204) {
    redirect(`/forgot-password/check-inbox?email=${encodeURIComponent(parsed.data.email)}`);
  }

  if (response.status === 429) {
    return {
      status: 'error',
      kind: 'rate_limit',
      message: 'Esperá unos minutos antes de pedir otro link.',
    };
  }

  return {
    status: 'error',
    kind: 'unknown',
    message: 'No pudimos procesar tu pedido. Probá de nuevo en un rato.',
  };
}
