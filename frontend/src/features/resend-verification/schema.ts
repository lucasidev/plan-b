import { z } from 'zod';

/**
 * Resend-verification form input. El backend acepta cualquier string y devuelve 204
 * regardless (anti-enumeración, igual que forgot-password). La validación cliente es
 * UX pura: cazamos typos obvios antes del round-trip sin filtrar qué emails están
 * registrados.
 */
export const resendVerificationSchema = z.object({
  email: z.string().min(1, 'Necesitamos tu email').email('Email inválido'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
