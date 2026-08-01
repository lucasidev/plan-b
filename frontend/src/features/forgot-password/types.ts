/**
 * Types for the forgot-password feature. State + initial value live here
 * because actions.ts is `'use server'` and Next.js only allows async exports
 * from such files.
 */

/**
 * `kind` discriminates the only two states the user-facing UI cares about:
 * `validation` (email is malformed, render in-field) and `rate_limit` (429,
 * render in-form with a "wait a few minutes" hint, no redirect). Every
 * other backend response (204, 5xx) leads to a redirect to /forgot-password/check-inbox
 * so the form never has to render success state.
 */
export type ForgotPasswordFormState =
  | { status: 'idle' }
  // El destino lo decide el action, que es donde vive esa lógica; navega el componente
  // (ADR-0046). Ver `lib/navigate-after-mutation.ts` por qué no alcanza `router.push`.
  | { status: 'success'; redirectTo: string }
  | {
      status: 'error';
      kind: 'validation' | 'rate_limit' | 'unknown';
      message: string;
      /** When `kind === 'validation'`, the field that failed. Used by the form to
       *  attach the error to the matching <TextField error="..." />. */
      field?: 'email';
    };

export const initialForgotPasswordState: ForgotPasswordFormState = { status: 'idle' };
