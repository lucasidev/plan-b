import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  active: number | null;
};

const STEPS = [
  { value: 1, label: 'muy fácil' },
  { value: 2, label: 'fácil' },
  { value: 3, label: 'justa' },
  { value: 4, label: 'exigente' },
  { value: 5, label: 'muy exigente' },
] as const;

/**
 * URL-driven difficulty filter (1..5). Server component: each entry is a `<Link>` that
 * sets / clears the `difficulty` query param. Resetting `page` is intentional: changing
 * the filter takes you to page 1 of the new result set, not the same page index on a
 * different filter (which would often be empty).
 *
 * Why not nuqs: the filter state lives 100% in the URL and is read by the page's RSC.
 * A client-side hook (nuqs) would force the panel into a client component and add the
 * useSearchParams + Suspense boundary cost. A plain `<Link href="?...">` keeps it
 * server-side and zero-JS.
 */
export function DifficultyFilter({ active }: Props) {
  return (
    <section
      aria-labelledby="filter-difficulty"
      className="bg-bg-card border border-line rounded-lg p-4 flex flex-col gap-2"
    >
      <h3
        id="filter-difficulty"
        className="text-ink-2"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Dificultad
      </h3>
      <ul className="flex flex-col gap-1 m-0 p-0 list-none">
        <li>
          <FilterLink href="/reviews?tab=explore" isActive={active === null}>
            Todas
          </FilterLink>
        </li>
        {STEPS.map((step) => (
          <li key={step.value}>
            <FilterLink
              href={`/reviews?tab=explore&difficulty=${step.value}`}
              isActive={active === step.value}
            >
              {step.value} · {step.label}
            </FilterLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FilterLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={isActive}
      className={cn(
        'block px-2.5 py-1.5 rounded text-[13px] transition-colors',
        isActive ? 'bg-accent-soft text-accent-ink font-medium' : 'text-ink-2 hover:bg-bg-elev',
      )}
    >
      {children}
    </Link>
  );
}
