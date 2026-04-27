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
 */
export type SignInFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind: 'invalid_credentials' | 'email_not_verified' | 'account_disabled' | 'unknown';
      message: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };
