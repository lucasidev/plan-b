import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'warm' | 'good' | 'danger' | 'ink';
};

/**
 * Compact metadata tag. Mono-font, ~10.5px, low-contrast background.
 * Tones map to subject-state foregrounds + accent for product moments
 * (the "warm" tone is what the mockup uses for "recomendado", urgentes,
 * etc.). "ink" es la `pill pub` de la maqueta de Explorar (ADR-0096): fondo
 * oscuro, texto claro, para lo que ya tiene reseñas (no es un estado del
 * dominio como "good", que queda reservado a `--color-st-approved`).
 */
export function Pill({ children, className, tone = 'neutral' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[10.5px] tracking-wide px-1.5 py-0.5 rounded-[4px]',
        tone === 'neutral' && 'bg-line-2 text-ink-2',
        tone === 'warm' && 'bg-accent-soft text-accent-ink',
        tone === 'good' && 'bg-st-approved-bg text-st-approved-fg',
        tone === 'danger' && 'bg-st-failed-bg text-st-failed-fg',
        tone === 'ink' && 'bg-ink text-bg-card',
        className,
      )}
    >
      {children}
    </span>
  );
}
