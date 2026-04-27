import { cn } from '@/lib/utils';

type Props = {
  /** Difficulty value, 0..max. Rounded to nearest int for filled-dot count. */
  value: number;
  max?: number;
  className?: string;
};

/**
 * 5-dot difficulty meter. Used as a compact stand-in for "★ 4.0" when space
 * is tight and exact decimals aren't useful (e.g. dense subject lists).
 */
export function DiffDots({ value, max = 5, className }: Props) {
  const filled = Math.round(value);
  return (
    <span
      className={cn('inline-flex gap-0.5', className)}
      title={`Dificultad ${value.toFixed(1)}/${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <i
          // biome-ignore lint/suspicious/noArrayIndexKey: positional, no reorder.
          key={i}
          className={cn('block size-[5px] rounded-full', i < filled ? 'bg-accent' : 'bg-line')}
        />
      ))}
    </span>
  );
}
