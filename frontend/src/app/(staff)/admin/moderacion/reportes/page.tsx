import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { FilterChips, ReportsTable } from '@/features/moderate-reports';
import { fetchReportQueueServer } from '@/features/moderate-reports/api.server';
import type { ReportQueueFilters, ReportTone } from '@/features/moderate-reports/types';

export const dynamic = 'force-dynamic';

const TONES: ReportTone[] = ['urgent', 'normal', 'low'];

function parseFilters(sp: { status?: string; tone?: string }): ReportQueueFilters {
  const status = sp.status === 'closed' ? 'closed' : 'open';
  const tone = sp.tone && TONES.includes(sp.tone as ReportTone) ? (sp.tone as ReportTone) : null;
  return { status, tone };
}

/**
 * Cola de reportes del backoffice (US-050). RSC: lee los filtros de la URL, fetchea server-side
 * (gateado a moderador/admin) y renderea chips + tabla. Los filtros son navegación (query params), no
 * estado cliente: cada chip es un Link y la RSC re-fetchea.
 */
export default async function ReportsQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tone?: string }>;
}) {
  const filters = parseFilters(await searchParams);
  const data = await fetchReportQueueServer(filters);
  const { counts } = data;

  const subtitle =
    filters.status === 'closed'
      ? `${counts.closedLast7d} cerrados en los últimos 7 días.`
      : `${counts.openCount} abiertos · ${counts.staleCount} con +48h sin tocar. Orden: urgencia primero, después antigüedad.`;

  const emptyLabel =
    filters.status === 'open' && !filters.tone && counts.openCount === 0
      ? 'Sin reportes abiertos. Andá a tomar mate.'
      : 'No hay reportes con este filtro.';

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader eyebrow="Moderación" title="Cola de reportes" subtitle={subtitle} />
      <FilterChips counts={counts} active={filters} />
      <ReportsTable items={data.items} emptyLabel={emptyLabel} />
    </div>
  );
}
