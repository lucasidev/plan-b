import Link from 'next/link';
import { cn } from '@/lib/utils';
import { REVIEWS_TABS, type ReviewsTabId } from '../tabs';

type Props = {
  active: ReviewsTabId;
  pendingCount?: number;
};

/**
 * Horizontal nav for the 3 tabs of the `/reviews` shell (US-048). Each tab is a `<Link>`
 * with `?tab={id}` so browser back/forward navigates between tabs (URL-shareable).
 *
 * The Pendientes tab carries an optional count badge when there is at least one item. The
 * count is resolved on the server (via the same query used by the page) so first paint is
 * accurate without a client roundtrip.
 *
 * Server component: no interactivity beyond <Link> navigation.
 */
export function ReviewsTabsNav({ active, pendingCount }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Vistas de reseñas"
      className="flex gap-1 border-b border-line mb-6"
    >
      {REVIEWS_TABS.map((tab) => {
        const isActive = tab.id === active;
        const showBadge = tab.id === 'pending' && pendingCount !== undefined && pendingCount > 0;
        return (
          <Link
            key={tab.id}
            href={`/reviews?tab=${tab.id}`}
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
              isActive ? 'text-ink border-ink' : 'text-ink-3 border-transparent hover:text-ink-2',
            )}
          >
            {tab.label}
            {showBadge && (
              <>
                <span className="sr-only">{`${pendingCount} pendientes`}</span>
                <span
                  aria-hidden
                  className={cn(
                    'font-mono text-[10.5px] rounded-full px-1.5 py-0.5',
                    isActive ? 'bg-accent text-white' : 'bg-line text-ink-3',
                  )}
                >
                  {pendingCount}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
