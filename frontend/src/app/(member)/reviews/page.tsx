import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Lede } from '@/components/ui/lede';
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
 * PR-A scope: only Pendientes is functional end-to-end. Explorar and Mías render a
 * "coming soon" placeholder while their respective backend endpoints + frontend slices
 * land in PR-B / PR-C. The shell + nav already accept the three tabs so navigating
 * `?tab=mine` from inside the empty state of Pendientes (per AC) does not 404.
 *
 * The Pendientes count fed into the nav badge is resolved server-side from the same
 * query the tab consumes, so first paint is accurate without a client roundtrip.
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab = parseReviewsTab(rawTab);

  // Prefetch pending into the RSC's QueryClient so <PendingList> can `useSuspenseQuery`
  // without a client-side roundtrip. We override queryFn to the server-only fetcher
  // (the client fetcher hits `/api/...` directly, which has no cookie-forwarding in RSC).
  // The same queryKey is reused so the client cache deduplicates on hydration.
  const queryClient = new QueryClient();
  const options = pendingReviewsQueries.list();
  await queryClient.prefetchQuery({
    queryKey: options.queryKey,
    queryFn: fetchPendingReviewsServer,
  });
  const pendingData = queryClient.getQueryData(options.queryKey);
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
  if (tab === 'explore') {
    return <ComingSoonCard title="Explorar la comunidad" us="próximo slice (PR-B)" />;
  }
  return <ComingSoonCard title="Tus reseñas publicadas" us="próximo slice (PR-C)" />;
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
