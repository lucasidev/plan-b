import { Card } from '@/components/ui/card';
import type { ActiveSubject } from '../data/active-subjects';
import { ModPill } from './mod-pill';
import { ProgressBar } from './progress-bar';

type Props = {
  subjects: ActiveSubject[];
};

/**
 * Bloque "En curso" del Inicio v2. Port literal de las líneas 96-158 del
 * mock `v2-screens.jsx::V2Inicio`. Cada fila tiene grid 1fr/auto/100px:
 * info principal a la izquierda (code + mod + com + name + prof + next),
 * nota parcial al centro, progreso de cursado a la derecha.
 *
 * Tone de la progress bar pasa a "warm" cuando faltan pocas semanas
 * (`week/weeks > 0.8`), heurística directa del mock.
 *
 * Empty state mantiene la grilla estable (no se oculta el bloque) para no
 * sumar saltos de layout cuando un alumno arranca el período sin
 * inscripciones.
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
