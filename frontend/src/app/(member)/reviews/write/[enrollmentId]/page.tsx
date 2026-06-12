import { notFound } from 'next/navigation';
import { fetchPendingReviewServer } from '@/features/pending-reviews/api.server';
import { type EnrollmentContext, ReviewEditor } from '@/features/write-review';

export const metadata = {
  title: 'Escribir reseña · planb',
};

// Per-user, cookie-bound, dynamic. Same reasoning as /reviews and the edit page.
export const dynamic = 'force-dynamic';

type Params = Promise<{ enrollmentId: string }>;

/**
 * /reviews/write/[enrollmentId] (US-049 editor).
 *
 * Resolves the route enrollment id against the student's pending listing
 * (`GET /api/reviews/me/pending`) and fills the editor context with the real subject,
 * period and grade. If the enrollment is not in the pending set (already reviewed, not
 * the student's, or not reviewable) the page returns 404 instead of leaking the
 * distinction.
 *
 * Teacher and commission are not resolved here: those aggregates do not exist yet
 * (US-063), so the listing cannot surface them. The context card degrades to "docente a
 * confirmar" rather than showing a fabricated name. The submit still anchors to the real
 * enrollment id via `POST /api/reviews` (US-017 / US-089).
 */
export default async function WriteReviewPage({ params }: { params: Params }) {
  const { enrollmentId } = await params;

  const pending = await fetchPendingReviewServer(enrollmentId);
  if (!pending) {
    notFound();
  }

  const ctx: EnrollmentContext = {
    id: pending.enrollmentId,
    matCode: pending.subjectCode,
    matName: pending.subjectName,
    prof: null,
    com: null,
    period: pending.termLabel,
    finalNote: pending.grade,
  };

  return <ReviewEditor ctx={ctx} enrollmentId={enrollmentId} />;
}
