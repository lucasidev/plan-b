import type { PeriodSnapshot } from '../data/period';
import { ProgressBar } from './progress-bar';

type Props = {
  period: PeriodSnapshot;
};

/**
 * Academic-period card. Literal port of the "PROGRESO DEL AÑO" section of the
 * `v2-screens.jsx::V2Inicio` mock (lines 58-90).
 *
 * Layout: 3-column grid (`auto 1fr auto`). The left shows the year eyebrow + mono
 * heading `sem N/M`. The center has the warm bar with 3 evenly spaced labels (start
 * month, 2nd-term marker, end month). The right has the "Editar período" button (not
 * functional in MVP, TODO once a manual period-change flow lands).
 *
 * Since the bar is purely visual without labels above, `Meter` (which forces a label
 * above) can't be reused and this feature's slim `ProgressBar` component is used
 * instead.
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

      {/* TODO: once a period-change flow lands (future US), wire up the real link.
          For now this renders as a disabled button with the "Próximamente" tooltip. */}
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
