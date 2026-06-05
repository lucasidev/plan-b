import { queryOptions } from '@tanstack/react-query';
import type { HistorialImportResponse } from './types';

/**
 * Fetcher for polling GET /api/me/transcript-imports/{id}. The planb_session cookie
 * travels by default from the browser.
 */
async function fetchHistorialImport(importId: string): Promise<HistorialImportResponse> {
  const response = await fetch(`/api/me/transcript-imports/${encodeURIComponent(importId)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Historial import fetch failed: ${response.status}`);
  }
  return (await response.json()) as HistorialImportResponse;
}

export const historialImportQueries = {
  byId: (importId: string | null) =>
    queryOptions({
      queryKey: ['historial-import', importId ?? 'none'],
      queryFn: () =>
        importId ? fetchHistorialImport(importId) : Promise.reject(new Error('No importId')),
      enabled: !!importId,
      // Poll every 2s while the aggregate is still in a non-terminal state. The
      // consuming component disables it once it reaches Parsed/Failed/Confirmed.
      refetchInterval: (q) => {
        const data = q.state.data as HistorialImportResponse | undefined;
        if (!data) return 2000;
        if (data.status === 'Pending' || data.status === 'Parsing') return 2000;
        return false;
      },
    }),
};
