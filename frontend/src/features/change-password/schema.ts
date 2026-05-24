import { z } from 'zod';

/**
 * Espeja el contrato del PATCH /api/me/password (US-079-i). El backend tiene la verdad sobre
 * "current vs new vs same" y devuelve 401/400 con los códigos específicos; acá pre-validamos
 * solo presencia + length floor para evitar round-trips obvios.
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
