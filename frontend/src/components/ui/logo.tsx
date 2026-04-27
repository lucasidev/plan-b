import { cn } from '@/lib/utils';

type Props = {
  size?: number;
  className?: string;
};

/**
 * Wordmark + apricot dot. The dot floats above the baseline like a tittle so
 * the wordmark reads as a single typographic unit rather than a logo + bullet.
 *
 * Sized in pixels (not Tailwind tokens) because the dot diameter needs to
 * scale proportionally to the wordmark size, and that math is cleaner with
 * a numeric `size` than with utility classes. Default 28 matches the sidebar
 * brand size in the mockup.
 */
export function Logo({ size = 28, className }: Props) {
  const dotSize = Math.max(5, Math.round(size * 0.32));
  return (
    <span className={cn('inline-block leading-none', className)} role="img" aria-label="plan-b">
      <span
        className="font-display font-semibold text-ink"
        style={{ fontSize: `${size}px`, letterSpacing: '-0.01em' }}
      >
        plan-b
      </span>
      <i
        aria-hidden
        className="inline-block rounded-full bg-accent align-middle"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          marginLeft: `${Math.round(size * 0.12)}px`,
          transform: `translateY(-${Math.round(size * 0.28)}px)`,
        }}
      />
    </span>
  );
}
