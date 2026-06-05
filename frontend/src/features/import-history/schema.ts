import { z } from 'zod';

/**
 * Schema del confirm form. Los items se editan en una tabla; al confirmar se
 * envían como JSON al backend. Las invariantes status/grade/method/term las
 * re-valida el aggregate EnrollmentRecord en el backend; acá solo gateamos los
 * obvios para no mandar requests inválidos.
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

export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB, mismo que backend
