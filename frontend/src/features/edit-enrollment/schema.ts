import { z } from 'zod';
import {
  checkEnrollmentInvariants,
  enrollmentAcademicStateShape,
} from '@/lib/enrollment-invariants';

/**
 * Zod schema de la edición de una cursada (US-015-f). Es el schema del alta menos la materia: el
 * PATCH del backend no la acepta, porque cambiar de materia no es corregir una cursada, es cargar
 * otra.
 *
 * Las invariantes cross-field son las mismas y viven compartidas (`lib/enrollment-invariants.ts`),
 * igual que en el backend, donde `Create` y `Update` comparten un solo `ValidateInvariants`.
 */
export const editEnrollmentSchema = z
  .object(enrollmentAcademicStateShape)
  .superRefine(checkEnrollmentInvariants);

export type EditEnrollmentInput = z.infer<typeof editEnrollmentSchema>;
