import { z } from 'zod';

/**
 * Schema for the confirm form. Items are edited in a table; on confirm they are sent
 * to the backend as JSON. The status/grade/method/term invariants are re-validated by
 * the EnrollmentRecord aggregate in the backend; here we only gate the obvious cases
 * to avoid invalid requests.
 */
export const confirmedItemSchema = z
  .object({
    subjectId: z.string().uuid({ message: 'Materia inválida.' }),
    termId: z.string().uuid().optional().nullable(),
    status: z.enum(['Aprobada', 'Regular', 'Cursando', 'Reprobada', 'Abandonada']),
    approvalMethod: z
      .enum(['Cursada', 'Promocion', 'Final', 'FinalLibre', 'Equivalencia'])
      .optional()
      .nullable(),
    grade: z.coerce.number().min(0).max(10).optional().nullable(),
  })
  .refine((d) => d.status !== 'Aprobada' || !!d.approvalMethod, {
    message: 'Aprobada requiere forma de aprobación.',
    path: ['approvalMethod'],
  });

export type ConfirmedItemInput = z.infer<typeof confirmedItemSchema>;

export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB, same as backend
