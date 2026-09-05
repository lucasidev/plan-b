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
 * `email` viaja con todo error, sea cual sea su `kind`: el mail tal como se tipeó, haya pasado o
 * no la validación. El input de mail del form es no controlado y React resetea el form apenas
 * la action termina, así que sin este valor quien reintenta después de un error tiene que
 * volver a tipearlo. Devolvérselo a su propio cliente no agrega información (ADR-0076).
 */
export type SignInFormState =
  | { status: 'idle' }
  // El destino lo decide el action, que es donde vive esa lógica; navega el componente
  // (ADR-0046). Ver `lib/navigate-after-mutation.ts` por qué no alcanza `router.push`.
  | { status: 'success'; redirectTo: string }
  | {
      status: 'error';
      kind: 'account_disabled' | 'unknown' | 'invalid_credentials';
      message: string;
      email: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };
