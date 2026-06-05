'use server';

import { redirect } from 'next/navigation';
import { apiFetchAuthenticated } from '@/lib/api-client.server';
import { getSession } from '@/lib/session';
import { onboardingCareerSchema } from './schema';
import type { OnboardingCareerFormState } from './types';

/**
 * Server action for onboarding step 02 (US-037-f). Creates the StudentProfile via
 * `POST /api/me/student-profiles` (endpoint shipped in US-012-b).
 *
 * The `userId` is extracted from the JWT validated server-side via `getSession()`
 * instead of taking it from the client. The backend endpoint accepts it in the body
 * because of the known JwtBearer middleware gap, but we block adversarial inputs here
 * before they reach the backend.
 *
 * On success (201) it `redirect('/onboarding/history')` (NEXT_REDIRECT throw).
 * On 409 it maps to "you already have a profile", the two-tabs race edge case
 * documented in US-037-f.
 */
export async function submitCareerAction(
  _prev: OnboardingCareerFormState,
  formData: FormData,
): Promise<OnboardingCareerFormState> {
  const session = await getSession();
  if (!session) {
    return {
      status: 'error',
      message: 'Tu sesión expiró. Volvé a iniciar sesión y completá el onboarding.',
    };
  }

  const raw = {
    universityId: formData.get('universityId')?.toString() ?? '',
    careerId: formData.get('careerId')?.toString() ?? '',
    careerPlanId: formData.get('careerPlanId')?.toString() ?? '',
    enrollmentYear: Number(formData.get('enrollmentYear')),
  };

  const parsed = onboardingCareerSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue.message,
      field: issue.path[0] === 'enrollmentYear' ? 'enrollmentYear' : undefined,
    };
  }

  const response = await apiFetchAuthenticated('/api/me/student-profiles', {
    method: 'POST',
    body: JSON.stringify({
      careerPlanId: parsed.data.careerPlanId,
      enrollmentYear: parsed.data.enrollmentYear,
    }),
  });

  if (response.status === 201) {
    redirect('/onboarding/history');
  }

  if (response.status === 409) {
    return {
      status: 'error',
      message: 'Ya tenés un perfil asociado. Andá a Inicio para empezar.',
    };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      message: 'Los datos no son válidos. Revisalos y probá de nuevo.',
    };
  }

  if (response.status === 403) {
    return {
      status: 'error',
      message: 'Tu cuenta todavía no está verificada. Revisá el mail que te mandamos.',
    };
  }

  return {
    status: 'error',
    message: 'No pudimos completar el onboarding. Probá de nuevo en un rato.',
  };
}
