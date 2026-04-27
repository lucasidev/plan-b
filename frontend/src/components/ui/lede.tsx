import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Sub-headline paragraph that follows an h-display. Capped at ~60ch so the
 * line measure doesn't get unreadable on wide screens. Uses --color-ink-3
 * to sit one step under the headline in the visual hierarchy.
 */
export function Lede({ children, className }: Props) {
  return (
    <p
      className={cn('text-ink-3 text-sm', className)}
      style={{ maxWidth: '60ch', lineHeight: 1.55 }}
    >
      {children}
    </p>
  );
}
