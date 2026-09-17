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
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
