/**
 * Response shape of `GET /api/reviews/me/pending` (US-048 backend slice). Mirrors the
 * backend's `GetMyPendingReviewsResponse` + `PendingReviewItem` records.
 *
 * `termLabel` is null for older enrollments without a linked academic term. `teacherName`
 * and `commissionLabel` are intentionally absent: the Teacher and Commission aggregates
 * do not exist yet in Academic. They will be added when those aggregates land.
 */
export type PendingReview = {
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  status: string;
  grade: number | null;
  termLabel: string | null;
};

export type PendingReviewsResponse = {
  items: PendingReview[];
};
