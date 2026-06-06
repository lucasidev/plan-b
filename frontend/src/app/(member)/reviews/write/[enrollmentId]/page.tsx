import { MOCK_ENROLLMENT_CONTEXT, ReviewEditor } from '@/features/write-review';

export const metadata = {
  title: 'Escribir reseña · planb',
};

type Params = Promise<{ enrollmentId: string }>;

/**
 * /reviews/write/[enrollmentId] (US-049 editor + US-048 e2e wiring).
 *
 * The `[enrollmentId]` route param is now the real id of the EnrollmentRecord being
 * reviewed. The editor's submit action sends it to `POST /api/reviews` (US-017). The
 * display context (subject, teacher, period, grade) still comes from
 * `MOCK_ENROLLMENT_CONTEXT` because the detail endpoint (`GET /api/reviews/me/pending/:id`
 * or similar) does not exist yet; landing it is scope for a future US.
 *
 * Practical consequence: the editor's HEADER may show the canned ISW301/Brandt context
 * while the SUBMIT publishes a row for the cursada the user actually came from. The
 * publish itself is correct (real enrollmentId, real student, real backend constraint);
 * only the display does not match yet.
 */
export default async function WriteReviewPage({ params }: { params: Params }) {
  const { enrollmentId } = await params;

  return <ReviewEditor ctx={MOCK_ENROLLMENT_CONTEXT} enrollmentId={enrollmentId} />;
}
