import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  /** Inline error message rendered below the input. Sets aria-invalid and
   *  describedby for screen readers. */
  error?: string;
  /** Optional helper text below the input. Hidden when an error is shown. */
  hint?: string;
};

/**
 * Direct port of `.field` from docs/design/reference/styles.css. Label is
 * mono 12px ink-3 with letter-spacing; input is 14px on a soft 8px-radius
 * border. Focus state is `border-accent` plus a 3px `accent-soft` ring
 * (box-shadow, not outline, to match the mockup's calm focus look).
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
    <div className="flex flex-col" style={{ gap: 5 }}>
      <label
        htmlFor={inputId}
        className="text-ink-3"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'w-full bg-bg-card text-ink outline-none transition-colors',
          'placeholder:text-ink-4',
          'focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]',
          error ? 'border-st-failed-fg' : 'border-line',
          className,
        )}
        style={{
          padding: '11px 14px',
          border: '1px solid',
          borderRadius: 8,
          fontSize: 14,
        }}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-ink-3" style={{ fontSize: 11.5, marginTop: 4 }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-st-failed-fg" style={{ fontSize: 11.5, marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
});
