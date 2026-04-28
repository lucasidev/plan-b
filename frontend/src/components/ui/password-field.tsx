'use client';

import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  /** Inline error message rendered below the input. Sets aria-invalid and
   *  describedby for screen readers. */
  error?: string;
  /** Optional helper text below the input. Hidden when an error is shown. */
  hint?: string;
};

/**
 * Password input with a show/hide toggle button on the right edge. Toggling
 * swaps `type` between `password` and `text` while preserving the typed
 * value. `aria-pressed` exposes the toggle state to screen readers; the
 * toggle gets its own focus ring and stays inside the field's visual frame.
 *
 * Used in sign-in (one field), sign-up (password + confirm) and any future
 * flow that asks for a password.
 */
export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField(
  { label, error, hint, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const errorId = error ? `${reactId}-error` : undefined;
  const hintId = hint && !error ? `${reactId}-hint` : undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full h-11 px-3 pr-11 rounded border bg-bg-card text-ink',
            'placeholder:text-ink-4',
            'focus:outline-none focus:ring-2 focus:ring-accent-soft',
            error ? 'border-st-failed-fg' : 'border-line focus:border-accent',
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          tabIndex={-1}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'h-7 w-7 inline-flex items-center justify-center rounded',
            'text-ink-3 hover:text-ink hover:bg-line-2',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
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
