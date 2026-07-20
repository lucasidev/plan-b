'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { termFieldsSchema } from './schema';
import type { ManageTermFormState } from './types';

const SESSION_EXPIRED = 'Tu sesión expiró. Volvé a iniciar sesión.';
const NO_CONNECTION = 'No pudimos conectarnos al servidor. Probá de nuevo.';
const FORBIDDEN = 'No tenés permisos para gestionar períodos lectivos.';

async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return null;
  }
  return session.userId;
}

/**
 * Arma el payload de período lectivo compartido por alta y edición. `startDate`/`endDate` viajan
 * tal cual el string "YYYY-MM-DD" del `input type="date"` (matchea el `DateOnly` del backend);
 * `enrollmentOpens`/`enrollmentCloses` viajan el string "YYYY-MM-DDTHH:mm" del
 * `input type="datetime-local"`, sin offset (el backend lo interpreta como `DateTimeOffset`). `kind`
 * viaja como string; el backend lo parsea a enum. El label NO viaja: lo computa el backend.
 */
function parseTermFields(formData: FormData) {
  return termFieldsSchema.safeParse({
    year: formData.get('year')?.toString() ?? '',
    number: formData.get('number')?.toString() ?? '',
    kind: formData.get('kind')?.toString() ?? '',
    startDate: formData.get('startDate')?.toString() ?? '',
    endDate: formData.get('endDate')?.toString() ?? '',
    enrollmentOpens: formData.get('enrollmentOpens')?.toString() ?? '',
    enrollmentCloses: formData.get('enrollmentCloses')?.toString() ?? '',
  });
}

/**
 * Alta de período lectivo (US-064). POST /api/academic/universities/{universityId}/terms. El
 * universityId viaja en un hidden input del form (el período se ancla a la uni). Mutación pura: el
 * form redirige al listado en success.
 */
export async function createTermAction(
  _prev: ManageTermFormState,
  formData: FormData,
): Promise<ManageTermFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const universityId = formData.get('universityId')?.toString();
  if (!universityId) {
    return { status: 'error', message: 'Falta la universidad del período.' };
  }

  const parsed = parseTermFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/universities/${universityId}/terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos crear el período. Probá de nuevo en un rato.');
}

/**
 * Edición de período lectivo (US-064). PATCH /api/academic/academic-terms/{id}. Replace del form
 * completo: el backend recomputa el label a partir de los nuevos year/number/kind.
 */
export async function updateTermAction(
  _prev: ManageTermFormState,
  formData: FormData,
): Promise<ManageTermFormState> {
  if (!(await requireAdmin())) {
    return { status: 'error', message: SESSION_EXPIRED };
  }

  const id = formData.get('id')?.toString();
  if (!id) {
    return { status: 'error', message: 'Falta el período a editar.' };
  }

  const parsed = parseTermFields(formData);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' };
  }

  let response: Response;
  try {
    response = await apiFetchAuthenticated(`/api/academic/academic-terms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return { status: 'error', message: NO_CONNECTION };
  }

  return mapWriteResponse(response, 'No pudimos guardar los cambios. Probá de nuevo en un rato.');
}

function mapWriteResponse(response: Response, fallback: string): ManageTermFormState {
  if (response.ok) {
    return { status: 'success' };
  }
  if (response.status === 400) {
    return { status: 'error', message: 'Revisá los datos: hay algún campo inválido.' };
  }
  if (response.status === 401) return { status: 'error', message: SESSION_EXPIRED };
  if (response.status === 403) return { status: 'error', message: FORBIDDEN };
  if (response.status === 404) {
    return { status: 'error', message: 'No encontramos la universidad o el período.' };
  }
  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya existe un período con ese año, número y cadencia en esta universidad.',
    };
  }
  return { status: 'error', message: fallback };
}
