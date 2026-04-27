import { z } from 'zod';

/**
 * Sign-in form input. Mirrors the contract of POST /api/identity/sign-in.
 * Per US-028-f: minimal client-side validation (non-empty email, password
 * with the same 12-char floor as sign-up). The backend remains the source
 * of truth for credential checking — this just avoids the round-trip on
 * obvious typos.
 */
export const signInSchema = z.object({
  email: z.string().min(1, 'Ingresá tu email').email('Ingresá un email válido'),
  password: z.string().min(12, 'La contraseña tiene que tener al menos 12 caracteres'),
});

export type SignInInput = z.infer<typeof signInSchema>;
