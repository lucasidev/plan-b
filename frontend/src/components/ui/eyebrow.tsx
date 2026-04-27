import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  /**
   * Tone shifts the foreground color. Default `muted` is `--color-ink-3`,
   * `accent` is the warm terracotta `--color-accent-ink`, `danger` reuses
   * the failed-state foreground for error contexts.
   */
  tone?: 'muted' | 'accent' | 'danger';
};

/**
 * Section label. Small, sentence-cased, in --color-ink-3 by default. Used
 * above h-display / h1 to introduce a section without competing visually
 * with the headline below it.
 */
export function Eyebrow({ children, className, tone = 'muted' }: Props) {
  return (
    <div
      className={cn(
        'font-ui font-medium text-xs',
        tone === 'muted' && 'text-ink-3',
        tone === 'accent' && 'text-accent-ink',
        tone === 'danger' && 'text-st-failed-fg',
        className,
      )}
    >
      {children}
    </div>
  );
}
