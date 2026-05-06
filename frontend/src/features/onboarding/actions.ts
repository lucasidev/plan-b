'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getSession } from '@/lib/session';
import { onboardingCareerSchema } from './schema';
import type { OnboardingCareerFormState } from './types';

/**
 * Server action del paso 02 del onboarding (US-037-f). Crea el StudentProfile
 * via `POST /api/me/student-profiles` (endpoint US-012-b shipped).
 *
 * El `userId` se extrae del JWT validado server-side via `getSession()` en
 * lugar de aceptarlo del cliente — el endpoint backend lo acepta en body
 * por el gap conocido de JwtBearer middleware, pero acá nosotros bloqueamos
 * inputs adversariales antes de que lleguen al backend.
 *
 * Al éxito (201) hace `redirect('/onboarding/history')` (NEXT_REDIRECT throw).
 * En 409 mapea a "ya tenés un perfil" — caso del two-tabs race del edge case
 * en US-037-f.
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

  const response = await apiFetch('/api/me/student-profiles', {
    method: 'POST',
    body: JSON.stringify({
      userId: session.userId,
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
