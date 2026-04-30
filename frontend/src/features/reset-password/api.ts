import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/reset-password. Returns the raw Response so the action
 * can branch on status (204 happy path, 400/404/409 distinct error codes).
 */

export type ResetPasswordRequestBody = {
  token: string;
  newPassword: string;
};

export function resetPassword(body: ResetPasswordRequestBody): Promise<Response> {
  return apiFetch('/api/identity/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
