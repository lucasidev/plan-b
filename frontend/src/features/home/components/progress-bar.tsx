import { cn } from '@/lib/utils';

type Props = {
  value: number;
  max: number;
  /**
   * `neutral` rellena con `--color-ink` (uso default).
   * `warm` rellena con `--color-accent` (estados con urgencia visual,
   * ej. cuatri llegando al final, materias > 80% del cursado).
   */
  tone?: 'neutral' | 'warm';
  className?: string;
};

/**
 * Bar visual sin etiquetas. Port del helper `V2Progress` del mock
 * (`v2-screens.jsx`). Difiere del componente `Meter` de la design system
 * en que `Meter` requiere una etiqueta arriba; este se usa cuando las
 * etiquetas viven aparte (ej. en grids de 3 columnas como el período card,
 * donde las labels están a los costados de la barra).
 *
 * Si `max` es 0 o el valor cae fuera de rango, clampa a 0% / 100% sin
 * crash. `Math.max(0, ...)` y `Math.min(100, ...)` garantizan invariantes.
 */
export function ProgressBar({ value, max, tone = 'neutral', className }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cn('relative h-1.5 bg-line-2 rounded-pill overflow-hidden', className)}>
      <i
        className={cn(
          'block h-full rounded-pill',
          tone === 'neutral' && 'bg-ink',
          tone === 'warm' && 'bg-accent',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
