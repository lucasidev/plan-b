'use server';

import { resendVerification } from './api';
import { resendVerificationSchema } from './schema';
import type { ResendVerificationFormState } from './types';

/**
 * Resend-verification server action (US-021). Valida el email, llama al backend,
 * y retorna estado para que el botón cliente muestre cooldown/error/sent sin
 * navegar (a diferencia de forgot-password que redirige a /forgot-password/check-inbox).
 *
 * Anti-enumeración: el backend devuelve 204 sin importar si el email existe o si
 * el usuario ya está verificado. Por eso el status `sent` se setea en cualquier
 * 204, y el cooldown del botón (60s) aplica igual.
 *
 * Per frontend/CLAUDE.md, `'use server'` al tope significa que solo se exportan
 * funciones async. Los tipos del state viven en ./types.
 */
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
