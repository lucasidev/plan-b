'use server';

import { resendVerification } from './api';
import { resendVerificationSchema } from './schema';
import type { ResendVerificationFormState } from './types';

/**
 * Resend-verification server action (US-021). Validates the email, calls the backend,
 * and returns state so the client button can show cooldown/error/sent without
 * navigating (unlike forgot-password, which redirects to /forgot-password/check-inbox).
 *
 * Anti-enumeration: the backend returns 204 regardless of whether the email exists or
 * the user is already verified. That is why `sent` is set on every 204, and the 60s
 * button cooldown applies uniformly.
 *
 * Per frontend/CLAUDE.md, `'use server'` at the top means only async functions can be
 * exported. The state types live in ./types.
 */
// react-doctor-disable-next-line server-auth-actions, react-doctor/server-auth-actions -- resend-verification is public (user has not verified email yet, no session)
export async function resendVerificationAction(
  _prev: ResendVerificationFormState,
  formData: FormData,
): Promise<ResendVerificationFormState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
  };

  const parsed = resendVerificationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      kind: 'validation',
      message: parsed.error.issues[0].message,
    };
  }

  const response = await resendVerification({ email: parsed.data.email });

  if (response.status === 204) {
    return { status: 'sent' };
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
    message: 'No pudimos reenviar el link. Probá de nuevo en un rato.',
  };
}
