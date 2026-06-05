/**
 * Types for the resend-verification feature (US-021). State lives here because
 * actions.ts is `'use server'` and Next.js only allows async exports from those files.
 *
 * The `sent` status discriminates the happy case: the button component shows a "Listo,
 * revisá tu casilla" message without redirecting. `rate_limit` shows the explicit
 * cooldown ("esperá unos minutos"). `validation` renders near the input. `unknown` is
 * the fallback for 5xx or other unexpected errors.
 */
export type ResendVerificationFormState =
  | { status: 'idle' }
  | { status: 'sent' }
  | {
      status: 'error';
      kind: 'validation' | 'rate_limit' | 'unknown';
      message: string;
    };

export const initialResendVerificationState: ResendVerificationFormState = { status: 'idle' };
