import { z } from 'zod';

/**
 * Mirrors the PATCH /api/me/password contract (US-079-i). The backend owns the truth on
 * "current vs new vs same" and returns 401/400 with the specific codes; here we only
 * pre-validate presence + length floor to avoid obvious round-trips.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z
      .string()
      .min(12, 'La nueva contraseña tiene que tener al menos 12 caracteres')
      .max(200, 'Demasiado larga (máx. 200 caracteres)'),
    confirmPassword: z.string().min(1, 'Repetí la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña tiene que ser distinta a la actual',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
