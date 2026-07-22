import { notFound } from 'next/navigation';
import { fetchPendingReviewServer } from '@/features/pending-reviews/api.server';
import { type EnrollmentContext, ReviewEditor } from '@/features/write-review';
import { fetchCommissionTeachersServer } from '@/features/write-review/api.server';
import { formatAcademicPeriod } from '@/lib/academic-terms';

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
 * The pending item carries the enrollment's `commissionId` (only reviewable enrollments surface),
 * so the page fetches that commission's teachers and hands them to the editor: the student picks the
 * real docente they had, which the publish action sends as `docenteResenadoId` (US-065 docente real
 * por reseña). The backend validates that the picked teacher belongs to the commission.
 */
export default async function WriteReviewPage({ params }: { params: Params }) {
  const { enrollmentId } = await params;

  const pending = await fetchPendingReviewServer(enrollmentId);
  if (!pending) {
    notFound();
  }

  const teachers = await fetchCommissionTeachersServer(pending.commissionId);

  const ctx: EnrollmentContext = {
    id: pending.enrollmentId,
    matCode: pending.subjectCode,
    matName: pending.subjectName,
    prof: null,
    com: null,
    period: formatAcademicPeriod(pending.termYear, pending.termKind, pending.termNumber),
    finalNote: pending.grade,
  };

  return <ReviewEditor ctx={ctx} enrollmentId={enrollmentId} teachers={teachers} />;
}
