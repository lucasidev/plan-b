import { z } from 'zod';

/**
 * Zod schema for the onboarding step 02 form (US-037-f). Shared between client-side
 * validation (TanStack Form) and the server action that calls
 * `POST /api/me/student-profiles`.
 *
 * Enrollment year is bounded to [1990, current_year + 1] to keep out absurd inputs.
 * The +1 covers the "I am planning to enroll next year" case without opening the door
 * to the whole future.
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
