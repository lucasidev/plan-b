/**
 * Types for the sign-in feature: backend response shape, the action state
 * for useActionState and the initial state. State and initial value live
 * here (not in actions.ts) because actions.ts is `'use server'` and
 * Next.js only allows async function exports from such files.
 */

/** Cuerpo del 200 de sign-in. `role` viaja como lo escribe el enum de C#: PascalCase. */
export type SignInUserPayload = {
  userId: string;
  email: string;
  role: string;
};

/**
 * `kind` discriminator lets the form react to specific failure modes
 * (e.g. ofrecer el reenvío bajo invalid_credentials) without re-parsing the
 * message. Anti-enumeration: invalid_credentials is returned for both
 * wrong-email and wrong-password (mirrors the backend's UserErrors).
 *
 * `email` viaja con `invalid_credentials` para que el form pueda ofrecer el reenvío de
 * verificación (US-021) sin un input controlado. El backend no confirma si es una cuenta real
 * (ADR-0076: el mail sin verificar responde igual que una credencial mala), pero a esta altura
 * la persona ya tipeó su email, así que devolvérselo a su propio cliente no agrega información.
 */
export type SignInFormState =
  | { status: 'idle' }
  // El destino lo decide el action, que es donde vive esa lógica; navega el componente
  // (ADR-0046). Ver `lib/navigate-after-mutation.ts` por qué no alcanza `router.push`.
  | { status: 'success'; redirectTo: string }
  | {
      status: 'error';
      kind: 'account_disabled' | 'unknown';
      message: string;
    }
  | {
      status: 'error';
      kind: 'invalid_credentials';
      message: string;
      email: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };
