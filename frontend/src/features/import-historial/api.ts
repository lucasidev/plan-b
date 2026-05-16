import { queryOptions } from '@tanstack/react-query';
import type { HistorialImportResponse } from './types';

/**
 * Fetcher para el polling del GET /api/me/historial-imports/{id}. La cookie
 * planb_session viaja por default desde el browser.
 */
async function fetchHistorialImport(importId: string): Promise<HistorialImportResponse> {
  const response = await fetch(`/api/me/historial-imports/${encodeURIComponent(importId)}`, {
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
      // Polling cada 2s mientras el aggregate sigue en estado no terminal.
      // El componente que consume el query lo desactiva una vez en Parsed/Failed/Confirmed.
      refetchInterval: (q) => {
        const data = q.state.data as HistorialImportResponse | undefined;
        if (!data) return 2000;
        if (data.status === 'Pending' || data.status === 'Parsing') return 2000;
        return false;
      },
    }),
};
