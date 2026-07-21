/**
 * Server fetcher response for the review under edit. The page resolves the route
 * <c>reviewId</c> against the GET /api/reviews/me listing (US-048) and finds the
 * row that matches: this avoids a dedicated GET /api/me/reviews/{id} endpoint for now.
 *
 * Why we reuse the list and not a single-resource endpoint: the listing already returns
 * everything the editor needs (texts, grade, difficulty, status) and the list is short
 * (a few rows per student). Adding a per-id endpoint would be premature: YAGNI.
 */
export type EditableReview = {
  id: string;
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  status: 'Published' | 'UnderReview' | 'Removed';
  difficultyRating: number;
  subjectText: string | null;
  finalGrade: number | null;
};
