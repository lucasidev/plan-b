import { z } from 'zod';

/**
 * Zod schema del form del paso 02 del onboarding (US-037-f). Se comparte
 * entre validación client-side (TanStack Form) y el server action que llama
 * a `POST /api/me/student-profiles`.
 *
 * El año de ingreso se acota a [1990, current_year + 1] para evitar inputs
 * absurdos. El +1 cubre el caso "estoy planeando ingresar el año que viene"
 * sin abrir todo el futuro.
 */
const currentYear = new Date().getFullYear();

export const onboardingCareerSchema = z.object({
  universityId: z.string().uuid({ message: 'Elegí una universidad' }),
  careerId: z.string().uuid({ message: 'Elegí una carrera' }),
  careerPlanId: z.string().uuid({ message: 'Elegí un plan de estudios' }),
  enrollmentYear: z
    .number({ invalid_type_error: 'Año inválido' })
    .int({ message: 'Año inválido' })
    .min(1990, { message: `Año entre 1990 y ${currentYear + 1}` })
    .max(currentYear + 1, { message: `Año entre 1990 y ${currentYear + 1}` }),
});

export type OnboardingCareerInput = z.infer<typeof onboardingCareerSchema>;
