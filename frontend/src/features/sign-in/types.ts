/**
 * Types for the sign-in feature: backend response shape, the action state
 * for useActionState and the initial state. State and initial value live
 * here (not in actions.ts) because actions.ts is `'use server'` and
 * Next.js only allows async function exports from such files.
 */

export type SignInUserPayload = {
  userId: string;
  email: string;
  role: 'member' | 'moderator' | 'admin' | 'university_staff';
};

/**
 * `kind` discriminator lets the form react to specific failure modes
 * (e.g. show resend hint when email_not_verified) without re-parsing the
 * message. Anti-enumeration: invalid_credentials is returned for both
 * wrong-email and wrong-password (mirrors the backend's UserErrors).
 *
 * `email` se carga sólo cuando `kind === 'email_not_verified'`. Lo usa el
 * formulario para inyectar el email en el botón de resend (US-021) sin
 * necesidad de un controlled input. El backend no lo confirma como verdadero
 * (anti-enumeración), pero a esta altura el usuario ya escribió su email asi
 * que filtrarlo de vuelta a su propio cliente no agrega información.
 */
export type SignInFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind: 'invalid_credentials' | 'account_disabled' | 'unknown';
      message: string;
    }
  | {
      status: 'error';
      kind: 'email_not_verified';
      message: string;
      email: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };
