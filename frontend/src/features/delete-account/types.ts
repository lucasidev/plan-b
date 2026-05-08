/**
 * State of the delete-account server action (US-038-f).
 *
 * `idle` while the form hasn't been submitted yet. `error` when the backend
 * returned 4xx/5xx and we want to surface a user-readable message inside
 * the modal without closing it (so the user can retry without losing the
 * already-typed email).
 *
 * The happy path is a server-side `redirect()` that throws NEXT_REDIRECT,
 * so it never reaches `useActionState` — there is no `success` variant.
 */
export type DeleteAccountFormState = { status: 'idle' } | { status: 'error'; message: string };

export const initialDeleteAccountState: DeleteAccountFormState = { status: 'idle' };
