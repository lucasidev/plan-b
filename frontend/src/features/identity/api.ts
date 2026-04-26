import { apiFetch } from '@/lib/api-client';

/**
 * Error codes returned by the backend `POST /api/identity/verify-email` endpoint.
 * Match the `Error.Code` constants in Planb.Identity.Domain.Users.UserErrors.
 */
export type VerifyEmailErrorCode =
  | 'identity.verification.invalid'
  | 'identity.verification.expired'
  | 'identity.verification.already_consumed'
  | 'identity.verification.invalidated'
  | 'identity.verification.token_required'
  | 'unknown';

export class VerifyEmailError extends Error {
  constructor(
    public readonly code: VerifyEmailErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = 'VerifyEmailError';
  }
}

export type VerifyEmailResponse = {
  userId: string;
  verifiedAt: string;
};

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await apiFetch('/api/identity/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    let code: VerifyEmailErrorCode = 'unknown';
    try {
      const problem = (await response.json()) as { title?: string };
      if (problem.title) code = problem.title as VerifyEmailErrorCode;
    } catch {
      // body wasn't JSON — fall through with 'unknown'
    }
    throw new VerifyEmailError(code, response.status);
  }

  return (await response.json()) as VerifyEmailResponse;
}
