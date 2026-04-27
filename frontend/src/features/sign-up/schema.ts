import { z } from 'zod';

/**
 * Sign-up form input. Mirrors the contract of POST /api/identity/register
 * (email, password) plus a client-side `confirm` field that the backend never
 * sees. The 12-char password floor matches what the backend's RegisterUser
 * validator enforces; the client copy validation only saves a round-trip.
 *
 * No institutional email gate: per US-010-f explicitly does not replicate
 * the `@unsta.edu.ar` rule. Anyone with a valid email format can register.
 */
export const signUpSchema = z
  .object({
    email: z.string().min(1, 'Ingresá tu email').email('Ingresá un email válido'),
    password: z.string().min(12, 'La contraseña tiene que tener al menos 12 caracteres'),
    confirm: z.string().min(1, 'Repetí la contraseña'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
