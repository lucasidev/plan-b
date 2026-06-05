import { z } from 'zod';

/**
 * Request shape of PATCH /api/me/student-profile (US-047). Everything nullable: the
 * form only sends the changed fields. The backend owns the truth on ranges and lengths
 * (specific errors come as 400 with title `identity.student_profile.*`); here we
 * pre-validate the cheap stuff to avoid round-trips.
 */
export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(80, 'Máximo 80 caracteres')
    .optional(),
  yearOfStudy: z
    .number()
    .int('Tiene que ser un número entero')
    .min(1, 'Mínimo año 1')
    .max(8, 'Máximo año 8')
    .optional(),
  legajo: z.string().trim().max(32, 'Máximo 32 caracteres').optional(),
  regularStudent: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
