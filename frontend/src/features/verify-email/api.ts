import { apiFetch } from '@/lib/api-client';
import type { ProblemDetails } from '@/lib/api-problem';
import type { VerifyEmailOutcome, VerifyEmailResponse } from './types';

/**
 * POST /api/identity/verify-email. Returns the parsed VerifyEmailOutcome
 * directly: the page is a server component that just hands the result
 * to <VerifyEmailOutcome> for rendering. Mapping lives here so the page
 * stays declarative.
 */

export async function verifyEmail(token: string): Promise<VerifyEmailOutcome> {
  let response: Response;
  try {
    response = await apiFetch('/api/identity/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch {
    return { kind: 'unknown' };
  }

  if (response.status === 200) {
    const body = (await response.json().catch(() => null)) as VerifyEmailResponse | null;
    return {
      kind: 'success',
      verifiedAt: body?.verifiedAt ?? new Date().toISOString(),
    };
  }

  // Backend uses RFC 7807 ProblemDetails on errors; `title` is the domain code.
  const body = (await response.json().catch(() => null)) as ProblemDetails | null;
  const code = body?.title ?? '';

  if (response.status === 404 && code === 'identity.verification.invalid') {
    return { kind: 'invalid' };
  }
  if (response.status === 409 && code === 'identity.verification.expired') {
    return { kind: 'expired' };
  }
  if (response.status === 409 && code === 'identity.verification.already_consumed') {
    return { kind: 'already_consumed' };
  }
  if (response.status === 409 && code === 'identity.verification.invalidated') {
    return { kind: 'invalidated' };
  }
  return { kind: 'unknown', detail: body?.detail };
}
