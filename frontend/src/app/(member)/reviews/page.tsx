import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
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
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Reseñas · planb',
};

// Per-user, depends on cookies. Dynamic to avoid prerendering with backend down.
export const dynamic = 'force-dynamic';

/**
 * /reviews (US-048). Shell with three tabs: Explorar (default), Pendientes, Mis reseñas.
 *
 * As of US-048 PR-B both Pendientes and Mías are functional end-to-end against the
 * backend. Explorar still renders a "coming soon" placeholder while its endpoint + slice
 * lands in PR-C.
 *
 * The page prefetches the queries for the tabs that have backend support. Tabs the
 * student does not visit do not prefetch (we only hydrate what we render); the
 * Pendientes badge in the nav is the exception because it needs the count regardless of
 * the active tab.
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseReviewsTab(rawTab);

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
        <TabContent tab={tab} />
      </HydrationBoundary>
    </div>
  );
}

function TabContent({ tab }: { tab: ReviewsTabId }) {
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
  return <ComingSoonCard title="Explorar la comunidad" us="próximo slice (PR-C)" />;
}

function ComingSoonCard({ title, us }: { title: string; us: string }) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-line rounded-lg shadow-card',
        'p-10 text-center flex flex-col items-center gap-3',
      )}
    >
      <p
        className="text-ink-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Próximamente
      </p>
      <h2 className="font-display font-semibold text-lg text-ink m-0">{title}</h2>
      <p className="text-sm text-ink-3 max-w-md">
        Esta vista aterriza en el {us} de US-048. La tab está lista en el shell para que la URL sea
        estable.
      </p>
    </div>
  );
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
