'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { PasswordField, TextField } from '@/components/ui';
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
 * Sign-up form. Mirrors sign-in's structure plus the confirm-password
 * field that's specific to registration. Direct port of `mode==='signup'`
 * branch in docs/design/reference/components/screens.jsx with the
 * matching styles from .auth-* in styles.css.
 *
 * The mockup's name field and "acepto términos" checkbox are deliberately
 * left out (US-010-f): backend's RegisterUser command takes only email +
 * password, no terms published. Documented in
 * docs/design/reference/README.md.
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
    <form action={formAction} className="flex flex-col" noValidate>
      <GoogleButton />
      <Divider>o con email</Divider>

      <div style={{ marginBottom: 14 }}>
        <TextField
          ref={emailRef}
          name="email"
          type="email"
          label="Tu email"
          placeholder="lucia.mansilla@email.com"
          autoComplete="email"
          required
          error={fieldError('email')}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <PasswordField
          name="password"
          label="Contraseña"
          placeholder="Mínimo 12 caracteres"
          autoComplete="new-password"
          required
          error={fieldError('password')}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <PasswordField
          name="confirm"
          label="Repetí la contraseña"
          autoComplete="new-password"
          required
          error={fieldError('confirm')}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
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
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2',
        'bg-accent text-white border border-accent rounded-pill shadow-card',
        'transition-colors hover:bg-accent-hover',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {pending ? 'Creando cuenta...' : 'Crear mi cuenta'}
    </button>
  );
}

function GoogleButton() {
  return (
    <Link
      href="/auth/google"
      className={cn(
        'w-full inline-flex items-center justify-center gap-2.5',
        'bg-bg-card text-ink border border-line shadow-card',
        'transition-colors hover:border-ink-3',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <GoogleIcon size={18} />
      Continuar con Google
    </Link>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center text-ink-4"
      style={{
        gap: 12,
        margin: '18px 0',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      <span className="flex-1 h-px bg-line" />
      <span>{children}</span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

function FooterLinks({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  return (
    <div className="text-ink-3" style={{ marginTop: 22, fontSize: 13 }}>
      ¿Ya tenés cuenta?{' '}
      <button
        type="button"
        onClick={onSwitchToSignIn}
        className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ fontWeight: 500 }}
      >
        Ingresá
      </button>
    </div>
  );
}

function LegalText() {
  return (
    <p className="text-ink-4" style={{ fontSize: 11.5, lineHeight: 1.55, marginTop: 20 }}>
      Al continuar entendés que plan-b no está afiliada oficialmente con UNSTA. Tu email se usa solo
      para verificar que sos alumno; nunca aparece en tus reseñas.
    </p>
  );
}
