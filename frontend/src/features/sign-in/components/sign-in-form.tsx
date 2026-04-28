'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, PasswordField, TextField } from '@/components/ui';
import { GoogleIcon } from '@/components/ui/icons/google';
import { cn } from '@/lib/utils';
import { signInAction } from '../actions';
import { initialSignInState, type SignInFormState } from '../types';

type Props = {
  /** Switches the AuthView mode without navigating. Used by the in-form
   *  "¿Sos nuevo? Creá tu cuenta" footer link. */
  onSwitchToSignUp: () => void;
};

/**
 * Sign-in form. Ports the mockup faithfully: Google button on top, "O CON
 * EMAIL" divider, email + password, anti-enumeration error block, accent
 * submit, forgot/switch links, legal disclaimer.
 *
 * The Google button and the forgot-password link are UI-only today: the
 * OAuth flow and the password-reset flow don't have backend support yet.
 * Both are placeholders pointing at routes that 404. The interface goes
 * first; the features land in subsequent PRs without touching this file.
 */
export function SignInForm({ onSwitchToSignUp }: Props) {
  const [state, formAction] = useActionState<SignInFormState, FormData>(
    signInAction,
    initialSignInState,
  );

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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
      />
      <PasswordField
        name="password"
        label="Contraseña"
        placeholder="Mínimo 12 caracteres"
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

      <FooterLinks onSwitchToSignUp={onSwitchToSignUp} />

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
      {pending ? 'Ingresando...' : 'Entrar'}
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

function FooterLinks({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  return (
    <div className="space-y-1.5 pt-1">
      <Link
        href="/forgot-password"
        prefetch
        className="block text-sm text-accent-ink hover:underline underline-offset-2"
      >
        ¿Olvidaste tu contraseña?
      </Link>
      <p className="text-sm text-accent-ink">
        ¿Sos nuevo?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="underline underline-offset-2 hover:text-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        >
          Creá tu cuenta
        </button>
      </p>
    </div>
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
