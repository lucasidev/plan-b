import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { AuthorContextCard, DecisionPanel, ReviewCard } from '@/features/moderate-reports';
import { fetchReportDetailServer } from '@/features/moderate-reports/api.server';
import { reasonLabel, reviewStatusLabel } from '@/features/moderate-reports/reasons';
import { timeSince } from '@/features/moderate-reports/time';

export const dynamic = 'force-dynamic';

/**
 * Detalle de un report + panel de decisión (US-051). RSC: fetchea el detalle server-side (gateado a
 * moderador/admin), 404 → notFound(). Layout dos columnas (reseña reportada + decisión) con el contexto
 * del autor full width abajo. La interactividad (radios, modal, POST) vive en `DecisionPanel`.
 */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const detail = await fetchReportDetailServer(reportId);
  if (!detail) {
    notFound();
  }

  const removed = detail.reviewStatus === 'Removed' || detail.reviewStatus === 'Deleted';
  const others = detail.otherOpenReports.length;
  const subtitle = `Reseña ${detail.reviewId.slice(0, 8)} · ${reviewStatusLabel(detail.reviewStatus)}${
    others > 0
      ? ` · ${others} ${others === 1 ? 'reporte más' : 'reportes más'} sobre esta reseña`
      : ''
  }`;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow={`Reporte · ${detail.reportId.slice(0, 8)} · ${timeSince(detail.reportCreatedAt)}`}
        title={reasonLabel(detail.reason)}
        subtitle={subtitle}
      />
      <div className="grid gap-3.5" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <ReviewCard detail={detail} />
        <DecisionPanel reportId={detail.reportId} cascadeCount={others} canUphold={!removed} />
      </div>
      <AuthorContextCard detail={detail} />
    </div>
  );
}
