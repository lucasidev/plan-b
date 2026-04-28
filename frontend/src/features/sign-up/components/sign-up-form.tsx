'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, PasswordField, TextField } from '@/components/ui';
import { signUpAction } from '../actions';
import { initialSignUpState, type SignUpFormState } from '../types';

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

  const emailRef = useRef<HTMLInputElement>(null);
  // Focus the email field on mount so the user can start typing immediately
  // when arriving on /sign-up or after switching to the sign-up tab.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const fieldError = (field: 'email' | 'password' | 'confirm') =>
    state.status === 'error' && state.field === field ? state.message : undefined;

  const formError = state.status === 'error' && !state.field ? state.message : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <TextField
        ref={emailRef}
        name="email"
        type="email"
        label="Email"
        placeholder="tu@email.com"
        autoComplete="email"
        required
        error={fieldError('email')}
      />
      <PasswordField
        name="password"
        label="Contraseña"
        placeholder="Mínimo 12 caracteres"
        autoComplete="new-password"
        required
        hint="Al menos 12 caracteres."
        error={fieldError('password')}
      />
      <PasswordField
        name="confirm"
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      disabled={pending}
      className="w-full justify-center gap-2"
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {pending ? 'Creando cuenta...' : 'Crear mi cuenta'}
    </Button>
  );
}
