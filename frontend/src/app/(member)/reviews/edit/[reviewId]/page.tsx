import { notFound } from 'next/navigation';
import { editReviewAction, fetchEditableReviewServer } from '@/features/edit-review';
import { MOCK_ENROLLMENT_CONTEXT, ReviewEditor } from '@/features/write-review';

export const metadata = {
  title: 'Editar reseña · planb',
};

// Per-user, cookie-bound, dynamic. Same reasoning as /reviews.
export const dynamic = 'force-dynamic';

type Params = Promise<{ reviewId: string }>;

/**
 * /reviews/edit/[reviewId] (US-018 editor). Loads the persisted review through the
 * student's own listing and seeds the editor with its values.
 *
 * If the review does not belong to the current user (or does not exist), the page
 * returns 404 instead of leaking the distinction to the caller. Reviews not in
 * <c>Published</c> status are not editable per ADR-0012; the backend returns 409 if
 * the user tries to PATCH them. We do NOT block the page render in that case: the
 * student gets to see the editor pre-loaded and the error surface comes through the
 * action's response, with the matching UX message.
 *
 * The display context (subject code, teacher, period, grade) still comes from
 * <c>MOCK_ENROLLMENT_CONTEXT</c> for the same reason as <c>/reviews/write</c>: there is
 * no detail endpoint yet that resolves the enrollment into its display strings. The
 * submit is correct (the real reviewId rides the form); only the header may show the
 * canned ISW301/Brandt context until the detail endpoint lands.
 */
export default async function EditReviewPage({ params }: { params: Params }) {
  const { reviewId } = await params;

  const review = await fetchEditableReviewServer(reviewId);
  if (review === null) {
    notFound();
  }

  return (
    <ReviewEditor
      ctx={MOCK_ENROLLMENT_CONTEXT}
      enrollmentId={review.id}
      mode="edit"
      idFieldName="reviewId"
      submitAction={editReviewAction}
      initialDraft={{
        difficulty: review.difficultyRating,
        text: review.subjectText ?? undefined,
      }}
    />
  );
}
