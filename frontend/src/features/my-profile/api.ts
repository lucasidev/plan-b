import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { MyProfile } from './types';

/**
 * GET /api/me/student-profile (US-047). Returns the active profile with all editable
 * fields + email + memberSince. If the user has no profile (404) it returns null and
 * the page redirects to onboarding (the layout guard already covers that case, so in
 * practice we almost never hit null here).
 */
export async function fetchMyProfile(): Promise<MyProfile | null> {
  const response = await apiFetchAuthenticated('/api/me/student-profile');
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch profile (status=${response.status})`);
  }
  return (await response.json()) as MyProfile;
}

/**
 * PATCH /api/me/student-profile (US-047). Returns the raw Response so the caller can
 * branch on status: 204 OK, 400 validation, 401 session expired, 403 inactive.
 */
export function patchMyProfile(patch: Record<string, unknown>): Promise<Response> {
  return apiFetchAuthenticated('/api/me/student-profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
