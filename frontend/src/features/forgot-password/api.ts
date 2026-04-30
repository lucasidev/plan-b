import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/forgot-password. Returns the raw Response so the
 * server action can branch on status (204 happy path, 429 rate limit).
 */

export type ForgotPasswordRequestBody = {
  email: string;
};

export function forgotPassword(body: ForgotPasswordRequestBody): Promise<Response> {
  return apiFetch('/api/identity/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
