/**
 * Types for the reset-password feature. Per the AC of US-033, every backend
 * failure mode renders distinct copy: the user came from a real email, so
 * leaking "this token expired" doesn't leak anything an attacker who already
 * has the link doesn't already know.
 */

/**
 * Discriminated form state. `kind` tells the form which copy to render:
 * - validation: client-side schema rejection (pre-roundtrip).
 * - token_invalid / token_expired / token_consumed / wrong_purpose:
 *     ProblemDetails received from the backend; the form pivots to a CTA
 *     that points back to /forgot-password.
 * - account_disabled / email_not_verified: token was valid but the account
 *     can't be reset; no CTA to forgot-password (it wouldn't help).
 * - password_too_weak: token was valid; the new password failed policy.
 * - unknown: 5xx, network, parse failure.
 *
 * `field` lets the form attach validation messages to the matching input
 * when `kind === 'validation'` or `kind === 'password_too_weak'`.
 */
export type ResetPasswordFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind:
        | 'validation'
        | 'token_invalid'
        | 'token_expired'
        | 'token_consumed'
        | 'wrong_purpose'
        | 'account_disabled'
        | 'email_not_verified'
        | 'password_too_weak'
        | 'unknown';
      message: string;
      field?: 'password' | 'confirm';
    };

export const initialResetPasswordState: ResetPasswordFormState = { status: 'idle' };
