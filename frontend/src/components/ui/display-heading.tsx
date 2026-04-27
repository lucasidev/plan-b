import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Render size in px. Default 38 matches `.h-display` from the mockup. */
  size?: number;
  /** Semantic heading level. Default `h1`. */
  as?: 'h1' | 'h2';
};

/**
 * Hero-class headline. Tight tracking, slight negative letter-spacing,
 * `<em>` inside renders as italic Instrument Serif (the "rhetorical pause"
 * pattern from the mockup: "Cinco decisiones <em>esta semana</em>").
 *
 * Use for the top of a route/view, not for inline section titles. For
 * those use h1/h2 directly with the `font-display` utility.
 */
export function DisplayHeading({ children, className, size = 38, as: Tag = 'h1' }: Props) {
  return (
    <Tag
      className={cn(
        'font-display font-semibold text-ink m-0 [&_em]:font-serif [&_em]:italic [&_em]:font-normal',
        className,
      )}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1.05,
        letterSpacing: '-0.028em',
      }}
    >
      {children}
    </Tag>
  );
}
