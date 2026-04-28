'use client';

import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & {
  label: string;
  /** Inline error message rendered below the input. */
  error?: string;
  /** Optional helper text below the input. Hidden when an error is shown. */
  hint?: string;
};

/**
 * Same shape as TextField (mockup `.field` styling) plus an Eye/EyeOff
 * toggle on the right edge. Toggling swaps `type` between `password` and
 * `text` while preserving the value. `aria-pressed` exposes the state to
 * screen readers; the toggle gets `tabIndex={-1}` so Tab keeps going
 * label → input → next field.
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
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
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
            padding: '11px 44px 11px 14px',
            border: '1px solid',
            borderRadius: 8,
            fontSize: 14,
          }}
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
