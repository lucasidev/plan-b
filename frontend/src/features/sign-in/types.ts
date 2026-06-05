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
 * `email` is set only when `kind === 'email_not_verified'`. The form uses it to inject
 * the email into the resend button (US-021) without requiring a controlled input. The
 * backend does not confirm whether it is a real account (anti-enumeration), but by this
 * point the user already typed their email, so echoing it back to their own client adds
 * no extra information.
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
