import type { SubjectInsights } from '../types';
import { RatingHistogram } from './rating-histogram';

/**
 * Crowd insights panel (US-002): the "Distribución" histogram next to the meters card
 * (Dificultad, Carga real, Recomendarían), mirroring the mockup `SubjectDetail`. Only rendered
 * when the subject has at least one published review (the caller checks `totalCount`).
 */
export function InsightsPanel({ insights }: { insights: SubjectInsights }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-bg-card p-4">
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-4">
          Distribución de calificaciones
        </p>
        <RatingHistogram histogram={insights.ratingHistogram} />
      </div>

      <div className="flex flex-col justify-center gap-3.5 rounded-lg border border-line bg-bg-card p-4">
        <Meter
          label="Dificultad"
          value={insights.averageDifficulty ?? 0}
          max={5}
          display={`${(insights.averageDifficulty ?? 0).toFixed(1)}/5`}
        />
        <Meter
          label="Carga real"
          value={insights.averageHoursPerWeek ?? 0}
          max={20}
          display={
            insights.averageHoursPerWeek === null
              ? 'sin dato'
              : `${insights.averageHoursPerWeek.toFixed(0)} hs/sem`
          }
        />
        <Meter
          label="Recomendarían"
          value={insights.recommendPercentage ?? 0}
          max={100}
          display={`${(insights.recommendPercentage ?? 0).toFixed(0)}%`}
        />
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono tabular-nums text-ink-3">{display}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bg-elev">
        <div
          className="h-full rounded-pill"
          style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
        />
      </div>
    </div>
  );
}
