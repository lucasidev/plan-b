'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { pendingReviewsQueries } from '../api';
import type { PendingReview } from '../types';

/**
 * Tab "Pendientes" listing for US-048. Reads the suspense query hydrated by the page's
 * RSC prefetch and renders one card per pending review. Empty state per the US-048 AC:
 * central card with a check icon + "Estás al día." heading + a ghost link to the Mías
 * tab.
 */
export function PendingList() {
  const { data } = useSuspenseQuery(pendingReviewsQueries.list());

  if (data.items.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Cursadas pendientes de reseñar">
      {data.items.map((item) => (
        <PendingCard key={item.enrollmentId} item={item} />
      ))}
    </ul>
  );
}

function PendingCard({ item }: { item: PendingReview }) {
  return (
    <li>
      <article
        className={cn(
          'flex items-center justify-between gap-4 p-4 rounded-lg',
          'bg-bg-card border border-line shadow-card',
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">
              {item.subjectCode}
            </span>
            {item.termLabel && (
              <span className="font-mono text-[10.5px] text-ink-3">· {item.termLabel}</span>
            )}
            <span className="font-mono text-[10.5px] text-ink-3">
              · {item.status.toLowerCase()}
            </span>
          </div>
          <div className="text-[15px] font-medium leading-snug text-ink mb-0.5 truncate">
            {item.subjectName}
          </div>
          <div className="text-[12px] text-ink-3">
            {item.grade !== null ? `Nota ${item.grade}` : 'Sin nota'}
          </div>
        </div>
        <Link
          href={`/reviews/write/${item.enrollmentId}`}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-accent text-white hover:bg-accent-hover transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          Escribir reseña →
        </Link>
      </article>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        'bg-bg-card border border-line rounded-lg shadow-card',
        'p-10 text-center flex flex-col items-center gap-4',
      )}
    >
      <div
        aria-hidden
        className={cn(
          'inline-flex items-center justify-center bg-accent-soft text-accent-ink',
          'rounded-full',
        )}
        style={{ width: 56, height: 56 }}
      >
        <Check size={24} />
      </div>
      <h2 className="font-display font-semibold text-lg text-ink">Estás al día.</h2>
      <p className="text-sm text-ink-3 max-w-md">
        Cuando cierres una materia te avisamos para que la reseñes.
      </p>
      <Link
        href="/reviews?tab=mine"
        className={cn(
          'inline-flex items-center text-sm text-accent-ink hover:text-accent-hover',
          'underline-offset-2 hover:underline focus:outline-none focus-visible:underline',
        )}
      >
        Ver mis reseñas →
      </Link>
    </div>
  );
}
