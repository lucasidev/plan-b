import { queryOptions } from '@tanstack/react-query';
import { clientApiFetch } from '@/lib/api-client';
import type { BrowseReviewsFilters, BrowseReviewsResponse } from './types';

const PAGE_SIZE = 20;

function buildSearchParams(filters: BrowseReviewsFilters): string {
  const params = new URLSearchParams();
  if (filters.difficulty !== null) params.set('difficulty', String(filters.difficulty));
  params.set('page', String(filters.page));
  params.set('pageSize', String(PAGE_SIZE));
  return params.toString();
}

async function fetchBrowseReviews(filters: BrowseReviewsFilters): Promise<BrowseReviewsResponse> {
  const qs = buildSearchParams(filters);
  const response = await clientApiFetch(`/api/reviews?${qs}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Browse reviews fetch failed: ${response.status}`);
  }
  return (await response.json()) as BrowseReviewsResponse;
}

export const browseReviewsQueries = {
  list: (filters: BrowseReviewsFilters) =>
    queryOptions({
      queryKey: ['browse-reviews', 'list', filters] as const,
      queryFn: () => fetchBrowseReviews(filters),
    }),
};

export const BROWSE_PAGE_SIZE = PAGE_SIZE;
