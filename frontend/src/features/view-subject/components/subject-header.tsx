import type { SubjectDetail, SubjectInsights } from '../types';

/**
 * Subject detail header (US-002): eyebrow (code, year, term) + title + description + the stats
 * row (reseñas, dificultad, carga, recomiendan). Mirrors the top of the mockup `SubjectDetail`.
 *
 * The "Aprobación histórica" stat from the mockup is intentionally omitted: there is no
 * pass-rate read model yet (it would need enrollment outcomes aggregated, a separate concern).
 */
export function SubjectHeader({
  subject,
  insights,
}: {
  subject: SubjectDetail;
  insights: SubjectInsights;
}) {
  const reviewCount = insights.totalCount;
  return (
    <header className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">
          {subject.code} · Año {subject.yearInPlan} · {subject.termKind}
          {!subject.isOfficial && (
            <span className="ml-2 rounded-pill bg-bg-elev px-2 py-[2px] text-[10px] text-ink-4">
              plan no oficial
            </span>
          )}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
          {subject.name}
        </h1>
        {subject.description && (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            {subject.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat
          label="Reseñas"
          value={String(reviewCount)}
          sub={reviewCount === 1 ? 'publicada' : 'publicadas'}
        />
        <Stat
          label="Dificultad"
          value={
            insights.averageDifficulty !== null ? insights.averageDifficulty.toFixed(1) : 's/d'
          }
          suffix={insights.averageDifficulty !== null ? '/5' : undefined}
          sub="promedio"
        />
        <Stat
          label="Carga"
          value={String(subject.totalHours)}
          suffix="h"
          sub={`${subject.weeklyHours} hs/sem`}
        />
        <Stat
          label="Recomiendan"
          value={
            insights.recommendPercentage !== null ? insights.recommendPercentage.toFixed(0) : 's/d'
          }
          suffix={insights.recommendPercentage !== null ? '%' : undefined}
          sub="de la cursada"
        />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  suffix,
  sub,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-bg-card px-4 py-3.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-4">{label}</span>
      <span className="text-[22px] font-semibold leading-none text-ink tabular-nums">
        {value}
        {suffix && <span className="ml-0.5 text-[13px] font-normal text-ink-3">{suffix}</span>}
      </span>
      {sub && <span className="text-[11px] text-ink-3">{sub}</span>}
    </div>
  );
}
