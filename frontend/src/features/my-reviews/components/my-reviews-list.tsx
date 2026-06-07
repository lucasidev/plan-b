'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { myReviewsQueries } from '../api';
import type { MyReview, ReviewStatus } from '../types';
import { MyReviewsHeader } from './my-reviews-header';

/**
 * Tab Mías listing for US-048. Reads the suspense query hydrated by the page's RSC
 * prefetch and renders one card per review preceded by the stats header.
 *
 * Empty state: per AC (`v2-empty.jsx::V2MisResenasVacio`), a central card with eyebrow
 * + heading + body explaining anonymity + a primary CTA that nudges the alumno to the
 * Pendientes tab.
 */
export function MyReviewsList() {
  const { data } = useSuspenseQuery(myReviewsQueries.list());

  if (data.items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <MyReviewsHeader stats={data.stats} />
      <ul className="flex flex-col gap-3" aria-label="Tus reseñas publicadas">
        {data.items.map((item) => (
          <MyReviewCard key={item.id} review={item} />
        ))}
      </ul>
    </div>
  );
}

function MyReviewCard({ review }: { review: MyReview }) {
  const dateLabel = formatRelativeDate(review.createdAt);
  return (
    <li>
      <article
        className={cn(
          'flex flex-col gap-2 p-4 rounded-lg',
          'bg-bg-card border border-line shadow-card',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">
              {review.subjectCode}
            </span>
            <span className="text-[15px] font-medium leading-snug text-ink truncate">
              {review.subjectName}
            </span>
          </div>
          <StatusChip status={review.status} />
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
          <span
            className={cn('text-[12px] text-ink-3', 'inline-flex items-center gap-1')}
            title="Editar y borrar llegan en próximas USs (US-018 + US-055)"
          >
            Editar y borrar próximamente
          </span>
        </div>
      </article>
    </li>
  );
}

function StatusChip({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, { label: string; tone: string }> = {
    Published: { label: 'publicada', tone: 'bg-st-approved-bg text-st-approved-fg' },
    UnderReview: { label: 'en revisión', tone: 'bg-st-coursing-bg text-st-coursing-fg' },
    Removed: { label: 'removida', tone: 'bg-line text-ink-3' },
  };
  const { label, tone } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-[2px] rounded-pill',
        'font-mono text-[10.5px] font-medium tracking-wide flex-shrink-0',
        tone,
      )}
    >
      {label}
    </span>
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
      <p
        className="text-ink-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Mis reseñas
      </p>
      <h2 className="font-display font-semibold text-lg text-ink m-0">
        Todavía no escribiste ninguna.
      </h2>
      <p className="text-sm text-ink-3 max-w-md">
        Tus reseñas son anónimas y se publican con el "verificado que cursó" porque tenés la materia
        en tu historial.
      </p>
      <div className="flex flex-col items-center gap-1.5 mt-2">
        <Link
          href="/reviews?tab=pending"
          className={cn(
            'inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-accent text-white hover:bg-accent-hover transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          Empezá por una pendiente →
        </Link>
        <Link
          href="/help"
          className="text-[12px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
        >
          Cómo funcionan las reseñas
        </Link>
      </div>
    </div>
  );
}

/**
 * Date formatter that returns short relative copy ("hoy", "ayer", "hace 3 días", "hace 2
 * meses"). Server gives ISO 8601; we compare against the user's current time on the client.
 */
function formatRelativeDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(days / 365);
  if (years === 1) return 'hace 1 año';
  return `hace ${years} años`;
}
