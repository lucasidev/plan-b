'use client';

import type { ReviewAnonymousIdentity } from '../types';

/**
 * Live editor preview (US-049, right column). Mirrors the aside in the mockup.
 *
 * Shows how the review will appear in the feed (US-048) using the author's anonymous
 * identity (ADR-0009: year + career + period, no name / email / student id). This
 * component is the single visual source for the feed card; when US-048 lands, the same
 * piece is reused with an extra prop for actions (edit / delete).
 *
 * Reactive inputs: rating, text, tags. Updates on-change with no debounce (normal React
 * render). difficulty and hoursPerWeek are not in the preview because the feed card does
 * not show them (canvas decision).
 */
export function PreviewCard({
  rating,
  text,
  tags,
  identity,
}: {
  rating: number;
  text: string;
  tags: string[];
  identity: ReviewAnonymousIdentity;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: 'oklch(0.85 0.07 55)',
        background:
          'linear-gradient(180deg, var(--color-accent-soft) 0%, var(--color-bg-card) 60%)',
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="rounded-sm font-mono text-[9.5px] tracking-[0.04em] px-1.5 py-0.5"
          style={{
            background: 'var(--color-st-approved-bg)',
            color: 'var(--color-st-approved-fg)',
          }}
        >
          VERIFICADO QUE CURSÓ
        </span>
      </div>

      <h2 className="mb-1.5 text-base font-semibold text-ink">Así se va a ver</h2>

      <div className="rounded border border-line bg-bg-card px-3.5 py-3">
        {/* header: avatar + anonymous identity + stars */}
        <div className="mb-2 flex items-center gap-2.5">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-bg-elev text-[12px] text-ink-3">
            ?
          </div>
          <div className="min-w-0 flex-1 text-[11px] text-ink-3">
            Anónimo · {identity.year}° · {identity.career} · cursó {identity.period}
          </div>
          <output
            className="font-mono text-[11px] tracking-wider"
            style={{ color: 'var(--color-accent-ink)' }}
          >
            <span className="sr-only">{rating} de 5 estrellas</span>
            <span aria-hidden="true">{'★'.repeat(Math.max(0, rating))}</span>
            <span aria-hidden="true" style={{ color: 'var(--color-line)' }}>
              {'★'.repeat(Math.max(0, 5 - rating))}
            </span>
          </output>
        </div>

        {/* review body (placeholder when empty) */}
        <p className="mb-2 min-h-[2rem] text-[12px] leading-snug text-ink">
          {text.trim().length > 0 ? (
            text
          ) : (
            <span className="italic text-ink-3">Tu texto aparecerá acá…</span>
          )}
        </p>

        {/* tags: 4 + "+N" */}
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-pill bg-bg-elev px-1.5 py-px text-[9.5px] text-ink-2">
              {t}
            </span>
          ))}
          {tags.length > 4 && <span className="text-[9.5px] text-ink-3">+{tags.length - 4}</span>}
        </div>
      </div>
    </div>
  );
}
