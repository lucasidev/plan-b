'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { careerFieldsSchema, planFieldsSchema } from './schema';
import type { ManageCareerFormState, ManagePlanFormState, ToggleResult } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar carreras.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/**
 * Arma el payload de carrera compartido por alta y edición. Los campos opcionales vacíos los colapsa
 * el schema a undefined, y `JSON.stringify` los omite: el backend los recibe como null (metadata no
 * cargada). degreeType/cadence viajan como string; el backend los parsea a enum.
 */
function parseCareerFields(formData: FormData) {
  return careerFieldsSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    slug: formData.get('slug')?.toString() ?? '',
    shortName: formData.get('shortName')?.toString() ?? '',
    code: formData.get('code')?.toString() ?? '',
    degreeType: formData.get('degreeType')?.toString() ?? '',
    durationYears: formData.get('durationYears')?.toString() ?? '',
    cadence: formData.get('cadence')?.toString() ?? '',
    description: formData.get('description')?.toString() ?? '',
  });
}

/**
 * Alta de carrera (US-061). POST /api/academic/universities/{universityId}/careers. El universityId
 * viaja en un hidden input del form (la carrera se ancla a la uni). Mutación pura: el form redirige
 * al listado en success.
 */
export async function createCareerAction(
  _prev: ManageCareerFormState,
  formData: FormData,
): Promise<ManageCareerFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const universityId = formData.get('universityId')?.toString();
  if (!universityId) {
    return { status: 'error', message: 'Falta la universidad de la carrera.' };
  }

  const parsed = parseCareerFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/universities/${universityId}/careers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear la carrera. Probá de nuevo en un rato.');
}

/** Edición de carrera (US-061). PATCH /api/academic/careers/{id}. Replace del form completo. */
export async function updateCareerAction(
  _prev: ManageCareerFormState,
  formData: FormData,
): Promise<ManageCareerFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta la carrera a editar.' };
  }

  const parsed = parseCareerFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/careers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

/** Soft delete de carrera (US-061). DELETE /api/academic/careers/{id}. Invocado desde la fila. */
export async function deactivateCareerAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/careers/${id}`, 'DELETE', CAREER_LABELS);
}

/** Reactivar carrera (US-061). POST /api/academic/careers/{id}/reactivate. */
export async function reactivateCareerAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/careers/${id}/reactivate`, 'POST', CAREER_LABELS);
}

/**
 * Alta de un plan de estudios (US-061). POST /api/academic/careers/{careerId}/plans. El careerId
 * viaja en un hidden input del form. Mutación pura: el panel refetchea los planes en success.
 */
export async function createPlanAction(
  _prev: ManagePlanFormState,
  formData: FormData,
): Promise<ManagePlanFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const careerId = formData.get('careerId')?.toString();
  if (!careerId) {
    return { status: 'error', message: 'Falta la carrera del plan.' };
  }

  const parsed = planFieldsSchema.safeParse({
    year: formData.get('year')?.toString() ?? '',
    label: formData.get('label')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/careers/${careerId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá el año: tiene que ser un año válido y no futuro.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la carrera.' };
  }
  if (response.status === 409) {
    return { status: 'error', message: 'Ya existe un plan para ese año en esta carrera.' };
  }
  return { status: 'error', message: 'No pudimos crear el plan. Probá de nuevo en un rato.' };
}

/** Deprecar un plan (US-061). POST /api/academic/career-plans/{id}/deprecate. */
export async function deprecatePlanAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/career-plans/${id}/deprecate`, 'POST', PLAN_LABELS);
}

/** Reactivar un plan (US-061). POST /api/academic/career-plans/{id}/reactivate. */
export async function reactivatePlanAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/career-plans/${id}/reactivate`, 'POST', PLAN_LABELS);
}

/** Textos del 404/409 de cada recurso, para reusar el helper `toggle` entre carrera y plan. */
type ToggleLabels = { notFound: string; conflict: string };
const CAREER_LABELS: ToggleLabels = {
  notFound: 'No encontramos la carrera.',
  conflict: 'La carrera ya estaba en ese estado. Refrescá la página.',
};
const PLAN_LABELS: ToggleLabels = {
  notFound: 'No encontramos el plan.',
  conflict: 'El plan ya estaba en ese estado. Refrescá la página.',
};

async function toggle(
  path: string,
  method: 'DELETE' | 'POST',
  labels: ToggleLabels,
): Promise<ToggleResult> {
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
  if (response.status === 404) return { ok: false, message: labels.notFound };
  if (response.status === 409) return { ok: false, message: labels.conflict };
  return { ok: false, message: 'No pudimos cambiar el estado. Probá de nuevo.' };
}

function mapWriteResponse(response: Response, fallback: string): ManageCareerFormState {
  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la universidad o la carrera.' };
  }
  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ese slug o código ya está en uso en esta universidad. Probá con otro.',
    };
  }
  return { status: 'error', message: fallback };
}
