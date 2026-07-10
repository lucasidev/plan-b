import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { ReportDetail, ReportQueueData, ReportQueueFilters } from './types';

/**
 * Cola de reportes (US-050). GET /api/moderation/reports/queue, gateado a moderador/admin. Los filtros
 * (status abiertos/cerrados + tono) viajan como query params; el read model devuelve counts + items +
 * paginación en una sola roundtrip. `no-store`: la cola cambia con cada decisión, no se cachea.
 */
export async function fetchReportQueueServer(
  filters: ReportQueueFilters,
): Promise<ReportQueueData> {
  const params = new URLSearchParams({ status: filters.status });
  if (filters.tone) {
    params.set('tone', filters.tone);
  }
  const res = await apiFetchAuthenticated(`/api/moderation/reports/queue?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`report queue failed with ${res.status}`);
  }
  return (await res.json()) as ReportQueueData;
}

/**
 * Detalle de un report (US-051). GET /api/moderation/reports/{id}. Devuelve null en 404 para que la
 * página renderee notFound() en vez de tirar.
 */
export async function fetchReportDetailServer(id: string): Promise<ReportDetail | null> {
  const res = await apiFetchAuthenticated(`/api/moderation/reports/${id}`, { cache: 'no-store' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`report detail failed with ${res.status}`);
  }
  return (await res.json()) as ReportDetail;
}
