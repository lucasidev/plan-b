import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
import {
  type BrowseReviewsFilters,
  browseReviewsQueries,
  ExploreFeed,
  parseBrowseFilters,
} from '@/features/browse-reviews';
import { fetchBrowseReviewsServer } from '@/features/browse-reviews/api.server';
import { MyReviewsList, myReviewsQueries } from '@/features/my-reviews';
import { fetchMyReviewsServer } from '@/features/my-reviews/api.server';
import {
  PendingList,
  parseReviewsTab,
  pendingReviewsQueries,
  type ReviewsTabId,
  ReviewsTabsNav,
} from '@/features/pending-reviews';
import { fetchPendingReviewsServer } from '@/features/pending-reviews/api.server';

export const metadata = {
  title: 'Reseñas · planb',
};

// Per-user, depends on cookies. Dynamic to avoid prerendering with backend down.
export const dynamic = 'force-dynamic';

/**
 * /reviews (US-048). Shell with three tabs: Explorar (default), Pendientes, Mis reseñas.
 * All three are functional end-to-end against the backend.
 *
 * The page prefetches the active tab's query plus the Pendientes count (the nav badge
 * needs it regardless of the active tab). Tabs the student does not visit do not get
 * their data prefetched: we only hydrate what we render.
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; difficulty?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab = parseReviewsTab(params.tab);
  const browseFilters = parseBrowseFiltersFromSearchParams(params);

  // Always prefetch pending: the nav badge needs the count regardless of the active tab.
  const queryClient = new QueryClient();
  const pendingOptions = pendingReviewsQueries.list();
  await queryClient.prefetchQuery({
    queryKey: pendingOptions.queryKey,
    queryFn: fetchPendingReviewsServer,
  });

  // Prefetch the active tab's data when there's a backend slice for it.
  if (tab === 'mine') {
    const myOptions = myReviewsQueries.list();
    await queryClient.prefetchQuery({
      queryKey: myOptions.queryKey,
      queryFn: fetchMyReviewsServer,
    });
  } else if (tab === 'explore') {
    const browseOptions = browseReviewsQueries.list(browseFilters);
    await queryClient.prefetchQuery({
      queryKey: browseOptions.queryKey,
      queryFn: () => fetchBrowseReviewsServer(browseFilters),
    });
  }

  const pendingData = queryClient.getQueryData(pendingOptions.queryKey);
  const pendingCount = pendingData?.items.length ?? 0;

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <header className="mb-6">
        <Eyebrow>Reseñas</Eyebrow>
        <DisplayHeading size={36} className="mt-2 mb-2">
          Comunidad y aporte
        </DisplayHeading>
        <Lede>Leé lo que opinan otros y dejá tu reseña de las cursadas que cerraste.</Lede>
      </header>

      <ReviewsTabsNav active={tab} pendingCount={pendingCount} />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TabContent tab={tab} browseFilters={browseFilters} />
      </HydrationBoundary>
    </div>
  );
}

function TabContent({
  tab,
  browseFilters,
}: {
  tab: ReviewsTabId;
  browseFilters: BrowseReviewsFilters;
}) {
  if (tab === 'pending') {
    return (
      <Suspense fallback={<TabLoadingPlaceholder />}>
        <PendingList />
      </Suspense>
    );
  }
  if (tab === 'mine') {
    return (
      <Suspense fallback={<TabLoadingPlaceholder />}>
        <MyReviewsList />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<TabLoadingPlaceholder />}>
      <ExploreFeed filters={browseFilters} />
    </Suspense>
  );
}

/**
 * Converts the page's resolved `searchParams` object into the `BrowseReviewsFilters`
 * shape via a URLSearchParams trip. Keeps the parsing logic colocated with the feature.
 */
function parseBrowseFiltersFromSearchParams(params: {
  difficulty?: string;
  page?: string;
}): BrowseReviewsFilters {
  const search = new URLSearchParams();
  if (params.difficulty !== undefined) search.set('difficulty', params.difficulty);
  if (params.page !== undefined) search.set('page', params.page);
  return parseBrowseFilters(search);
}

function TabLoadingPlaceholder() {
  return (
    <div
      className="rounded-lg border border-line bg-bg-card text-ink-3"
      style={{ padding: 16, fontSize: 13 }}
      aria-busy="true"
    >
      Cargando…
    </div>
  );
}
