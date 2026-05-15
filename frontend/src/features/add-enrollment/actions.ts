'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { addEnrollmentSchema } from './schema';
import type { AddEnrollmentFormState } from './types';

/**
 * Server action del form de US-013-f. Hace POST /api/me/enrollment-records
 * (US-013 backend) y al éxito (201) redirige a `/mi-carrera?tab=historial`.
 *
 * El UserId se extrae del session JWT del lado server (no del client) por
 * la misma razón que onboarding/career: el endpoint backend lo acepta en
 * body por el gap de JwtBearer middleware, pero acá bloqueamos inputs
 * adversariales antes de que lleguen.
 *
 * Mapeo de errores del backend:
 *   - 400 validación → mensaje específico en el state (re-valida el aggregate
 *     las invariantes status/grade/method/commission/term).
 *   - 404 student_profile_required → el guard del layout debería evitarlo;
 *     si llega acá es un edge case (profile fue eliminado durante la sesión).
 *   - 409 duplicate → mensaje contextual.
 */
export async function submitAddEnrollmentAction(
  _prev: AddEnrollmentFormState,
  formData: FormData,
): Promise<AddEnrollmentFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a iniciar sesión y reintentá.',
    };
  }

  const raw = {
    subjectId: formData.get('subjectId')?.toString() ?? '',
    commissionId: emptyToNull(formData.get('commissionId')?.toString()),
    termId: emptyToNull(formData.get('termId')?.toString()),
    status: formData.get('status')?.toString() ?? '',
    approvalMethod: emptyToNull(formData.get('approvalMethod')?.toString()),
    grade: emptyToNull(formData.get('grade')?.toString()),
  };

  const parsed = addEnrollmentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue.message,
      field: issue.path[0]?.toString(),
    };
  }

  const response = await apiFetch('/api/me/enrollment-records', {
    method: 'POST',
    body: JSON.stringify({
      userId: session.userId,
      subjectId: parsed.data.subjectId,
      commissionId: parsed.data.commissionId ?? null,
      termId: parsed.data.termId ?? null,
      status: parsed.data.status,
      approvalMethod: parsed.data.approvalMethod ?? null,
      grade: parsed.data.grade ?? null,
    }),
  });

  if (response.status === 201) {
    redirect('/mi-carrera?tab=historial');
  }

  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya cargaste esta materia para ese cuatrimestre.',
    };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message: 'No encontramos tu perfil de estudiante. Volvé a iniciar sesión.',
    };
  }

  if (response.status === 400) {
    // Backend pasó ProblemDetails con title. Lo mostramos genérico — los casos
    // específicos los frena la validación client-side de zod.
    return {
      status: 'error',
      message: 'No pudimos guardar la entrada. Revisá los datos y reintentá.',
    };
  }

  return {
    status: 'error',
    message: 'No pudimos guardar la entrada. Intentá de nuevo en un rato.',
  };
}

function emptyToNull(value: string | undefined): string | null {
  if (value === undefined) return null;
  const t = value.trim();
  return t === '' ? null : t;
}
