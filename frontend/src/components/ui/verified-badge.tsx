import { cn } from '@/lib/utils';

type Props = {
  /**
   * `student` = "verificado que cursó" badge over a review (apricot bg).
   * `teacher` = "docente UNSTA" badge for institutionally-verified
   * teacher accounts, same visual but distinct copy.
   */
  kind?: 'student' | 'teacher';
  className?: string;
};

const COPY: Record<NonNullable<Props['kind']>, string> = {
  student: 'verificado que cursó',
  teacher: 'docente UNSTA',
};

/**
 * Verification badge with a leading dot. Used in reviews to communicate
 * "this came from a real cursante" without exposing identity, and on
 * teacher profiles to mark institutional verification.
 */
export function VerifiedBadge({ kind = 'student', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-semibold uppercase',
        'bg-accent-soft text-accent-ink',
        'px-1.5 py-px rounded-[3px]',
        'text-[9.5px] tracking-wide',
        'before:content-[""] before:size-1 before:rounded-full before:bg-current',
        className,
      )}
    >
      {COPY[kind]}
    </span>
  );
}
