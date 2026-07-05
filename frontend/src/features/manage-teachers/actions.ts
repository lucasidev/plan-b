'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { createTeacherSchema, teacherFieldsSchema } from './schema';
import type { ManageTeacherFormState, ToggleResult } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar docentes.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/** Alta de docente (US-063). POST /api/academic/teachers. Mutación pura: el form redirige en success. */
export async function createTeacherAction(
  _prev: ManageTeacherFormState,
  formData: FormData,
): Promise<ManageTeacherFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const parsed = createTeacherSchema.safeParse({
    universityId: formData.get('universityId')?.toString() ?? '',
    firstName: formData.get('firstName')?.toString() ?? '',
    lastName: formData.get('lastName')?.toString() ?? '',
    title: formData.get('title')?.toString() ?? '',
    bio: formData.get('bio')?.toString() ?? '',
    photoUrl: formData.get('photoUrl')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated('/api/academic/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear el docente. Probá de nuevo en un rato.');
}

/** Edición de docente (US-063). PATCH /api/academic/teachers/{id}. La universidad es inmutable. */
export async function updateTeacherAction(
  _prev: ManageTeacherFormState,
  formData: FormData,
): Promise<ManageTeacherFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta el docente a editar.' };
  }

  const parsed = teacherFieldsSchema.safeParse({
    firstName: formData.get('firstName')?.toString() ?? '',
    lastName: formData.get('lastName')?.toString() ?? '',
    title: formData.get('title')?.toString() ?? '',
    bio: formData.get('bio')?.toString() ?? '',
    photoUrl: formData.get('photoUrl')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/teachers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

/** Soft delete (US-063). DELETE /api/academic/teachers/{id}. Invocado desde el botón de fila. */
export async function deactivateTeacherAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/teachers/${id}`, 'DELETE');
}

/** Reactivar (US-063). POST /api/academic/teachers/{id}/reactivate. */
export async function reactivateTeacherAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/teachers/${id}/reactivate`, 'POST');
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
  if (response.status === 404) return { ok: false, message: 'No encontramos el docente.' };
  if (response.status === 409) {
    return { ok: false, message: 'El docente ya estaba en ese estado. Refrescá la página.' };
  }
  return { ok: false, message: 'No pudimos cambiar el estado. Probá de nuevo.' };
}

function mapWriteResponse(response: Response, fallback: string): ManageTeacherFormState {
  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la universidad o el docente.' };
  }
  return { status: 'error', message: fallback };
}
