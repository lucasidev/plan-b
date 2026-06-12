'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { ReportReviewModal } from '@/features/report-review';
import { formatRelativeDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { browseReviewsQueries } from '../api';
import type { BrowseReview, BrowseReviewsFilters } from '../types';
import { DifficultyFilter } from './difficulty-filter';
import { Pager } from './pager';

type Props = {
  filters: BrowseReviewsFilters;
};

/**
 * Public feed for US-048 tab Explorar. Renders the filter sidebar + card list +
 * pagination. Reads via suspense query hydrated by the page's RSC prefetch.
 *
 * Layout is desktop-first 1:3 (filters / feed). On narrow viewports the filters stack
 * above the feed, which keeps them discoverable instead of hidden behind a drawer.
 */
export function ExploreFeed({ filters }: Props) {
  const { data } = useSuspenseQuery(browseReviewsQueries.list(filters));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <DifficultyFilter active={filters.difficulty} />
      </aside>
      <div className="flex flex-col gap-3">
        <FeedHeader totalCount={data.totalCount} filters={filters} />
        {data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Reseñas de la comunidad">
            {data.items.map((item) => (
              <BrowseCard key={item.id} review={item} />
            ))}
          </ul>
        )}
        <Pager
          page={filters.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          filters={filters}
        />
      </div>
    </div>
  );
}

function FeedHeader({
  totalCount,
  filters,
}: {
  totalCount: number;
  filters: BrowseReviewsFilters;
}) {
  const label = totalCount === 1 ? '1 reseña publicada' : `${totalCount} reseñas publicadas`;
  return (
    <div className="flex items-center justify-between text-[12px] text-ink-3">
      <span>{label}</span>
      {filters.difficulty !== null && (
        <span className="font-mono">filtro · dificultad {filters.difficulty}</span>
      )}
    </div>
  );
}

function BrowseCard({ review }: { review: BrowseReview }) {
  const dateLabel = formatRelativeDate(review.createdAt);
  return (
    <li>
      <article
        className={cn(
          'flex flex-col gap-2 p-4 rounded-lg',
          'bg-bg-card border border-line shadow-card',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">
            {review.subjectCode}
          </span>
          <span className="text-[15px] font-medium leading-snug text-ink truncate">
            {review.subjectName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-ink-3">
          <span>Dificultad {review.difficultyRating}/5</span>
          {review.finalGrade !== null && <span>· Nota {review.finalGrade}</span>}
          <span>· {dateLabel}</span>
        </div>

        {review.subjectText && (
          <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-3 m-0">
            {review.subjectText}
          </p>
        )}

        <div className="flex justify-end">
          <ReportReviewModal review={{ id: review.id }} />
        </div>
      </article>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        'bg-bg-card border border-line rounded-lg shadow-card',
        'p-10 text-center flex flex-col items-center gap-3',
      )}
    >
      <h2 className="font-display font-semibold text-lg text-ink m-0">Sin reseñas que mostrar.</h2>
      <p className="text-sm text-ink-3 max-w-md">
        Probá relajar los filtros o volvé en un rato: el corpus crece con cada cursada que el
        alumnado cierra.
      </p>
    </div>
  );
}
