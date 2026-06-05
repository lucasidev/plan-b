import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MY_CAREER_TABS, type MyCareerTabId } from '../lib/tabs';

type Props = {
  active: MyCareerTabId;
};

/**
 * Horizontal nav for the 5 tabs of the `/my-career` shell. Each tab is a `<Link>` with
 * `?tab={id}` so browser back/forward navigates between tabs (URL-shareable).
 *
 * Server component because Next's `Link`s handle the "active tab" highlight via the
 * `active` prop (computed server-side from `searchParams`). The tab change is
 * client-side; Next intercepts the Links.
 */
export function TabsNav({ active }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Vistas de mi carrera"
      className="flex gap-1 border-b border-line mb-6"
    >
      {MY_CAREER_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/my-career?tab=${tab.id}`}
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
              isActive ? 'text-ink border-ink' : 'text-ink-3 border-transparent hover:text-ink-2',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
