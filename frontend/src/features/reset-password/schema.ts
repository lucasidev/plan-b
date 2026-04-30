import { z } from 'zod';

/**
 * Reset-password form input. Mirrors the sign-up password rules (≥ 12 chars,
 * confirm matches). The token is opaque; client-side we just check it isn't
 * empty so we don't fire a guaranteed-404 round trip when someone navigates
 * to /reset-password without `?token=`.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Falta el token de recuperación'),
    password: z.string().min(12, 'La contraseña tiene que tener al menos 12 caracteres'),
    confirm: z.string().min(1, 'Repetí la contraseña'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
