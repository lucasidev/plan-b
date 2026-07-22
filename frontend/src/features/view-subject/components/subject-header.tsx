import { formatTermKind } from '@/lib/academic-terms';
import { NO_DATA_YET } from '@/lib/copy';
import type { SubjectDetail, SubjectInsights, SubjectPassRate } from '../types';

/**
 * Subject detail header (US-002): eyebrow (code, year, term) + title + description + the stats
 * row (reseñas, dificultad, carga, recomiendan, aprobación histórica). Mirrors the top of the
 * mockup `SubjectDetail`.
 *
 * "Aprobación histórica" (ADR-0047) agrega el historial de enrollments. El backend aplica el gate
 * de muestra mínima: con pocos datos `passRate` viene null y se muestra "pocos datos" en vez del
 * número. El disclaimer es obligatorio: el dato es self-reported y direccional, no autoritativo.
 */
export function SubjectHeader({
  subject,
  insights,
  passRate,
}: {
  subject: SubjectDetail;
  insights: SubjectInsights;
  passRate: SubjectPassRate;
}) {
  const reviewCount = insights.totalCount;
  return (
    <header className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">
          {subject.code} · Año {subject.yearInPlan} · {formatTermKind(subject.termKind)}
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

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
          <Stat
            label="Reseñas"
            value={String(reviewCount)}
            sub={reviewCount === 1 ? 'publicada' : 'publicadas'}
          />
          <Stat
            label="Dificultad"
            value={
              insights.averageDifficulty !== null
                ? insights.averageDifficulty.toFixed(1)
                : NO_DATA_YET
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
              insights.recommendPercentage !== null
                ? insights.recommendPercentage.toFixed(0)
                : NO_DATA_YET
            }
            suffix={insights.recommendPercentage !== null ? '%' : undefined}
            sub="de la cursada"
          />
          <Stat
            label="Aprobación"
            value={
              passRate.passRate !== null ? Math.round(passRate.passRate).toString() : NO_DATA_YET
            }
            suffix={passRate.passRate !== null ? '%' : undefined}
            sub={passRate.passRate !== null ? 'histórica' : 'pocos datos'}
          />
        </div>
        {passRate.passRate !== null && (
          <p className="text-[10.5px] leading-snug text-ink-4">
            Aprobación histórica orientativa, calculada sobre {passRate.sampleSize} cursadas
            cargadas por alumnos.
          </p>
        )}
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
