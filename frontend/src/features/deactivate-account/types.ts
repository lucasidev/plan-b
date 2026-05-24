/**
 * State del server action de deactivate-account (ADR-0044, US-038-bis frontend).
 *
 * `idle` mientras el form no se submiteó. `error` cuando el backend devolvió 4xx/5xx y
 * queremos surface un mensaje user-readable en el modal sin cerrarlo (para que el user pueda
 * reintentar sin perder el email ya tipeado).
 *
 * El happy path es un server-side `redirect()` que tira NEXT_REDIRECT, así que nunca llega
 * a `useActionState`: no hay variant `success`.
 */
export type DeactivateAccountFormState = { status: 'idle' } | { status: 'error'; message: string };

export const initialDeactivateAccountState: DeactivateAccountFormState = { status: 'idle' };
