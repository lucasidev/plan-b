import type { PeriodSnapshot } from '../data/period';
import { ProgressBar } from './progress-bar';

type Props = {
  period: PeriodSnapshot;
};

/**
 * Card de período académico. Port literal de la sección "PROGRESO DEL AÑO"
 * del mock `v2-screens.jsx::V2Inicio` (líneas 58-90).
 *
 * Layout: grid 3 columnas (`auto 1fr auto`). Izquierda muestra eyebrow del año
 * + heading mono `sem N/M`. Centro la barra warm con 3 labels equiespaciadas
 * (mes inicio, marker del 2° cuatri, mes fin). Derecha el botón "Editar
 * período" (no funcional en MVP — TODO cuando aterrice flow de cambio de
 * período manual).
 *
 * Como la barra es solo visual sin labels arriba, no podemos reusar `Meter`
 * (que fuerza label-above) y va el componente `ProgressBar` slim de este
 * feature.
 */
export function PeriodProgressCard({ period }: Props) {
  return (
    <div className="bg-bg-card border border-line rounded-[14px] px-5 py-4 mb-[18px] grid grid-cols-[auto_1fr_auto] gap-[18px] items-center">
      <div>
        <div className="font-mono text-[10.5px] text-ink-3 tracking-[0.08em] uppercase mb-1">
          Período {period.year}
        </div>
        <div className="font-mono text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink">
          sem {period.weekOfYear}
          <span className="text-ink-3 text-sm">/{period.weeksInYear}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[6px]">
        <ProgressBar value={period.weekOfYear} max={period.weeksInYear} tone="warm" />
        <div className="flex justify-between text-[11px] text-ink-3 font-mono tracking-wide">
          <span>{period.startLabel}</span>
          <span>2c arranca · sem {period.secondHalfStartWeek}</span>
          <span>{period.endLabel}</span>
        </div>
      </div>

      {/* TODO: cuando aterrice flow de cambio de período (US futura), enchufar
          link real. Hoy renderea como botón disabled con tooltip "Próximamente". */}
      <button
        type="button"
        disabled
        title="Próximamente"
        className="px-[14px] py-2 text-[12.5px] font-medium border border-line rounded text-ink-3 cursor-not-allowed"
      >
        Editar período
      </button>
    </div>
  );
}
