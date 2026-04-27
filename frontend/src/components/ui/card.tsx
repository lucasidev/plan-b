import { cn } from '@/lib/utils';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * `default` = white card with shadow, the working horse.
   * `elevated` = slightly more shadow on hover, used for cards that want
   * a hover affordance.
   * `subtle` = no shadow, just a 1px border. Used inside other containers.
   */
  variant?: 'default' | 'elevated' | 'subtle';
};

/**
 * Container. Apricot palette dictates `bg-card` (white) on the apricot
 * surface, with a thin warm-tinted border and a low warm shadow so the
 * card lifts off the BG without feeling glassy.
 */
export function Card({ children, className, variant = 'default', ...rest }: Props) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-line rounded',
        variant === 'default' && 'shadow-card',
        variant === 'elevated' && 'shadow-card hover:shadow-card-h transition-shadow',
        variant === 'subtle' && 'shadow-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
