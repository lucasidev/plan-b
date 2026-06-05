import { z } from 'zod';

/**
 * Resend-verification form input. The backend accepts any string and returns 204
 * regardless (anti-enumeration, same as forgot-password). Client-side validation is
 * purely UX: we catch obvious typos before the round-trip without leaking which emails
 * are registered.
 */
export const resendVerificationSchema = z.object({
  email: z.string().min(1, 'Necesitamos tu email').email('Email inválido'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
