'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { initialSignUpState, type SignUpFormState, signUpAction } from '../actions';

/**
 * Sign-up form. Three fields (email, password, confirm) plus submit.
 * Per ADR-0022, simple forms (1-3 fields) use React 19 primitives —
 * useActionState for the action's state machine, useFormStatus for the
 * submit button's pending state. No TanStack Form here.
 *
 * Inputs are uncontrolled and rely on the browser's native form submit.
 * The server action validates with Zod (signUpSchema) and returns an
 * error state shaped per field; this form scopes the message under the
 * relevant input so the user can correct in place.
 */
export function SignUpForm() {
  const [state, formAction] = useActionState<SignUpFormState, FormData>(
    signUpAction,
    initialSignUpState,
  );

  const fieldError = (field: 'email' | 'password' | 'confirm') =>
    state.status === 'error' && state.field === field ? state.message : undefined;

  const formError = state.status === 'error' && !state.field ? state.message : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        name="email"
        type="email"
        label="Email"
        placeholder="lucia@unsta.edu.ar"
        autoComplete="email"
        required
        error={fieldError('email')}
      />
      <Field
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 12 caracteres"
        autoComplete="new-password"
        required
        error={fieldError('password')}
      />
      <Field
        name="confirm"
        type="password"
        label="Repetí la contraseña"
        autoComplete="new-password"
        required
        error={fieldError('confirm')}
      />

      {formError && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card p-3 text-st-failed-fg"
        >
          {formError}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

type FieldProps = {
  name: string;
  type: 'email' | 'password' | 'text';
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
};

function Field({ name, type, label, placeholder, autoComplete, required, error }: FieldProps) {
  const id = `signup-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'w-full h-11 px-3 rounded border bg-bg-card text-ink',
          'placeholder:text-ink-4',
          'focus:outline-none focus:ring-2 focus:ring-accent-soft',
          error ? 'border-st-failed-fg' : 'border-line focus:border-accent',
        )}
      />
      {error && (
        <p id={errorId} className="text-xs text-st-failed-fg">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" disabled={pending} className="w-full justify-center">
      {pending ? 'Creando cuenta...' : 'Crear mi cuenta'}
    </Button>
  );
}
