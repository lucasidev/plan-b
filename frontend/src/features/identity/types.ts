/**
 * Response shapes mirrored from the backend Identity endpoints. Names match
 * the camelCase JSON the backend serializes (System.Text.Json defaults under
 * `JsonSerializerDefaults.Web`, no custom naming policy configured).
 */

export type RegisterUserResponse = {
  id: string;
  email: string;
};

export type SignInUserPayload = {
  userId: string;
  email: string;
  role: 'member' | 'moderator' | 'admin' | 'university_staff';
};

export type VerifyEmailResponse = {
  userId: string;
  verifiedAt: string; // ISO timestamp
};

/**
 * RFC 7807 ProblemDetails envelope produced by the backend's `Results.Problem(...)`
 * helper. The `title` carries the domain error code (e.g. `user.email_not_verified`),
 * the `detail` is a human-readable message. Status is on the HTTP response, not the body.
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
