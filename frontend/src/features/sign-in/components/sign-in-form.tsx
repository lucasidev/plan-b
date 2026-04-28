'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, PasswordField, TextField } from '@/components/ui';
import { signInAction } from '../actions';
import { initialSignInState, type SignInFormState } from '../types';

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
 * again with the same email and get a fresh link.
 */
export function SignInForm() {
  const [state, formAction] = useActionState<SignInFormState, FormData>(
    signInAction,
    initialSignInState,
  );

  const emailRef = useRef<HTMLInputElement>(null);
  // Focus the email field on mount so a returning user lands ready to type.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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
      />
      <PasswordField name="password" label="Contraseña" autoComplete="current-password" required />

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
      {pending ? 'Ingresando...' : 'Entrar'}
    </Button>
  );
}
