import { cn } from '@/lib/utils';

type Props = {
  /** Valor grande (string para soportar `"—"` o `"Mar 2024"`). */
  value: string | number;
  /** Label descriptivo abajo. */
  label: string;
};

/**
 * Card de KPI individual para el tab Historial (US-045-e). Port literal
 * del `V2HistKpi` del canvas: número mono grande arriba, label `ink-3`
 * abajo.
 */
export function HistoryKpi({ value, label }: Props) {
  return (
    <div className={cn('bg-bg-card border border-line rounded-lg shadow-card', 'p-4')}>
      <div
        className="font-mono font-semibold text-ink leading-none"
        style={{ fontSize: 22, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
