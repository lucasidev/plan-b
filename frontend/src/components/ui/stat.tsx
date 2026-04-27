import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: React.ReactNode;
  /** Small inline suffix, e.g. `%` or `/5`. Renders smaller than the value. */
  suffix?: string;
  /** Caption underneath, used for context like "X reseñas" or "Promedio histórico". */
  sub?: React.ReactNode;
  className?: string;
};

/**
 * KPI cell. Used in the stat strips at the top of plan / simulator / profile
 * views. Number is tabular-numeric so columns of stats line up across the
 * decimal point.
 */
export function Stat({ label, value, suffix, sub, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-1 p-4', className)}>
      <div className="font-ui font-medium text-ink-3 text-xs">{label}</div>
      <div className="font-ui font-semibold text-[22px] tracking-tight leading-tight tabular-nums">
        {value}
        {suffix && (
          <small className="font-ui font-normal text-ink-3 text-[13px] ml-1">{suffix}</small>
        )}
      </div>
      {sub && <div className="text-ink-3 text-[11.5px]">{sub}</div>}
    </div>
  );
}
