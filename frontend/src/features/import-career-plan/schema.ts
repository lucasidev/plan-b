import { z } from 'zod';

export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Schema del form de upload. El alumno indica universidad (preseleccionada desde paso 2 del
 * onboarding), nombre de carrera, año del plan, año de ingreso, y sube PDF o pega texto.
 */
export const uploadCareerPlanSchema = z.object({
  universityId: z.string().uuid({ message: 'Universidad inválida.' }),
  careerName: z.string().min(1, 'Indicá el nombre de tu carrera.').max(200),
  planYear: z.coerce
    .number()
    .int()
    .min(1990, 'El año del plan está fuera de rango.')
    .max(new Date().getFullYear()),
  studentEnrollmentYear: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
});

export type UploadCareerPlanInput = z.infer<typeof uploadCareerPlanSchema>;

/**
 * Schema del item editable del preview. El backend re-valida cada uno; acá frenamos lo grosero.
 */
export const approveSubjectItemSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  yearInPlan: z.coerce.number().int().min(1).max(10),
  termInYear: z.coerce.number().int().min(1).max(6).nullable(),
  termKind: z.enum(['Cuatrimestral', 'Anual', 'Semestral', 'Bimestral']),
});

export type ApproveSubjectItemInput = z.infer<typeof approveSubjectItemSchema>;
