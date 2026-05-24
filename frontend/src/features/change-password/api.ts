import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';

export type ChangePasswordRequestBody = {
  currentPassword: string;
  newPassword: string;
};

/**
 * PATCH /api/me/password (US-079-i). Devuelve el Response crudo para que el caller branchee
 * por status: 204 OK, 401 wrong current, 400 too weak / same as current / too long.
 */
export function changePassword(body: ChangePasswordRequestBody): Promise<Response> {
  return apiFetchAuthenticated('/api/me/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
