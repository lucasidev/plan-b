import 'server-only';

import { apiFetchAuthenticated } from '@/lib/api-client.server';
import type { AgnAuditRow } from './types';

/**
 * Estado de las auditorías AGN por institución (issue #506). GET /api/academic/agn-audits, gateado
 * a rol admin: se lee con el fetcher server-only que forwardea la cookie de sesión. Trae una fila
 * por institución del catálogo, consultada o no.
 */
export async function fetchAgnAuditsServer(): Promise<AgnAuditRow[]> {
  const res = await apiFetchAuthenticated('/api/academic/agn-audits', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`agn audits list failed with ${res.status}`);
  }
  const data = (await res.json()) as { items: AgnAuditRow[] };
  return data.items;
}
