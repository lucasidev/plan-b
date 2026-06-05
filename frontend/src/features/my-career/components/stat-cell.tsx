import { cn } from '@/lib/utils';

type Props = {
  /** Valor numérico o texto corto a mostrar grande. */
  value: string;
  /** Label descriptivo abajo del valor. */
  label: string;
};

/**
 * Stat cell usado en cards "En números" de drawers (US-045-d). Port del
 * `V2Stat` del mock canvas.
 */
export function StatCell({ value, label }: Props) {
  return (
    <div>
      <div
        className={cn('font-mono font-semibold text-ink leading-none', 'tracking-tight')}
        style={{ fontSize: 22, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3 mt-1.5">{label}</div>
    </div>
  );
}
