import { z } from 'zod';

/**
 * Forgot-password form input. The backend accepts any string and returns 204
 * regardless (anti-enumeration). Client-side validation is purely UX:
 * catch obvious typos before the round-trip without leaking which addresses
 * are registered.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Ingresá tu email').email('Ingresá un email válido'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
