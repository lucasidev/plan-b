/**
 * Enrollment status snapshot (mirrors the backend's `EnrollmentStatus` enum). Only terminal
 * (non-`InProgress`) statuses ever reach this listing (the query filters `status <> 'InProgress'`),
 * but the type keeps all five so it stays honest about what the wire could carry.
 */
export type EnrollmentStatus = 'InProgress' | 'Regularized' | 'Passed' | 'Failed' | 'Dropped';

/**
 * Response shape of `GET /api/reviews/me/pending` (US-048 backend slice). Mirrors the
 * backend's `GetMyPendingReviewsResponse` + `PendingReviewItem` records.
 *
 * El período viaja crudo (`termYear`/`termNumber`/`termKind`, valores de `academic_terms.kind`):
 * armar el label de presentación ("2025 · 2do cuatrimestre") es responsabilidad de
 * `formatAcademicPeriod` (`lib/academic-terms.ts`), no de esta capa. Los tres campos son null en
 * conjunto para cursadas sin período académico vinculado. Only reviewable enrollments surface
 * (non-null commission), so `commissionId` is always present: the write-review page uses it to
 * fetch the commission's teachers and let the student pick who to review.
 */
export type PendingReview = {
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  commissionId: string;
  status: EnrollmentStatus;
  grade: number | null;
  termYear: number | null;
  termNumber: number | null;
  termKind: string | null;
};

export type PendingReviewsResponse = {
  items: PendingReview[];
};
