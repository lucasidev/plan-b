/**
 * Types for the verify-email feature. This is a read-only flow (no form,
 * no submit) — the page consumes the token from the URL and the result is
 * a discriminated union the result component renders.
 */

export type VerifyEmailResponse = {
  userId: string;
  verifiedAt: string; // ISO timestamp
};

/**
 * Discriminated union mapping the backend's response/error codes to UX states.
 * Each variant gets dedicated copy in the VerifyEmailResult component so the
 * user knows exactly what to do next:
 *
 * - success: 200 with VerifyEmailResponse.
 * - missing_token: no `?token=` on the URL (someone landed here directly).
 * - invalid: 404 identity.verification.invalid — token doesn't exist.
 * - expired: 409 identity.verification.expired — past TTL.
 * - already_consumed: 409 identity.verification.already_consumed — used once.
 * - invalidated: 409 identity.verification.invalidated — superseded by a newer token.
 * - unknown: anything else (5xx, network, parse error).
 *
 * Named `Outcome` rather than `Result` so the type doesn't collide with the
 * `VerifyEmailResult` component that consumes it.
 */
export type VerifyEmailOutcome =
  | { kind: 'success'; verifiedAt: string }
  | { kind: 'missing_token' }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'already_consumed' }
  | { kind: 'invalidated' }
  | { kind: 'unknown'; detail?: string };
