import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SubjectReviewsPage } from '../types';
import { ReviewCard } from './review-card';

/**
 * Reviews list for the subject page (US-002): section heading + the page of cards + a
 * link-based pager (server-driven pagination via `?page=N`, SEO-friendly for a public page).
 * Empty state per the US-002 AC copy.
 */
export function ReviewsSection({ reviews }: { reviews: SubjectReviewsPage }) {
  if (reviews.totalCount === 0) {
    return (
      <section className="rounded-lg border border-line bg-bg-card p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink m-0">
          Esta materia todavía no tiene reseñas.
        </p>
        <p className="mt-2 text-sm text-ink-3">Sé el primero cuando termines de cursarla.</p>
      </section>
    );
  }

  const pageCount = Math.max(1, Math.ceil(reviews.totalCount / reviews.pageSize));

  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-4">
        {reviews.totalCount === 1 ? '1 reseña' : `${reviews.totalCount} reseñas`}
      </h2>
      <ul className="flex flex-col" aria-label="Reseñas de la materia">
        {reviews.items.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>
      {pageCount > 1 && <Pager page={reviews.page} pageCount={pageCount} />}
    </section>
  );
}

function Pager({ page, pageCount }: { page: number; pageCount: number }) {
  const hasPrev = page > 1;
  const hasNext = page < pageCount;
  return (
    <nav className="mt-3 flex items-center justify-between text-[12px]" aria-label="Paginación">
      <PagerLink href={`?page=${page - 1}`} enabled={hasPrev}>
        ← Anteriores
      </PagerLink>
      <span className="font-mono tabular-nums text-ink-3">
        Página {page} de {pageCount}
      </span>
      <PagerLink href={`?page=${page + 1}`} enabled={hasNext}>
        Siguientes →
      </PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  enabled,
  children,
}: {
  href: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return <span className="text-ink-4 cursor-not-allowed select-none">{children}</span>;
  }
  return (
    <Link
      href={href}
      className={cn('text-accent-ink underline-offset-2 hover:underline')}
      scroll={true}
    >
      {children}
    </Link>
  );
}
