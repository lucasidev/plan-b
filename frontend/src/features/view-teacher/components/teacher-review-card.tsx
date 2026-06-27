import Link from 'next/link';
import { ReviewVoteButtons } from '@/components/reviews/review-vote-buttons';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { formatRelativeDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import type { TeacherReview } from '../types';
import { TeacherResponseForm } from './teacher-response-form';

/**
 * One published review on the teacher page (US-003). Same layout as the subject review card, plus a
 * subject label: a teacher's reviews span several courses, so each card says which subject it is
 * about (and links to that subject page). No author identity (ADR-0009); the implicit "verificado
 * que cursó" comes from being anchored to a finished enrollment.
 *
 * US-040: si ya hay respuesta del docente, se muestra (con su nombre, públicamente). Si el viewer es
 * el docente verificado de esta reseña y todavía no respondió (<paramref name="canRespond"/>), se le
 * ofrece el form de respuesta.
 */
export function TeacherReviewCard({
  review,
  canVote,
  canRespond,
}: {
  review: TeacherReview;
  canVote: boolean;
  canRespond: boolean;
}) {
  return (
    <li>
      <article className="flex flex-col gap-2.5 border-b border-line px-1 py-4 last:border-b-0">
        <div className="flex items-start justify-between gap-3">
          <span
            className="rounded-sm bg-st-approved-bg px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-st-approved-fg"
            title="La reseña la dejó alguien con la materia en su historial."
          >
            VERIFICADO QUE CURSÓ
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="font-mono text-[13px] font-semibold tabular-nums"
              style={{ color: 'var(--color-accent-ink)' }}
            >
              <span className="sr-only">{review.overallRating} de 5 estrellas</span>
              <span aria-hidden="true">★ {review.overallRating}.0</span>
            </span>
            <RecommendPill recommends={review.wouldRecommendCourse} />
          </div>
        </div>

        <Link
          href={`/subjects/${review.subjectId}`}
          className="font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
        >
          {review.subjectCode} · {review.subjectName}
        </Link>

        {review.subjectText && (
          <p className="text-[13.5px] leading-relaxed text-ink-2 m-0">{review.subjectText}</p>
        )}

        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-bg-elev px-2 py-[2px] text-[10.5px] text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
            <span>
              dificultad{' '}
              <b className="font-medium text-ink-2 tabular-nums">{review.difficultyRating}/5</b>
            </span>
            {review.hoursPerWeek !== null && (
              <span>
                · <b className="font-medium text-ink-2 tabular-nums">{review.hoursPerWeek}</b>{' '}
                hs/sem
              </span>
            )}
            <span>· {formatRelativeDate(review.createdAt)}</span>
          </div>
          <ReviewVoteButtons
            reviewId={review.id}
            helpfulCount={review.helpfulCount}
            notHelpfulCount={review.notHelpfulCount}
            myVoteIsHelpful={review.myVoteIsHelpful}
            canVote={canVote}
          />
        </div>

        {review.responseText ? (
          <div className="mt-1 rounded-md border-l-2 border-accent bg-bg-elev px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-ink">
                {review.responseAuthorName}
              </span>
              <VerifiedBadge kind="teacher" />
              {review.responseCreatedAt && (
                <span className="font-mono text-[10.5px] text-ink-3">
                  · {formatRelativeDate(review.responseCreatedAt)}
                </span>
              )}
            </div>
            <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-2">{review.responseText}</p>
          </div>
        ) : (
          canRespond && <TeacherResponseForm reviewId={review.id} />
        )}
      </article>
    </li>
  );
}

function RecommendPill({ recommends }: { recommends: boolean }) {
  return (
    <span
      className={cn(
        'rounded-pill px-2 py-[2px] text-[10.5px] font-medium',
        recommends ? 'bg-st-approved-bg text-st-approved-fg' : 'bg-st-failed-bg text-st-failed-fg',
      )}
    >
      {recommends ? 'recomienda' : 'no recomienda'}
    </span>
  );
}
