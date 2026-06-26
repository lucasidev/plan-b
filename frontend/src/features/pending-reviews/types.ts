/**
 * Response shape of `GET /api/reviews/me/pending` (US-048 backend slice). Mirrors the
 * backend's `GetMyPendingReviewsResponse` + `PendingReviewItem` records.
 *
 * `termLabel` is null for older enrollments without a linked academic term. Only reviewable
 * enrollments surface (non-null commission), so `commissionId` is always present: the write-review
 * page uses it to fetch the commission's teachers and let the student pick who to review.
 */
export type PendingReview = {
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  commissionId: string;
  status: string;
  grade: number | null;
  termLabel: string | null;
};

export type PendingReviewsResponse = {
  items: PendingReview[];
};
