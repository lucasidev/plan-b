'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { PasswordField, TextField } from '@/components/ui';
import { GoogleIcon } from '@/components/ui/icons/google';
import { ResendVerificationButton } from '@/features/resend-verification';
import { cn } from '@/lib/utils';
import { signInAction } from '../actions';
import { initialSignInState, type SignInFormState } from '../types';

/**
 * Sign-in form. Renders the credentials form for `/sign-in`. Backend
 * endpoint is `POST /api/identity/sign-in`. Field spacing, divider, footer
 * links and legal disclaimer mirror the mockup
 * (docs/design/reference/components/screens.jsx); functional bits
 * unchanged from S1 (Zod schema, server action, anti-enumeration error
 * surface, autofocus on email).
 *
 * Cross-flow footer links navigate to `/sign-up` and `/forgot-password`.
 */
export function SignInForm() {
  const [state, formAction] = useActionState<SignInFormState, FormData>(
    signInAction,
    initialSignInState,
  );

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

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
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <PasswordField
          name="password"
          label="Contraseña"
          placeholder="Mínimo 12 caracteres"
          autoComplete="current-password"
          required
        />
      </div>

      {state.status === 'error' && (
        <div
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          <p>{state.message}</p>
          {state.kind === 'email_not_verified' && (
            <div className="text-ink-2" style={{ marginTop: 8 }}>
              <p style={{ marginBottom: 6 }}>¿No llegó el mail?</p>
              <ResendVerificationButton email={state.email} variant="inline" />
            </div>
          )}
        </div>
      )}

      <SubmitButton />

      <FooterLinks />

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
      {pending ? 'Ingresando...' : 'Entrar'}
    </button>
  );
}

function GoogleButton() {
  // OAuth con Google no está implementado todavía. El botón queda visible
  // para mantener la UI del mockup pero deshabilitado para no llevar a una
  // ruta inexistente. Cuando exista el flow OAuth, este botón se convierte
  // en un <Link href="/oauth/google"> (path TBD según el callback OAuth).
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Próximamente"
      className={cn(
        'w-full inline-flex items-center justify-center gap-2.5',
        'bg-bg-card text-ink-3 border border-line shadow-card',
        'cursor-not-allowed opacity-60',
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
      <span className="text-ink-4" style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>
        (próximamente)
      </span>
    </button>
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

function FooterLinks() {
  return (
    <>
      <div className="text-ink-3" style={{ marginTop: 22, fontSize: 13 }}>
        <Link
          href="/forgot-password"
          prefetch
          className="text-accent-ink hover:underline"
          style={{ fontWeight: 500 }}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <div className="text-ink-3" style={{ marginTop: 14, fontSize: 13 }}>
        ¿Sos nuevo?{' '}
        <Link
          href="/sign-up"
          prefetch
          className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
          style={{ fontWeight: 500 }}
        >
          Creá tu cuenta
        </Link>
      </div>
    </>
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
