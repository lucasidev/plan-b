import { z } from 'zod';

/**
 * Sign-up form input. Mirrors the contract of POST /api/identity/register
 * (email, password, careerId, careerPlanId) plus a client-side `confirm` field that the
 * backend never sees. The 12-char password floor matches what the backend's
 * RegisterUser validator enforces; the client copy validation only saves a
 * round-trip.
 *
 * `careerId` y `careerPlanId` son lo que elige el `<CareerPicker>`: la carrera se declara al
 * registrarse (ADR-0086). `careerPlanId` es opcional: la mayoría del catálogo real todavía no
 * tiene un plan relevado, y esa carrera se registra igual, sin plan. `null` (el `<select>` del
 * plan queda disabled cuando la carrera no tiene ninguno) es una elección válida; `""` (hay
 * planes para elegir y no se eligió ninguno) no lo es.
 *
 * No institutional email gate: per US-010-f explicitly does not replicate
 * the `@unsta.edu.ar` rule. Anyone with a valid email format can register.
 */
export const signUpSchema = z
  .object({
    email: z.string().min(1, 'Ingresá tu email').email('Ingresá un email válido'),
    password: z.string().min(12, 'La contraseña tiene que tener al menos 12 caracteres'),
    confirm: z.string().min(1, 'Repetí la contraseña'),
    careerId: z.string().uuid({ message: 'Elegí tu carrera' }),
    careerPlanId: z.string().uuid({ message: 'Elegí un plan de estudios' }).nullable(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
