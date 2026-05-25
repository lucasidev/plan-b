import type { Ref } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';
type Size = 'sm' | 'md';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * `primary` = ink-on-cream, the default look. The "do this" CTA in non-marketing
   *             contexts (forms, drawers).
   * `secondary` = card-bg with thin border. Less weight than primary.
   * `ghost` = transparent, hover bg. For dismiss / cancel / nav.
   * `accent` = terracotta. The "do this" CTA in marketing/auth/onboarding moments.
   */
  variant?: Variant;
  size?: Size;
  /**
   * En React 19+ `ref` se pasa como prop normal sobre function components — sin
   * `forwardRef`. Lo dejamos opcional así los callers que no necesitan el ref
   * (la mayoría) no tienen que hacer nada distinto.
   */
  ref?: Ref<HTMLButtonElement>;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white border border-ink shadow-card hover:bg-[#1a110a] hover:shadow-card-h',
  secondary:
    'bg-bg-card text-ink border border-line shadow-card hover:bg-bg-elev hover:shadow-card-h',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-line-2 hover:text-ink',
  accent:
    'bg-accent text-white border border-accent shadow-card hover:bg-accent-hover hover:shadow-card-h',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px]',
  md: 'h-10 px-4 text-[13.5px]',
};

/**
 * Pill-shaped button matching `.btn` from the mockup. Active feedback is a
 * 1px translateY (cheap, snappy, doesn't compete with the shadow).
 */
export function Button({ variant = 'primary', size = 'md', className, ref, type, ...rest }: Props) {
  return (
    <button
      ref={ref}
      // type default explícito 'button' (regla react-doctor/button-has-type). Los callers
      // que necesitan submit pasan type="submit" al usar el componente dentro de un <form>.
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-1.5',
        'font-medium rounded-pill',
        'transition-[background,transform,box-shadow] duration-150',
        'active:translate-y-px',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
