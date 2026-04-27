/**
 * RFC 7807 problem-details envelopes returned by the backend. Lives in lib/
 * because every feature that calls the backend will eventually parse one of
 * these on a non-2xx response, so duplicating the type per feature would be
 * pure noise.
 */

/**
 * RFC 7807 ProblemDetails envelope produced by the backend's `Results.Problem(...)`
 * helper. The `title` carries the domain error code (e.g.
 * `identity.account.email_not_verified`); `detail` is the human-readable
 * message. Status is on the HTTP response, not the body.
 */
export type ProblemDetails = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
};

/**
 * Shape produced by `Results.ValidationProblem(...)` when the backend's
 * FluentValidation middleware rejects a command. Field names are PascalCase
 * (matching the C# property names), values are arrays of error messages.
 */
export type ValidationProblemDetails = ProblemDetails & {
  errors: Record<string, string[]>;
};
