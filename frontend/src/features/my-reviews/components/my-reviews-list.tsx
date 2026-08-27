'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { DeleteReviewModal } from '@/features/delete-review';
import { formatRelativeDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { myReviewsQueries } from '../api';
import type { MyReview, ReviewStatus, UnderReviewReason } from '../types';
import { MyReviewsHeader } from './my-reviews-header';

/**
 * Por qué una reseña `UnderReview` está frenada, y qué puede hacer el autor al respecto.
 * `ContentFilter` y `EnrollmentChanged` se resuelven editando (ver `canEditReview`); `Reports`
 * espera a un moderador. Ver la revisión 2026-07-29 de ADR-0063.
 */
const UNDER_REVIEW_REASON_COPY: Record<UnderReviewReason, string> = {
  ContentFilter:
    'El filtro de contenido la retuvo antes de publicarla. Editá el texto y se revisa de nuevo: si queda limpio, sale publicada.',
  EnrollmentChanged:
    'La cursada que respalda esta reseña cambió, así que podría estar hablando de algo que ya no es cierto. Editala para ponerla al día: eso la manda a revisar de nuevo.',
  Reports: 'La reportaron y un moderador la va a resolver. No podés editarla hasta que eso pase.',
};

/**
 * Regla de edición (ADR-0063, revisión 2026-07-29): además de `Published`, se puede editar
 * desde `UnderReview` cuando el filtro automático o un cambio de cursada la frenaron, porque
 * en esos dos casos editar es la única salida de la cuarentena. Sigue bloqueada cuando la
 * frenó un report (el moderador tiene que resolverlo primero) o cuando ya está `Removed`.
 */
function canEditReview(review: MyReview): boolean {
  if (review.status === 'Published') return true;
  return (
    review.status === 'UnderReview' &&
    (review.underReviewReason === 'ContentFilter' ||
      review.underReviewReason === 'EnrollmentChanged')
  );
}

/** Tooltip del estado "No editable": por qué ESTA reseña puntual no se puede editar. */
function editDisabledReason(review: MyReview): string {
  if (review.status === 'Removed') {
    return 'La removió un moderador: no se puede editar.';
  }
  if (review.status === 'UnderReview' && review.underReviewReason === 'Reports') {
    return UNDER_REVIEW_REASON_COPY.Reports;
  }
  return 'No se puede editar en este momento.';
}

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

        {review.status === 'UnderReview' && review.underReviewReason && (
          <p
            className={cn(
              'm-0 rounded border px-3 py-2 text-[12px] leading-relaxed',
              'border-st-coursing-fg/30 bg-st-coursing-bg text-st-coursing-fg',
            )}
          >
            {UNDER_REVIEW_REASON_COPY[review.underReviewReason]}
          </p>
        )}

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

        <div className="flex items-center justify-end gap-3">
          {canEditReview(review) ? (
            <Link
              href={`/reviews/edit/${review.id}`}
              className={cn(
                'text-[12px] font-medium underline-offset-2 hover:underline',
                'text-accent-ink',
              )}
            >
              Editar
            </Link>
          ) : (
            <span className="text-[12px] text-ink-4" title={editDisabledReason(review)}>
              No editable
            </span>
          )}
          {review.status !== 'Removed' && (
            <DeleteReviewModal
              review={{
                id: review.id,
                subjectCode: review.subjectCode,
                subjectName: review.subjectName,
                difficultyRating: review.difficultyRating,
                subjectText: review.subjectText,
              }}
            />
          )}
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
