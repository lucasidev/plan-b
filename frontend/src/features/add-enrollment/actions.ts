'use server';

import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { addEnrollmentSchema } from './schema';
import type { AddEnrollmentFormState } from './types';

/**
 * Server action for the US-013-f form. POSTs /api/me/enrollment-records (US-013 backend)
 * and on success (201) redirects to `/my-career?tab=transcript`.
 *
 * The UserId is taken from the session JWT on the server (not from the client) for the
 * same reason as onboarding/career: the backend endpoint accepts it in the body because
 * of the JwtBearer middleware gap, but we block adversarial inputs here before they
 * reach the backend.
 *
 * Backend error mapping:
 *   - 400 validation → specific message in the state (the aggregate re-validates the
 *     status/grade/method/commission/term invariants).
 *   - 404 student_profile_required → the layout guard should prevent this; if it lands
 *     here it is an edge case (profile was deleted during the session).
 *   - 409 duplicate → contextual message.
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

  const response = await apiFetchAuthenticated('/api/me/enrollment-records', {
    method: 'POST',
    body: JSON.stringify({
      subjectId: parsed.data.subjectId,
      commissionId: parsed.data.commissionId ?? null,
      termId: parsed.data.termId ?? null,
      status: parsed.data.status,
      approvalMethod: parsed.data.approvalMethod ?? null,
      grade: parsed.data.grade ?? null,
    }),
  });

  if (response.status === 201) {
    redirect('/my-career?tab=transcript');
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
    // Backend returned ProblemDetails with a title. We surface a generic message:
    // the specific cases are already caught by client-side zod validation.
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
