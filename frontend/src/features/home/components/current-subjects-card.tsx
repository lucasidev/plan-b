import { Card } from '@/components/ui/card';
import type { ActiveSubject } from '../data/active-subjects';
import { ModPill } from './mod-pill';
import { ProgressBar } from './progress-bar';

type Props = {
  subjects: ActiveSubject[];
};

/**
 * "En curso" block of the v2 Home. Literal port of lines 96-158 of the
 * `v2-screens.jsx::V2Inicio` mock. Each row uses a 1fr/auto/100px grid: main info on
 * the left (code + mod + com + name + prof + next), partial grade in the middle,
 * progress through the term on the right.
 *
 * Progress-bar tone flips to "warm" when only a few weeks are left
 * (`week/weeks > 0.8`), heuristic taken directly from the mock.
 *
 * Empty state keeps the grid stable (the block is not hidden) to avoid layout shifts
 * when a student starts the period without enrollments.
 */
export function CurrentSubjectsCard({ subjects }: Props) {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display font-semibold text-base text-ink m-0">
          En curso <small className="text-ink-3 font-normal ml-1">{subjects.length} materias</small>
        </h2>
        <button
          type="button"
          disabled
          title="Próximamente"
          className="px-2 py-1 text-[11.5px] font-medium text-ink-3 cursor-not-allowed"
        >
          Ver todas →
        </button>
      </div>

      {subjects.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic py-4">
          Cuando empieces a cursar, vas a ver tus materias acá.
        </p>
      ) : (
        <div className="flex flex-col">
          {subjects.map((s, i) => (
            <div
              key={s.code}
              className={`grid grid-cols-[1fr_auto_100px] gap-[14px] items-center py-3 ${
                i ? 'border-t border-line' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10.5px] text-ink-3 tracking-wide">{s.code}</span>
                  <ModPill mod={s.mod} />
                  <span className="font-mono text-[10px] text-ink-3">com {s.com}</span>
                </div>
                <div className="text-sm text-ink font-medium leading-tight">{s.name}</div>
                <div className="text-[11.5px] text-ink-3 mt-1">
                  {s.prof} · {s.next}
                </div>
              </div>

              <div className="text-right">
                {s.note !== null ? (
                  <div>
                    <div className="font-mono text-[18px] font-semibold text-ink leading-none tracking-tight tabular-nums">
                      {s.note}
                    </div>
                    <div className="text-[10px] text-ink-3 mt-[2px]">nota parcial</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-ink-4 italic">sin notas</div>
                )}
              </div>

              <div>
                <div className="flex justify-between font-mono text-[10px] text-ink-3 tracking-wide mb-[3px]">
                  <span>
                    sem {s.week}/{s.weeks}
                  </span>
                  <span>{s.attendance !== null ? `${Math.round(s.attendance * 100)}%` : '-'}</span>
                </div>
                <ProgressBar
                  value={s.week}
                  max={s.weeks}
                  tone={s.weeks > 0 && s.week / s.weeks > 0.8 ? 'warm' : 'neutral'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
