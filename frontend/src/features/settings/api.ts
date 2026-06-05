import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { type Settings, type SettingsPatch, settingsSchema } from './schema';

/**
 * GET /api/users/me/settings. Returns the logged-in user's settings, or defaults if
 * they have not customized anything yet (the backend resolves that transparently).
 * Throws if the response does not parse: the caller decides how to handle the error
 * (RSC degrades to defaults, the action reports it).
 */
export async function fetchMySettings(): Promise<Settings> {
  const response = await apiFetchAuthenticated('/api/users/me/settings');
  if (!response.ok) {
    throw new Error(`Failed to fetch settings (status=${response.status})`);
  }
  const body = await response.json();
  return settingsSchema.parse(body);
}

/**
 * PATCH /api/users/me/settings with a subset of fields. Returns the raw Response so the
 * caller can branch on status (204 OK, 400 validation, 401 session expired).
 */
export function patchMySettings(patch: SettingsPatch): Promise<Response> {
  return apiFetchAuthenticated('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
