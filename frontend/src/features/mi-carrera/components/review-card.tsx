import type { ReviewMock } from '@/features/mi-carrera/data/reviews';
import { teacherById } from '@/features/mi-carrera/data/teachers';
import { cn } from '@/lib/utils';

type Props = {
  review: ReviewMock;
  /** Si es la última de la lista, omite el border-bottom. */
  isLast: boolean;
};

/**
 * Card de una reseña individual para mostrar en drawers (US-045-d). Port
 * del `V2ResenaCard` del mock canvas. Muestra: autor anónimo + score
 * estrellas + body + chip de dificultad + "útil" counter.
 */
export function ReviewCard({ review, isLast }: Props) {
  const teacher = teacherById(review.teacherId);
  const teacherDisplay = teacher ? teacher.name.split(',')[0] : review.teacherId;

  return (
    <div className={cn('py-3.5', isLast ? '' : 'border-b border-line')}>
      <div className="flex justify-between items-start gap-2.5 mb-1.5">
        <div className="text-[11.5px] text-ink-3">
          {review.who} · con {teacherDisplay}
        </div>
        <Stars score={review.score} />
      </div>
      <p className="text-[13px] text-ink leading-relaxed m-0 mb-2">{review.text}</p>
      <div className="flex gap-2 items-center flex-wrap">
        <span
          className={cn(
            'font-mono text-[10.5px] px-2 py-0.5 rounded-full',
            'bg-bg-elev text-ink-2',
          )}
        >
          dificultad {review.difficulty}/5
        </span>
        <span className="text-[11px] text-ink-3">·</span>
        <button
          type="button"
          className="text-[11px] text-ink-3 hover:text-accent-ink"
          aria-label="Marcar útil"
        >
          ↑ útil ({review.useful})
        </button>
      </div>
    </div>
  );
}

function Stars({ score }: { score: number }) {
  const filled = '★'.repeat(score);
  const empty = '★'.repeat(5 - score);
  return (
    <span
      role="img"
      aria-label={`${score} de 5 estrellas`}
      className="text-[12px] tracking-wider shrink-0"
    >
      <span aria-hidden className="text-accent-ink">
        {filled}
      </span>
      <span aria-hidden className="text-line">
        {empty}
      </span>
    </span>
  );
}
