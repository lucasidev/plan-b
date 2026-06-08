/**
 * Minimal data the delete modal needs to render its preview. Comes from the Mías card
 * that triggers the modal: we already have these fields client-side, so the modal does
 * not need its own fetch.
 *
 * The "marcas útiles" and "respuestas del docente" counts the mockup shows are NOT
 * included: neither votes (future US) nor TeacherResponse (US-040) exist in the backend
 * yet. When they land, add the counts here + the corresponding lines in the modal copy.
 */
export type DeletableReview = {
  id: string;
  subjectCode: string;
  subjectName: string;
  difficultyRating: number;
  subjectText: string | null;
};

/**
 * Result of the delete server action. Mirrors the other review actions' result shape so
 * the modal can branch on status.
 */
export type DeleteReviewResult =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export const DELETE_REVIEW_INITIAL_STATE: DeleteReviewResult = { status: 'idle' };
