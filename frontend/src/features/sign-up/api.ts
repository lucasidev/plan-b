import { apiFetch } from '@/lib/api-client';

/**
 * POST /api/identity/register. Returns the raw Response so the action can
 * branch on status and parse the JSON only when relevant.
 */

export type RegisterRequestBody = {
  email: string;
  password: string;
};

export function registerUser(body: RegisterRequestBody): Promise<Response> {
  return apiFetch('/api/identity/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
