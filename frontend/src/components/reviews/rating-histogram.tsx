/**
 * Overall-rating distribution histogram. Five bars, index 0 = rating 1 ... index 4 = rating 5.
 * Heights are relative to the busiest bucket so the shape reads even with low counts. Shared by the
 * subject page (US-002) and the teacher page (US-003): both render the same 5-bucket distribution.
 *
 * Cada barra escala su altura como porcentaje del bucket más alto. Ese porcentaje se resuelve contra
 * el <c>track</c> (el div `flex-1` con altura definida por el flex column): sin un padre de altura
 * explícita, un `height: X%` colapsa a `auto` y todas las barras quedarían planas al `minHeight`.
 */
export function RatingHistogram({ histogram }: { histogram: number[] }) {
  const max = Math.max(1, ...histogram);
  return (
    <div>
      <div className="flex h-24 items-stretch gap-1.5" aria-hidden="true">
        {histogram.map((count, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-bucket histogram, index is the rating
            key={i}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="shrink-0 font-mono text-[10px] text-ink-3 tabular-nums">{count}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(count / max) * 100}%`,
                  minHeight: count > 0 ? 4 : 0,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="flex-1 text-center font-mono text-[10px] text-ink-4">
            {n}★
          </span>
        ))}
      </div>
    </div>
  );
}
