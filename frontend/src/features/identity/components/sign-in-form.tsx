'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { initialSignInState, type SignInFormState, signInAction } from '../actions';

/**
 * Sign-in form. Two fields plus submit. Same React 19 primitive stack
 * (useActionState + useFormStatus) as SignUpForm.
 *
 * Errors don't get scoped per-field here — the backend deliberately
 * returns the anti-enumeration `InvalidCredentials` for both wrong-email
 * and wrong-password. Showing the error in a single alert above the
 * submit button matches that contract; per-field errors would leak
 * which input was wrong.
 *
 * The action state's `kind` discriminator lets us add side-effects to
 * specific failure modes without re-parsing the message string. Today
 * we use it to surface a "registrate de nuevo" link when the email is
 * not verified — the resend-verification endpoint doesn't exist yet
 * (US-021 backlog), so the workaround is to nudge the user to register
 * again with the same email and get a fresh link. Once US-021-f lands,
 * that link gets swapped for a real resend button.
 */
export function SignInForm() {
  const [state, formAction] = useActionState<SignInFormState, FormData>(
    signInAction,
    initialSignInState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field
        name="email"
        type="email"
        label="Email"
        placeholder="lucia@unsta.edu.ar"
        autoComplete="email"
        required
      />
      <Field
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
      />

      {state.status === 'error' && (
        <div
          role="alert"
          className="text-sm rounded border border-line bg-bg-card p-3 space-y-2 text-st-failed-fg"
        >
          <p>{state.message}</p>
          {state.kind === 'email_not_verified' && (
            <p className="text-ink-2">
              ¿No llegó el mail?{' '}
              <Link href="/sign-up" prefetch className="underline">
                Registrate de nuevo con el mismo email
              </Link>{' '}
              para recibir un link nuevo.
            </p>
          )}
        </div>
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
};

function Field({ name, type, label, placeholder, autoComplete, required }: FieldProps) {
  const id = `signin-${name}`;
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
        className={cn(
          'w-full h-11 px-3 rounded border bg-bg-card text-ink',
          'placeholder:text-ink-4',
          'focus:outline-none focus:ring-2 focus:ring-accent-soft',
          'border-line focus:border-accent',
        )}
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" disabled={pending} className="w-full justify-center">
      {pending ? 'Ingresando...' : 'Entrar'}
    </Button>
  );
}
