import { MOCK_ENROLLMENT_CONTEXT, ReviewEditor } from '@/features/write-review';

export const metadata = {
  title: 'Escribir reseña · planb',
};

type Params = Promise<{ enrollmentId: string }>;

/**
 * /reviews/write/[enrollmentId] (US-049). Six-numbered-field review editor with a live
 * preview. The URL stays in English per the code/UI split rule (paths in English, UI in
 * Spanish).
 *
 * The [enrollmentId] route param identifies the EnrollmentRecord being reviewed. Today
 * it is ignored (the whole editor runs against `MOCK_ENROLLMENT_CONTEXT`) because the
 * `GET /api/me/pending-reviews/:enrollmentId` endpoint that returns subject + teacher +
 * commission + grade does not exist yet (US-048 backend + Review-model rework). Once it
 * lands, the page will prefetch and pass the real context to the editor.
 */
export default async function WriteReviewPage({ params }: { params: Params }) {
  // Resolve the id so Next.js does not warn; intentionally dropped until the real wiring
  // lands.
  await params;

  return <ReviewEditor ctx={MOCK_ENROLLMENT_CONTEXT} />;
}
