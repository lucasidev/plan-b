/**
 * Estado del action de cambio de contraseña. El modal renderiza distinto según el `kind`:
 * - <c>wrong_current</c>: highlightea el campo "Contraseña actual".
 * - <c>too_weak</c>: highlightea el campo "Nueva contraseña" (longitud).
 * - <c>same_as_current</c>: highlightea "Nueva contraseña" con copy distinto.
 * - <c>validation</c>: errores del Zod schema (mismatch, vacíos, demasiado larga).
 * - <c>unknown</c>: red caída o 500.
 *
 * Success no es un estado terminal del modal: cuando el backend devuelve 204, el action
 * dispara <c>signOutEverywhere()</c> que cierra la sesión local (la revocación de refresh
 * tokens server-side fuerza el re-login) y redirige a <c>/sign-in?password-changed=1</c>.
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
