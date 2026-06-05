import { z } from 'zod';

/**
 * Zod schema for the load-transcript-entry form (US-013-f). Shared between client
 * validation (TanStack Form / inline) and the server action.
 *
 * The status/grade/approvalMethod/commission/term invariants are re-validated by the
 * aggregate in the backend; here we just stop the obvious cases so we don't fire
 * impossible requests. The backend is the source of truth.
 */
export const addEnrollmentSchema = z
  .object({
    subjectId: z.string().uuid({ message: 'Elegí una materia.' }),
    commissionId: z.string().uuid().optional().nullable(),
    termId: z.string().uuid().optional().nullable(),
    status: z.enum(['Aprobada', 'Regular', 'Cursando', 'Reprobada', 'Abandonada'], {
      message: 'Elegí un estado válido.',
    }),
    approvalMethod: z
      .enum(['Cursada', 'Promocion', 'Final', 'FinalLibre', 'Equivalencia'])
      .optional()
      .nullable(),
    grade: z.coerce
      .number()
      .min(0, { message: 'La nota debe ser >= 0.' })
      .max(10, { message: 'La nota debe ser <= 10.' })
      .optional()
      .nullable(),
  })
  .refine((d) => d.status !== 'Aprobada' || !!d.approvalMethod, {
    message: 'Aprobada requiere forma de aprobación.',
    path: ['approvalMethod'],
  })
  .refine((d) => !(d.status === 'Aprobada' || d.status === 'Regular') || d.grade != null, {
    message: 'La nota es obligatoria.',
    path: ['grade'],
  })
  .refine((d) => d.status !== 'Cursando' || !!d.termId, {
    message: 'Indicá el cuatrimestre.',
    path: ['termId'],
  })
  .refine((d) => d.approvalMethod !== 'Equivalencia' || (!d.commissionId && !d.termId), {
    message: 'Equivalencia no lleva comisión ni cuatrimestre.',
    path: ['approvalMethod'],
  })
  .refine((d) => d.approvalMethod !== 'FinalLibre' || (!d.commissionId && !!d.termId), {
    message: 'Final libre requiere cuatrimestre sin comisión.',
    path: ['approvalMethod'],
  });

export type AddEnrollmentInput = z.infer<typeof addEnrollmentSchema>;
