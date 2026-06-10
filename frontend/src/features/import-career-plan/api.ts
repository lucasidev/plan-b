import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { CareerPlanImportResponse } from './types';

async function fetchCareerPlanImport(importId: string): Promise<CareerPlanImportResponse> {
  const response = await clientApiFetch(
    `/api/me/career-plan-imports/${encodeURIComponent(importId)}`,
    { cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`CareerPlanImport fetch failed: ${response.status}`);
  }
  return (await response.json()) as CareerPlanImportResponse;
}

export const careerPlanImportQueries = {
  byId: (importId: string | null) =>
    queryOptions({
      queryKey: ['career-plan-import', importId ?? 'none'],
      queryFn: () =>
        importId ? fetchCareerPlanImport(importId) : Promise.reject(new Error('No importId')),
      enabled: !!importId,
      refetchInterval: (q) => {
        const data = q.state.data as CareerPlanImportResponse | undefined;
        if (!data) return 2000;
        if (data.status === 'Pending' || data.status === 'Parsing') return 2000;
        return false;
      },
    }),
};
