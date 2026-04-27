import { apiFetch } from '@/lib/api-client';

/**
 * Thin adapters over `apiFetch` for the Identity backend endpoints.
 *
 * These return the raw `Response` so callers (typically server actions)
 * can branch on status, parse the JSON when relevant, and forward `Set-Cookie`
 * headers from the backend to the user-agent (sign-in only). Wrapping them
 * here keeps the URL, method, and JSON body conventions in one place.
 */

export type RegisterRequestBody = {
  email: string;
  password: string;
};

export type SignInRequestBody = {
  email: string;
  password: string;
};

export type VerifyEmailRequestBody = {
  token: string;
};

export function registerUser(body: RegisterRequestBody): Promise<Response> {
  return apiFetch('/api/identity/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function signIn(body: SignInRequestBody): Promise<Response> {
  return apiFetch('/api/identity/sign-in', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyEmail(body: VerifyEmailRequestBody): Promise<Response> {
  return apiFetch('/api/identity/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
