import { z } from 'zod';
import {
  checkEnrollmentInvariants,
  enrollmentAcademicStateShape,
} from '@/lib/enrollment-invariants';

/**
 * Zod schema for the load-transcript-entry form (US-013-f). Shared between client
 * validation (TanStack Form / inline) and the server action.
 *
 * Las invariantes cross-field viven en `lib/enrollment-invariants.ts`: son las mismas que revalida
 * la edición (US-015-f) y las mismas que el aggregate `EnrollmentRecord` exige en el backend, que
 * sigue siendo la fuente de verdad. Acá solo se corta lo obvio para no disparar requests imposibles.
 */
export const addEnrollmentSchema = z
  .object({
    subjectId: z.string().uuid({ message: 'Elegí una materia.' }),
    ...enrollmentAcademicStateShape,
  })
  .superRefine(checkEnrollmentInvariants);

export type AddEnrollmentInput = z.infer<typeof addEnrollmentSchema>;
