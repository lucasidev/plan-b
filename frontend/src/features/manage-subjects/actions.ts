'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ProblemDetails } from '@/lib/api-problem';
import { getSession } from '@/lib/session';
import { prerequisiteFieldsSchema, subjectFieldsSchema } from './schema';
import type {
  DeactivateSubjectResult,
  ManagePrerequisiteFormState,
  ManageSubjectFormState,
  PrerequisiteType,
  SubjectDependent,
  ToggleResult,
} from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar materias.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/**
 * Arma el payload de materia compartido por alta y edición. `termInYear`/`description` vacíos los
 * colapsa el schema a undefined, y `JSON.stringify` los omite: el backend los recibe como ausentes
 * (no aplica para materias anuales / sin descripción cargada). `termKind` viaja como string; el
 * backend lo parsea a enum.
 */
function parseSubjectFields(formData: FormData) {
  return subjectFieldsSchema.safeParse({
    code: formData.get('code')?.toString() ?? '',
    name: formData.get('name')?.toString() ?? '',
    yearInPlan: formData.get('yearInPlan')?.toString() ?? '',
    termKind: formData.get('termKind')?.toString() ?? '',
    termInYear: formData.get('termInYear')?.toString() ?? '',
    weeklyHours: formData.get('weeklyHours')?.toString() ?? '',
    totalHours: formData.get('totalHours')?.toString() ?? '',
    description: formData.get('description')?.toString() ?? '',
  });
}

/**
 * Alta de materia (US-062). POST /api/academic/career-plans/{planId}/subjects. El planId viaja en
 * un hidden input del form (la materia se ancla al plan). Mutación pura: el form redirige al
 * listado en success.
 */
export async function createSubjectAction(
  _prev: ManageSubjectFormState,
  formData: FormData,
): Promise<ManageSubjectFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const planId = formData.get('planId')?.toString();
  if (!planId) {
    return { status: 'error', message: 'Falta el plan de la materia.' };
  }

  const parsed = parseSubjectFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/career-plans/${planId}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear la materia. Probá de nuevo en un rato.');
}

/** Edición de materia (US-062). PATCH /api/academic/subjects/{id}. Replace del form completo. */
export async function updateSubjectAction(
  _prev: ManageSubjectFormState,
  formData: FormData,
): Promise<ManageSubjectFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta la materia a editar.' };
  }

  const parsed = parseSubjectFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

/**
 * Soft delete de materia (US-062). DELETE /api/academic/subjects/{id}. Si otras materias la tienen
 * como correlativa, el backend devuelve 409 has_dependents con el listado: lo propagamos tal cual
 * para que la fila lo muestre explícito, no como error genérico.
 */
export async function deactivateSubjectAction(id: string): Promise<DeactivateSubjectResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/subjects/${id}`, { method: 'DELETE' });
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }

  if (response.ok) {
    return { ok: true };
  }
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos la materia.' };
  if (response.status === 409) {
    const body = await readJsonBody<{ dependents?: SubjectDependent[] }>(response);
    return {
      ok: false,
      message: 'Otras materias dependen de esta como correlativa. Reasignalas antes de archivarla.',
      dependents: body?.dependents,
    };
  }
  return { ok: false, message: 'No pudimos archivar la materia. Probá de nuevo.' };
}

/** Reactivar materia (US-062). POST /api/academic/subjects/{id}/reactivate. */
export async function reactivateSubjectAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/subjects/${id}/reactivate`, {
      method: 'POST',
    });
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }

  if (response.ok) return { ok: true };
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos la materia.' };
  if (response.status === 409) {
    return { ok: false, message: 'La materia ya estaba activa. Refrescá la página.' };
  }
  return { ok: false, message: 'No pudimos reactivar la materia. Probá de nuevo.' };
}

/**
 * Alta de una correlativa (US-062, panel de correlativas). POST
 * /api/academic/subjects/{subjectId}/prerequisites. El subjectId (la materia "dueña" de la regla)
 * viaja en un hidden input del form; requiredSubjectId + type son los campos elegidos. El backend
 * valida aciclicidad (409 cycle_detected) y que ambas materias sean del mismo plan (400 cross_plan):
 * los dos casos se traducen a un mensaje específico, no al genérico de "datos inválidos".
 */
export async function addPrerequisiteAction(
  _prev: ManagePrerequisiteFormState,
  formData: FormData,
): Promise<ManagePrerequisiteFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const subjectId = formData.get('subjectId')?.toString();
  if (!subjectId) {
    return {
      status: 'error',
      message: 'Elegí primero la materia a la que le agregás la correlativa.',
    };
  }

  const parsed = prerequisiteFieldsSchema.safeParse({
    requiredSubjectId: formData.get('requiredSubjectId')?.toString() ?? '',
    type: formData.get('type')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/subjects/${subjectId}/prerequisites`, {
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
    // El backend responde con `Results.Problem(title: error.Code, ...)`, o sea RFC 7807: el código
    // de dominio viaja en `title`, no en un campo `code` (ver lib/api-problem.ts).
    const body = await readJsonBody<ProblemDetails>(response);
    if (body?.title === 'academic.prerequisite.cross_plan') {
      return {
        status: 'error',
        message: 'Las dos materias tienen que pertenecer al mismo plan de estudios.',
      };
    }
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) return { status: 'error', message: 'No encontramos la materia.' };
  if (response.status === 409) {
    const body = await readJsonBody<ProblemDetails>(response);
    if (body?.title === 'academic.prerequisite.cycle_detected') {
      return {
        status: 'error',
        message:
          'Esa correlativa generaría un ciclo: la materia terminaría dependiendo de sí misma a través de otras. Elegí otra materia.',
      };
    }
    return { status: 'error', message: 'Esa correlativa ya está cargada para este tipo.' };
  }
  return { status: 'error', message: 'No pudimos agregar la correlativa. Probá de nuevo.' };
}

/**
 * Quitar una correlativa (US-062, panel de correlativas). DELETE
 * /api/academic/subjects/{subjectId}/prerequisites/{requiredSubjectId}/{type}.
 */
export async function removePrerequisiteAction(
  subjectId: string,
  requiredSubjectId: string,
  type: PrerequisiteType,
): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(
      `/api/academic/subjects/${subjectId}/prerequisites/${requiredSubjectId}/${type}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }

  if (response.ok) return { ok: true };
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos esa correlativa.' };
  return { ok: false, message: 'No pudimos quitar la correlativa. Probá de nuevo.' };
}

function mapWriteResponse(response: Response, fallback: string): ManageSubjectFormState {
  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos el plan o la materia.' };
  }
  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya existe una materia con ese código en este plan.',
    };
  }
  return { status: 'error', message: fallback };
}

/** Lee el body JSON de una response de error sin tirar si no es JSON válido o está vacío. */
async function readJsonBody<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}
