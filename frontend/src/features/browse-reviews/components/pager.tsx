import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BrowseReviewsFilters } from '../types';

type Props = {
  page: number;
  pageSize: number;
  totalCount: number;
  filters: BrowseReviewsFilters;
};

/**
 * Simple prev/next pager. Pure links so it works without JS and keeps the URL the
 * source of truth. Hides itself when there's only one page.
 *
 * URL composition rules: difficulty stays if present, only page changes. We never
 * render links to invalid pages (page 0, or beyond totalPages).
 */
export function Pager({ page, pageSize, totalCount, filters }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    params.set('tab', 'explore');
    if (filters.difficulty !== null) params.set('difficulty', String(filters.difficulty));
    if (target > 1) params.set('page', String(target));
    return `/reviews?${params.toString()}`;
  };

  return (
    <nav aria-label="Paginación del feed" className="flex items-center justify-between gap-3 pt-2">
      <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
        ← Anterior
      </PageLink>
      <span className="font-mono text-[12px] text-ink-3">
        Página {page} de {totalPages}
      </span>
      <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
        Siguiente →
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        className="px-3 py-1.5 rounded text-[13px] text-ink-4 cursor-not-allowed select-none"
        aria-disabled
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-1.5 rounded text-[13px] font-medium transition-colors',
        'bg-bg-card border border-line text-ink-2 hover:border-accent hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}
