'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { addChairMemberSchema, closeChairMemberSchema, createChairSchema } from './schema';
import type { ManageChairFormState } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar cátedras.';

async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === 'admin';
}

/**
 * Traduce la respuesta del backend a un mensaje para quien carga. Los códigos son los de
 * `ChairErrors`: cada uno dice qué pasó, no "algo salió mal".
 */
async function toFormState(response: Response): Promise<ManageChairFormState> {
  if (response.ok) {
    return { status: 'success' };
  }

  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };

  const problem = (await response.json().catch(() => null)) as { title?: string } | null;
  const message = MESSAGES[problem?.title ?? ''] ?? 'No pudimos guardar el cambio.';
  return { status: 'error', message };
}

const MESSAGES: Record<string, string> = {
  'academic.chair.name_already_exists': 'Ya hay una cátedra con ese nombre en esta materia.',
  'academic.chair.subject_not_found': 'Esa materia no existe.',
  'academic.chair.subject_inactive': 'Esa materia está archivada: no se le abren cátedras nuevas.',
  'academic.chair.not_found': 'Esa cátedra no existe.',
  'academic.chair.teacher_not_found': 'Ese docente no existe.',
  'academic.chair.teacher_inactive': 'Ese docente está archivado.',
  'academic.chair.term_not_found': 'Ese período no existe.',
  'academic.chair.teacher_already_in_chair': 'Ese docente ya integra la cátedra.',
  'academic.chair.teacher_not_in_chair': 'Ese docente no integra la cátedra.',
  'academic.chair.lead_already_assigned': 'La cátedra ya tiene un titular vigente.',
  'academic.chair.university_mismatch':
    'El docente y el período tienen que ser de la misma universidad que la materia.',
  'academic.chair.invalid_member_role': 'Ese rol no existe.',
  'academic.chair.member_role_required': 'Elegí un rol.',
};

/** Alta de una cátedra sobre una materia (US-196). Mutación pura: la pantalla reacciona al status. */
export async function createChairAction(
  _prev: ManageChairFormState,
  formData: FormData,
): Promise<ManageChairFormState> {
  if (!(await isAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const parsed = createChairSchema.safeParse({
    subjectId: formData.get('subjectId')?.toString() ?? '',
    name: formData.get('name')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated(
      `/api/academic/subjects/${parsed.data.subjectId}/chairs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parsed.data.name }),
      },
    );
    return await toFormState(response);
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

/** Suma un docente al equipo, desde un período (US-196). */
export async function addChairMemberAction(
  _prev: ManageChairFormState,
  formData: FormData,
): Promise<ManageChairFormState> {
  if (!(await isAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const parsed = addChairMemberSchema.safeParse({
    chairId: formData.get('chairId')?.toString() ?? '',
    teacherId: formData.get('teacherId')?.toString() ?? '',
    role: formData.get('role')?.toString() ?? '',
    sinceTermId: formData.get('sinceTermId')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated(
      `/api/academic/chairs/${parsed.data.chairId}/members`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: parsed.data.teacherId,
          role: parsed.data.role,
          sinceTermId: parsed.data.sinceTermId,
        }),
      },
    );
    return await toFormState(response);
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}

/**
 * Cierra el tramo de un docente en un período (US-196). No lo borra: lo que dictó sigue siendo
 * cierto, y borrarlo dejaría las reseñas de esos períodos atribuidas a quien vino después.
 */
export async function closeChairMemberAction(
  _prev: ManageChairFormState,
  formData: FormData,
): Promise<ManageChairFormState> {
  if (!(await isAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const parsed = closeChairMemberSchema.safeParse({
    chairId: formData.get('chairId')?.toString() ?? '',
    teacherId: formData.get('teacherId')?.toString() ?? '',
    untilTermId: formData.get('untilTermId')?.toString() ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  try {
    const response = await apiFetchAuthenticated(
      `/api/academic/chairs/${parsed.data.chairId}/members/${parsed.data.teacherId}/close`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ untilTermId: parsed.data.untilTermId }),
      },
    );
    return await toFormState(response);
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }
}
