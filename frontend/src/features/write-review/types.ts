/**
 * Editor types (US-049). Aligned with the post-claude-design UX rework
 * (ADR-0041): one review per enrollment with six numbered fields.
 *
 * When the backend rework lands (the upcoming US that replaces the legacy US-017
 * model), these types attach to the real DTOs. For now they are pure mocks with a
 * stable shape.
 */

import type { ReviewFormInput } from './schema';

/**
 * Context for the enrollment under review. Rendered in the editor header and the
 * side preview. The student lands here from a chosen pending enrollment (US-048
 * Pending tab); once that flow lands, the URL id is resolved against the API.
 * For now it is mocked (`MOCK_ENROLLMENT_CONTEXT`).
 */
export type EnrollmentContext = {
  /** Enrollment id (EnrollmentRecord.id) in the backend. Mocked for now. */
  id: string;
  /** Subject short code (e.g. ISW301). */
  matCode: string;
  /** Subject full name. */
  matName: string;
  /** Teacher display name (last name + first name). */
  prof: string;
  /** Commission. */
  com: string;
  /** Human-readable academic period (e.g. "2025·2c"). */
  period: string;
  /** Final grade the student loaded in their transcript. */
  finalNote: number;
};

/**
 * Pseudonymous identity rendered in the preview, aligned with the presentation
 * rule from ADR-0009 (anonymity): year in career + career name + period. Never
 * expose name, email, or student id number.
 */
export type ReviewAnonymousIdentity = {
  year: number;
  career: string;
  period: string;
};

/**
 * Publish action result. Mocked for now: the server action returns a synthetic
 * id and the frontend redirects. When the real backend lands, this shape will
 * align with the `POST /api/reviews` response body.
 */
export type PublishReviewResult =
  | { status: 'success'; reviewId: string }
  | { status: 'error'; message: string }
  | { status: 'idle' };

export const PUBLISH_REVIEW_INITIAL_STATE: PublishReviewResult = { status: 'idle' };

/** Re-export so callers do not have to import from two files. */
export type ReviewDraft = ReviewFormInput;
