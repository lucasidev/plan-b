/**
 * Server-action state for deactivate-account (ADR-0044, US-038-bis frontend).
 *
 * `idle` while the form has not been submitted. `error` when the backend returned 4xx/5xx
 * and we want to surface a user-readable message in the modal without closing it (so the
 * user can retry without losing the email they already typed).
 *
 * The happy path is a server-side `redirect()` that throws NEXT_REDIRECT, so it never
 * reaches `useActionState`: there is no `success` variant.
 */
export type DeactivateAccountFormState = { status: 'idle' } | { status: 'error'; message: string };

export const initialDeactivateAccountState: DeactivateAccountFormState = { status: 'idle' };
