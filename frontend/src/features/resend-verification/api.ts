import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/resend-verification (US-021). Devuelve la Response cruda asi el
 * action puede branchear por status (204 happy, 429 rate limit, 4xx validation).
 */

export type ResendVerificationRequestBody = {
  email: string;
};

export function resendVerification(body: ResendVerificationRequestBody): Promise<Response> {
  return apiFetch('/api/identity/resend-verification', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
