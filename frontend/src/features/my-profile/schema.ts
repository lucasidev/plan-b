import { z } from 'zod';

/**
 * Shape del request del PATCH /api/me/student-profile (US-047). Todos nullable: el form
 * envía solo los campos cambiados. El backend tiene la verdad sobre rangos y longitudes
 * (errores específicos vienen como 400 con title `identity.student_profile.*`); acá
 * pre-validamos lo barato para evitar round-trips.
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
