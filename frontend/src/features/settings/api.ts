import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { type Settings, type SettingsPatch, settingsSchema } from './schema';

/**
 * GET /api/users/me/settings. Devuelve los settings del user logueado o los defaults si
 * todavía no personalizó nada (el backend resuelve eso transparente). Lanza si el response
 * no parsea — el caller decide cómo manejar el error (RSC degrada a defaults, action lo
 * reporta).
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
 * PATCH /api/users/me/settings con un subset de campos. Devuelve el Response crudo para que
 * el caller branchee por status (204 OK, 400 validation, 401 sesión expirada).
 */
export function patchMySettings(patch: SettingsPatch): Promise<Response> {
  return apiFetchAuthenticated('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
