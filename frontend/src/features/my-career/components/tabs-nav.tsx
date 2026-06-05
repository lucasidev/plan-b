import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MY_CAREER_TABS, type MyCareerTabId } from '../lib/tabs';

type Props = {
  active: MyCareerTabId;
};

/**
 * Nav horizontal de los 5 tabs del shell `/my-career`. Cada tab es un
 * `<Link>` con `?tab={id}` para que el browser back/forward navegue entre
 * tabs (compartible por URL).
 *
 * Server component porque los `Link` de Next manejan el highlight de
 * "tab activo" via prop `active` (computado server-side desde `searchParams`).
 * El cambio entre tabs es client-side; Next intercepta los Link.
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
