import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/sign-in. Returns the raw Response so the action can
 * branch on status, parse JSON when relevant and forward Set-Cookie
 * headers (the backend sets `planb_session` and `planb_refresh` here).
 */

export type SignInRequestBody = {
  email: string;
  password: string;
};

export function signIn(body: SignInRequestBody): Promise<Response> {
  return apiFetch('/api/identity/sign-in', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
