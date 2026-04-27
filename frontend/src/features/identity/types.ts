/**
 * Response shapes mirrored from the backend Identity endpoints. Names match
 * the camelCase JSON the backend serializes (System.Text.Json defaults under
 * `JsonSerializerDefaults.Web`, no custom naming policy configured).
 *
 * Also: state shapes for the server actions in `./actions`. They live here
 * (not next to the action) because actions.ts is `'use server'` per
 * frontend/CLAUDE.md and can only export async functions.
 */

// ── Backend response DTOs ────────────────────────────────────────

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

// ── Action state shapes ──────────────────────────────────────────

export type SignUpFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      message: string;
      field?: 'email' | 'password' | 'confirm';
    };

export const initialSignUpState: SignUpFormState = { status: 'idle' };

export type SignInFormState =
  | { status: 'idle' }
  | {
      status: 'error';
      kind: 'invalid_credentials' | 'email_not_verified' | 'account_disabled' | 'unknown';
      message: string;
    };

export const initialSignInState: SignInFormState = { status: 'idle' };
