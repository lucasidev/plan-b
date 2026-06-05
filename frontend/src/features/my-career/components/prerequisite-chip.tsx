import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  code: string;
  name: string;
  /**
   * `ok` is used for already-approved prerequisites (green, check).
   * `next` is used for subjects this one unlocks (gray, arrow).
   */
  tone: 'ok' | 'next';
};

/**
 * Prerequisite chip for the subject drawer (US-045-d). Port of the canvas mock's
 * `V2CorrChip`. Links to `/my-career/subject/[code]` to allow navigation between
 * subject detail views (a prerequisite of B opens B's drawer; browser back returns to
 * the original drawer).
 */
export function PrerequisiteChip({ code, name, tone }: Props) {
  return (
    <Link
      href={`/my-career/subject/${code}`}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg',
        'bg-bg-elev border border-line',
        'hover:border-accent transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded-full grid place-items-center text-[10px] font-semibold',
          tone === 'ok' && 'bg-st-approved-bg text-st-approved-fg',
          tone === 'next' && 'bg-bg-elev text-ink-2',
        )}
        aria-hidden
      >
        {tone === 'ok' ? '✓' : '→'}
      </span>
      <span className="font-mono text-[10.5px] tracking-wide text-ink-3 uppercase">{code}</span>
      <span className="text-sm text-ink">{name}</span>
    </Link>
  );
}
