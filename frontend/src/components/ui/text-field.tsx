import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  /** Inline error message rendered below the input. Sets aria-invalid and
   *  describedby for screen readers. */
  error?: string;
  /** Optional helper text below the input. Hidden when an error is shown so
   *  the two don't fight for the same row. */
  hint?: string;
};

/**
 * Standard text input with label + error + optional hint, wired for a11y.
 * Use `<TextField type="email" ...>` for emails; for passwords, use
 * `<PasswordField>` which adds the show/hide toggle.
 */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const errorId = error ? `${reactId}-error` : undefined;
  const hintId = hint && !error ? `${reactId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'w-full h-11 px-3 rounded border bg-bg-card text-ink',
          'placeholder:text-ink-4',
          'focus:outline-none focus:ring-2 focus:ring-accent-soft',
          error ? 'border-st-failed-fg' : 'border-line focus:border-accent',
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-st-failed-fg">
          {error}
        </p>
      )}
    </div>
  );
});
