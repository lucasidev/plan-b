'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, PasswordField, TextField } from '@/components/ui';
import { GoogleIcon } from '@/components/ui/icons/google';
import { cn } from '@/lib/utils';
import { signUpAction } from '../actions';
import { initialSignUpState, type SignUpFormState } from '../types';

type Props = {
  /** Switches the AuthView mode without navigating. Used by the in-form
   *  "¿Ya tenés cuenta? Ingresá" footer link. */
  onSwitchToSignIn: () => void;
};

/**
 * Sign-up form. Mirrors the sign-in shape (Google button, divider, email +
 * password fields, accent submit, footer links, legal disclaimer) plus the
 * confirm-password field that's specific to registration.
 *
 * Same caveats as sign-in: the Google button is a UI placeholder until
 * OAuth lands; the form posts to POST /api/identity/register and on 201
 * redirects to /sign-up/check-inbox.
 */
export function SignUpForm({ onSwitchToSignIn }: Props) {
  const [state, formAction] = useActionState<SignUpFormState, FormData>(
    signUpAction,
    initialSignUpState,
  );

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const fieldError = (field: 'email' | 'password' | 'confirm') =>
    state.status === 'error' && state.field === field ? state.message : undefined;

  const formError = state.status === 'error' && !state.field ? state.message : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <GoogleButton />
      <Divider>O CON EMAIL</Divider>

      <TextField
        ref={emailRef}
        name="email"
        type="email"
        label="Email institucional"
        placeholder="lucia.mansilla@unsta.edu.ar"
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

      <FooterLinks onSwitchToSignIn={onSwitchToSignIn} />

      <LegalText />
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

function GoogleButton() {
  return (
    <Link
      href="/auth/google"
      className={cn(
        'w-full h-11 inline-flex items-center justify-center gap-3',
        'rounded-pill border border-line bg-bg-card text-ink',
        'text-sm font-medium hover:bg-bg-elev transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
    >
      <GoogleIcon size={18} />
      Continuar con Google
    </Link>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-line" />
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-3">
        {children}
      </span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

function FooterLinks({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  return (
    <p className="text-sm text-accent-ink pt-1">
      ¿Ya tenés cuenta?{' '}
      <button
        type="button"
        onClick={onSwitchToSignIn}
        className="underline underline-offset-2 hover:text-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
      >
        Ingresá
      </button>
    </p>
  );
}

function LegalText() {
  return (
    <p className="text-xs text-ink-3 leading-relaxed pt-2">
      Al continuar entendés que plan-b no está afiliada oficialmente con UNSTA. Tu email
      institucional se usa solo para verificar que sos alumno; nunca aparece en tus reseñas.
    </p>
  );
}
