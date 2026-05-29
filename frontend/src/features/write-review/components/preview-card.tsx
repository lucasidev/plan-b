'use client';

import type { ReviewAnonymousIdentity } from '../types';

/**
 * Preview vivo del editor (US-049, columna derecha). Espejo del aside del mockup.
 *
 * Muestra cómo va a verse la reseña en el feed (US-048) con la identidad anónima del
 * autor (ADR-0009: año + carrera + período, sin nombre / email / legajo). El componente
 * es la fuente única visual del card de feed; cuando US-048 aterrice, esta misma pieza
 * se reusa con un prop extra para acciones (editar / borrar).
 *
 * Inputs reactivos: rating, text, tags. Se actualiza on-change sin debounce (render
 * normal de React). difficulty y hoursPerWeek no entran al preview porque el card del
 * feed no los muestra (decisión del canvas).
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
        {/* header avatar + identidad anónima + estrellas */}
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

        {/* texto del review (placeholder si vacío) */}
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
