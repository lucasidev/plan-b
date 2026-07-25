'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ProblemDetails } from '@/lib/api-problem';
import { getSession } from '@/lib/session';
import { commissionFieldsSchema } from './schema';
import type { ManageCommissionFormState, ToggleResult } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar comisiones.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/**
 * Arma el payload de comisión compartido por alta y edición. Docentes y horario viajan como arrays
 * paralelos (un hidden input por fila del repeater, mismo `name` para todas las filas): `teacherId` +
 * `teacherRole` se zipean por posición en un array de docentes, `scheduleDay` + `scheduleStart` +
 * `scheduleEnd` en un array de bloques. Mismo criterio que `institutionalEmailDomains` en
 * manage-universities (FormData.getAll), extendido a filas de más de un campo.
 */
function parseCommissionFields(formData: FormData) {
  const teacherIds = formData.getAll('teacherId').map((v) => v.toString());
  const teacherRoles = formData.getAll('teacherRole').map((v) => v.toString());
  const teachers = teacherIds.map((teacherId, i) => ({
    teacherId,
    role: teacherRoles[i] ?? '',
  }));

  const days = formData.getAll('scheduleDay').map((v) => v.toString());
  const starts = formData.getAll('scheduleStart').map((v) => v.toString());
  const ends = formData.getAll('scheduleEnd').map((v) => v.toString());
  const schedule = days.map((day, i) => ({
    day,
    start: starts[i] ?? '',
    end: ends[i] ?? '',
  }));

  return commissionFieldsSchema.safeParse({
    name: formData.get('name')?.toString() ?? '',
    modality: formData.get('modality')?.toString() ?? '',
    capacity: formData.get('capacity')?.toString() ?? '',
    notes: formData.get('notes')?.toString() ?? '',
    teachers,
    schedule,
  });
}

/**
 * Alta de comisión (US-093). POST /api/academic/subjects/{subjectId}/commissions. subjectId y termId
 * viajan en hidden inputs (la materia elegida en el select, el término fijo del contexto de la
 * pantalla). Mutación pura: el cliente redirige al listado en success.
 */
export async function createCommissionAction(
  _prev: ManageCommissionFormState,
  formData: FormData,
): Promise<ManageCommissionFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const subjectId = formData.get('subjectId')?.toString();
  if (!subjectId) {
    return { status: 'error', message: 'Elegí una materia.' };
  }
  const termId = formData.get('termId')?.toString();
  if (!termId) {
    return { status: 'error', message: 'Falta el período de la comisión.' };
  }

  const parsed = parseCommissionFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/subjects/${subjectId}/commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId, ...parsed.data }),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear la comisión. Probá de nuevo en un rato.');
}

/**
 * Edición de comisión (US-093). PUT /api/academic/commissions/{id}. Subject y término no viajan (no
 * se pueden mover): replace del resto del form completo.
 */
export async function updateCommissionAction(
  _prev: ManageCommissionFormState,
  formData: FormData,
): Promise<ManageCommissionFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta la comisión a editar.' };
  }

  const parsed = parseCommissionFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/commissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

/** Baja de comisión (US-093). POST /api/academic/commissions/{id}/deactivate. Invocado por fila. */
export async function deactivateCommissionAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/commissions/${id}/deactivate`);
}

/** Reactivar comisión (US-093). POST /api/academic/commissions/{id}/reactivate. */
export async function reactivateCommissionAction(id: string): Promise<ToggleResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: SESSION_EXPIRED };
  }
  return toggle(`/api/academic/commissions/${id}/reactivate`);
}

async function toggle(path: string): Promise<ToggleResult> {
  let response: Response;
  try {
    response = await apiFetchAuthenticated(path, { method: 'POST' });
  } catch {
    return { ok: false, message: NO_CONNECTION };
  }
  if (response.ok) {
    return { ok: true };
  }
  if (response.status === 401) return { ok: false, message: SESSION_EXPIRED };
  if (response.status === 403) return { ok: false, message: FORBIDDEN };
  if (response.status === 404) return { ok: false, message: 'No encontramos la comisión.' };
  if (response.status === 409) {
    return { ok: false, message: 'La comisión ya estaba en ese estado. Refrescá la página.' };
  }
  return { ok: false, message: 'No pudimos cambiar el estado. Probá de nuevo.' };
}

/**
 * Mapeo de errores de alta/edición. El backend responde RFC 7807 (`title` = código de dominio,
 * `detail` = mensaje); varios códigos de negocio (nombre duplicado, solape de horario, universidad
 * cruzada) llegan como 400/404/409 según el caso, así que se distingue primero por `title` y recién
 * después por status HTTP para el resto.
 */
async function mapWriteResponse(
  response: Response,
  fallback: string,
): Promise<ManageCommissionFormState> {
  if (response.ok) {
    return { status: 'success' };
  }

  const body = await readJsonBody<ProblemDetails>(response);
  switch (body?.title) {
    case 'academic.commission.subject_not_found':
      return { status: 'error', message: 'No encontramos la materia elegida.' };
    case 'academic.commission.subject_inactive':
      return {
        status: 'error',
        message: 'Esa materia está archivada: no se pueden crear comisiones nuevas sobre ella.',
      };
    case 'academic.commission.term_not_found':
      return { status: 'error', message: 'No encontramos el período lectivo.' };
    case 'academic.commission.term_kind_mismatch':
      return {
        status: 'error',
        message: 'La cadencia de la materia no coincide con la del período elegido.',
      };
    case 'academic.commission.university_mismatch':
      return {
        status: 'error',
        message:
          'La materia, el período y los docentes asignados tienen que ser de la misma universidad.',
      };
    case 'academic.commission.teacher_not_found':
      return { status: 'error', message: 'Uno de los docentes asignados no existe.' };
    case 'academic.commission.name_already_exists':
      return {
        status: 'error',
        message: 'Ya existe una comisión con ese nombre para esta materia y período.',
      };
    case 'academic.commission.schedule_overlap':
      return {
        status: 'error',
        message: 'Dos bloques horarios se superponen. Revisá los horarios cargados.',
      };
    case 'academic.commission.titular_already_assigned':
      return {
        status: 'error',
        message: 'Ya hay un docente titular asignado: solo puede haber uno.',
      };
    case 'academic.commission.teacher_already_assigned':
      return { status: 'error', message: 'Ese docente ya está asignado a la comisión.' };
    case 'academic.commission.capacity_not_positive':
      return { status: 'error', message: 'El cupo tiene que ser mayor a cero.' };
    case 'academic.commission.name_too_long':
      return { status: 'error', message: 'El nombre es demasiado largo.' };
    case 'academic.commission.notes_too_long':
      return { status: 'error', message: 'Las notas son demasiado largas.' };
    default:
      break;
  }

  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la comisión, la materia o el período.' };
  }
  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya existe una comisión con ese nombre para esta materia y período.',
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
