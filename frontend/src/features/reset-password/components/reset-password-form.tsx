'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { PasswordField } from '@/components/ui';
import { cn } from '@/lib/utils';
import { resetPasswordAction } from '../actions';
import { initialResetPasswordState, type ResetPasswordFormState } from '../types';

type Props = {
  /** Raw token read from the URL search params by the (server) page wrapper. */
  token: string;
};

/**
 * Reset-password form. Two password inputs + a hidden token field that
 * carries the value the (server) page extracted from the URL. The form
 * never asks for the email: the backend identifies the user from the
 * token, so even if the user opens the link in a different browser
 * session it works.
 *
 * The error block reacts to every backend failure mode listed in
 * US-033 AC. For "this link doesn't work anymore" cases (invalid /
 * expired / consumed / wrong_purpose) we show a CTA that points back
 * to /forgot-password so the user can request a fresh link without
 * leaving the flow.
 */
export function ResetPasswordForm({ token }: Props) {
  const [state, formAction] = useActionState<ResetPasswordFormState, FormData>(
    resetPasswordAction,
    initialResetPasswordState,
  );

  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const fieldError = (field: 'password' | 'confirm') =>
    state.status === 'error' &&
    (state.kind === 'validation' || state.kind === 'password_too_weak') &&
    state.field === field
      ? state.message
      : undefined;

  const formError =
    state.status === 'error' && !('field' in state && state.field) ? state.message : undefined;

  const showRequestNewLinkCta =
    state.status === 'error' &&
    (state.kind === 'token_invalid' ||
      state.kind === 'token_expired' ||
      state.kind === 'token_consumed' ||
      state.kind === 'wrong_purpose');

  return (
    <form action={formAction} className="flex flex-col" noValidate>
      {/*
        Hidden token field. The server action reads it from formData; the
        page injects it from the URL search params. Submitting the form
        without it is impossible from the UI but the schema guards the
        action server-side anyway.
      */}
      <input type="hidden" name="token" value={token} />

      <div style={{ marginBottom: 14 }}>
        <PasswordField
          ref={passwordRef}
          name="password"
          label="Contraseña nueva"
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
        <div
          role="alert"
          className="text-sm rounded border border-line bg-bg-card text-st-failed-fg"
          style={{ padding: 12, marginBottom: 14 }}
        >
          <p>{formError}</p>
          {showRequestNewLinkCta && (
            <p className="text-ink-2" style={{ marginTop: 6 }}>
              <Link
                href="/forgot-password"
                prefetch
                className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
              >
                Pedí un link nuevo
              </Link>
            </p>
          )}
        </div>
      )}

      <SubmitButton />

      <FooterLinks />
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
      {pending ? 'Guardando...' : 'Guardar contraseña nueva'}
    </button>
  );
}

function FooterLinks() {
  return (
    <div className="text-ink-3" style={{ marginTop: 22, fontSize: 13 }}>
      <Link
        href="/auth"
        prefetch
        className="text-accent-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ fontWeight: 500 }}
      >
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
