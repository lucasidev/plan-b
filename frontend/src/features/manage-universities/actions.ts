'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { universityFieldsSchema } from './schema';
import type { ManageUniversityFormState, ToggleResult } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar universidades.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/**
 * Arma el payload compartido por alta y edición. `institutionalEmailDomains` viaja como múltiples
 * entries del mismo name (un hidden input por chip en el form): `FormData.getAll` los junta en un
 * array sin serializar JSON a mano.
 */
function parseFields(formData: FormData) {
  return universityFieldsSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    slug: formData.get('slug')?.toString() ?? '',
    institutionalEmailDomains: formData
      .getAll('institutionalEmailDomains')
      .map((v) => v.toString()),
  });
}

/** Alta de universidad (US-060). POST /api/academic/universities. Mutación pura: el form redirige en success. */
export async function createUniversityAction(
  _prev: ManageUniversityFormState,
  formData: FormData,
): Promise<ManageUniversityFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const parsed = parseFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/academic/universities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear la universidad. Probá de nuevo en un rato.');
}

/** Edición de universidad (US-060). PATCH /api/academic/universities/{id}. Replace del form completo. */
export async function updateUniversityAction(
  _prev: ManageUniversityFormState,
  formData: FormData,
): Promise<ManageUniversityFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta la universidad a editar.' };
  }

  const parsed = parseFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/universities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

/** Soft delete (US-060). DELETE /api/academic/universities/{id}. Invocado desde el botón de fila. */
export async function deactivateUniversityAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/universities/${id}`, 'DELETE');
}

/** Reactivar (US-060). POST /api/academic/universities/{id}/reactivate. */
export async function reactivateUniversityAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/universities/${id}/reactivate`, 'POST');
}

async function toggle(path: string, method: 'DELETE' | 'POST'): Promise<ToggleResult> {
  let response: Response;
  try {
    response = await apiFetchAuthenticated(path, { method });
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }
  if (response.ok) {
    return { ok: true };
  }
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos la universidad.' };
  if (response.status === 409) {
    return { ok: false, message: 'La universidad ya estaba en ese estado. Refrescá la página.' };
  }
  return { ok: false, message: 'No pudimos cambiar el estado. Probá de nuevo.' };
}

function mapWriteResponse(response: Response, fallback: string): ManageUniversityFormState {
  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la universidad.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ese slug ya está en uso. Probá con otro.' };
  }
  return { status: 'error', message: fallback };
}
