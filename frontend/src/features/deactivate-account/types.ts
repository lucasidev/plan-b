/**
 * Server-action state for deactivate-account (ADR-0044, US-038-bis frontend).
 *
 * `idle` while the form has not been submitted. `error` when the backend returned 4xx/5xx
 * and we want to surface a user-readable message in the modal without closing it (so the
 * user can retry without losing the email they already typed).
 *
 * En el camino feliz el action devuelve `success` con el destino y navega el componente
 * (ADR-0046). Los tres caminos que dan de baja de verdad (204, 404 con el user ya borrado, y 409
 * ya dado de baja) llevan al mismo lugar, porque desde el punto de vista del alumno los tres
 * significan lo mismo: su cuenta ya no está.
 */
export type DeactivateAccountFormState =
  | { status: 'idle' }
  | { status: 'success'; redirectTo: string }
  | { status: 'error'; message: string };

export const initialDeactivateAccountState: DeactivateAccountFormState = { status: 'idle' };
