/**
 * Change-password action state. The modal renders differently per `kind`:
 * - `wrong_current`: highlights the "Contraseña actual" field.
 * - `too_weak`: highlights the "Nueva contraseña" field (length).
 * - `same_as_current`: highlights "Nueva contraseña" with a distinct copy.
 * - `validation`: Zod schema errors (mismatch, empty, too long).
 * - `unknown`: network down or 500.
 *
 * Success is not a terminal state of the modal: when the backend returns 204, the action
 * clears the local session (server-side refresh-token revocation forces re-login) and
 * redirects to `/sign-in?password-changed=1`.
 */
export type ChangePasswordFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind:
        | 'wrong_current'
        | 'too_weak'
        | 'same_as_current'
        | 'too_long'
        | 'validation'
        | 'unknown';
      message: string;
    };

export const initialChangePasswordState: ChangePasswordFormState = { status: 'idle' };
