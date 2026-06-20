/**
 * Overall-rating distribution (US-002, "Distribución" card in the mockup `SubjectDetail`).
 * Five bars, index 0 = rating 1 ... index 4 = rating 5. Heights are relative to the busiest
 * bucket so the shape reads even with low counts.
 */
export function RatingHistogram({ histogram }: { histogram: number[] }) {
  const max = Math.max(1, ...histogram);
  return (
    <div>
      <div className="flex h-24 items-end gap-1.5" aria-hidden="true">
        {histogram.map((count, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-bucket histogram, index is the rating
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="font-mono text-[10px] text-ink-3 tabular-nums">{count}</span>
            <div
              className="w-full rounded-sm"
              style={{
                height: `${(count / max) * 100}%`,
                minHeight: count > 0 ? 4 : 0,
                background: 'var(--color-accent)',
              }}
            />
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
