'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { TextField } from '@/components/ui';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import { forgotPasswordAction } from '../actions';
import { type ForgotPasswordFormState, initialForgotPasswordState } from '../types';

/**
 * Forgot-password form. Single email field, mirrors the visual rhythm of
 * sign-in / sign-up (same field/button widths, same legal footer absent).
 * The success path is a redirect handled by the action, so this component
 * only needs to render the idle/error state.
 *
 * Per US-033-f: the rate-limit error stays in-form (no redirect) so the
 * user sees the throttle message right next to the input they just used.
 * Validation errors render against the email field.
 */
export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ForgotPasswordFormState, FormData>(
    forgotPasswordAction,
    initialForgotPasswordState,
  );

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const fieldError =
    state.status === 'error' && state.kind === 'validation' && state.field === 'email'
      ? state.message
      : undefined;

  const formError =
    state.status === 'error' && (state.kind === 'rate_limit' || state.kind === 'unknown')
      ? state.message
      : undefined;

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      <div style={{ marginBottom: 18 }}>
        <TextField
          ref={emailRef}
          name="email"
          type="email"
          label="Tu email"
          placeholder="lucia.mansilla@email.com"
          autoComplete="email"
          required
          error={fieldError}
          hint="Tiene que ser el email con el que te registraste."
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

      <FooterLinks />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  // Sin la guarda, un submit antes de que React hidrate se procesa como POST nativo: el mail se
  // manda igual, pero el redirect a check-inbox vive en el estado del cliente y nunca ocurre, así
  // que el usuario se queda en el form creyendo que no pasó nada.
  const hydrated = useHydrated();
  return (
    <button
      type="submit"
      disabled={pending || !hydrated}
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
      {pending ? 'Mandando link...' : 'Mandame el link'}
    </button>
  );
}

function FooterLinks() {
  // El link "← Volver a ingresar" vive en el foot del AuthShell (US-059-f); acá
  // queda solo el cross-flow a registro, como en el mock.
  return (
    <div className="text-ink-3" style={{ marginTop: 18, fontSize: 12, textAlign: 'center' }}>
      ¿No te registraste todavía?{' '}
      <Link
        href="/sign-up"
        prefetch
        className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ fontWeight: 500 }}
      >
        Crear cuenta
      </Link>
    </div>
  );
}
