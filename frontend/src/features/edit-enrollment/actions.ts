'use server';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { editEnrollmentSchema } from './schema';
import type { EditEnrollmentFormState } from './types';

/**
 * Server action de US-015-f. PATCH /api/me/enrollment-records/{id}.
 *
 * Mutación pura (ADR-0046): devuelve `success` y no navega ni revalida acá adentro. El form
 * reacciona al status invalidando y navegando al historial.
 *
 * El `enrollmentId` viaja en un hidden del form y no en un `bind`, para que el action siga siendo
 * `(prevState, formData)` y `useActionState` lo tome sin envoltorio. La pertenencia de la cursada la
 * chequea el backend contra el `sub` del JWT: mandar un id ajeno devuelve 404, no la edita.
 *
 * Mapeo de errores del backend:
 *   - 404 → la cursada no existe o no es del alumno (el backend no distingue, a propósito).
 *   - 400 → invariante que el schema local no atajó, o comisión/período que no encajan.
 */
export async function submitEditEnrollmentAction(
  _prev: EditEnrollmentFormState,
  formData: FormData,
): Promise<EditEnrollmentFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a iniciar sesión y reintentá.',
    };
  }

  const enrollmentId = formData.get('enrollmentId')?.toString() ?? '';
  if (!enrollmentId) {
    return {
      status: 'error',
      message: 'No pudimos identificar la cursada que estás editando.',
    };
  }

  const raw = {
    commissionId: emptyToNull(formData.get('commissionId')?.toString()),
    termId: emptyToNull(formData.get('termId')?.toString()),
    status: formData.get('status')?.toString() ?? '',
    approvalMethod: emptyToNull(formData.get('approvalMethod')?.toString()),
    grade: emptyToNull(formData.get('grade')?.toString()),
  };

  const parsed = editEnrollmentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue.message,
      field: issue.path[0]?.toString(),
    };
  }

  // Los cinco campos van completos y no como delta: las invariantes son cross-field, así que el
  // backend necesita el estado resultante entero para poder validarlo. Es el mismo contrato que
  // documenta `UpdateEnrollmentRequest`.
  const response = await apiFetchAuthenticated(`/api/me/enrollment-records/${enrollmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      commissionId: parsed.data.commissionId ?? null,
      termId: parsed.data.termId ?? null,
      status: parsed.data.status,
      approvalMethod: parsed.data.approvalMethod ?? null,
      grade: parsed.data.grade ?? null,
    }),
  });

  if (response.status === 200) {
    return { status: 'success' };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message: 'No encontramos esa cursada en tu historial.',
    };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      message: 'No pudimos guardar los cambios. Revisá los datos y reintentá.',
    };
  }

  return {
    status: 'error',
    message: 'No pudimos guardar los cambios. Intentá de nuevo en un rato.',
  };
}

function emptyToNull(value: string | undefined): string | null {
  if (value === undefined) return null;
  const t = value.trim();
  return t === '' ? null : t;
}
