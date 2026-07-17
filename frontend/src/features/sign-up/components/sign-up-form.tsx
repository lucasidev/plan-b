'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { AuthErrorBanner, PasswordField, TextField } from '@/components/ui';
import { GoogleIcon } from '@/components/ui/icons/google';
import { cn } from '@/lib/utils';
import { signUpAction } from '../actions';
import { initialSignUpState, type SignUpFormState } from '../types';

/**
 * Sign-up form. Renders the registration form for `/sign-up`. Backend
 * endpoint is `POST /api/identity/register`; on 201 the action redirects
 * to `/sign-up/check-inbox?email=...`.
 *
 * Mirrors sign-in's structure plus the confirm-password field that's
 * specific to registration. The mockup's name field and "acepto términos"
 * checkbox are deliberately left out (US-010-f): backend's RegisterUser
 * command takes only email + password, no terms published. Documented in
 * docs/design/reference/README.md.
 *
 * Cross-flow footer link navigates to `/sign-in`.
 */
export function SignUpForm() {
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

      {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}

      <SubmitButton />
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
  // Google OAuth is not implemented yet. The button stays visible to match the
  // mockup UI but is disabled to avoid pointing at a non-existent route. When the
  // OAuth flow exists, this button becomes a <Link href="/oauth/google"> (path TBD
  // by the OAuth callback).
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

// El link cross-flow "¿Ya tenés cuenta? Ingresá" y el disclaimer viven ahora en
// el `AuthShell` (foot + footer del panel), no en el form (US-059-f).
