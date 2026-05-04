'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { resendVerificationAction } from '../actions';
import { initialResendVerificationState, type ResendVerificationFormState } from '../types';

type Props = {
  /** Email para reenviar el link. Puede venir de un searchParam (`/sign-up/check-inbox?email=`)
   *  o de un error previo de sign-in (`email_not_verified`). */
  email: string;
  /** Variante visual:
   *  - `primary`: full-width, look de botón principal (uso en check-inbox).
   *  - `inline`: compacto, ideal para banners de error en formularios. */
  variant?: 'primary' | 'inline';
};

/** Cooldown post-envío: 60 segundos durante los cuales el botón queda deshabilitado
 *  con un contador. Evita que el usuario haga spam contra el rate limiter. */
const COOLDOWN_SECONDS = 60;

/**
 * Botón reusable que dispara `POST /api/identity/resend-verification`. Maneja
 * 4 estados visibles (idle / pending / sent / error) + un cooldown local de 60s
 * tras un envío exitoso.
 *
 * Implementación: usa `useActionState` con un trigger programático en `onClick`
 * en lugar de envolver el botón en un `<form>`. Esa elección es deliberada:
 * el botón se inserta a veces dentro del sign-in form (que ya es `<form>`),
 * y un form anidado es HTML inválido. El action sigue siendo el mismo server
 * action ('use server'), simplemente lo invocamos vía `formAction(formData)`
 * sin un wrapper form.
 */
export function ResendVerificationButton({ email, variant = 'primary' }: Props) {
  const [state, formAction] = useActionState<ResendVerificationFormState, FormData>(
    resendVerificationAction,
    initialResendVerificationState,
  );

  const [pending, startTransition] = useTransition();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (state.status === 'sent') {
      setCooldownRemaining(COOLDOWN_SECONDS);
    }
  }, [state]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setTimeout(() => setCooldownRemaining((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownRemaining]);

  const errorMessage = state.status === 'error' ? state.message : undefined;
  const showSentMessage = state.status === 'sent' && cooldownRemaining > 0;

  function handleClick() {
    if (pending || cooldownRemaining > 0) return;
    const formData = new FormData();
    formData.set('email', email);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="flex flex-col">
      <SubmitButton
        variant={variant}
        pending={pending}
        cooldownRemaining={cooldownRemaining}
        onClick={handleClick}
      />

      {showSentMessage && (
        <p
          role="status"
          className="text-ink-2"
          style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}
        >
          Listo, te mandamos otro link a <b className="text-ink">{email}</b>. Si no llega, probá de
          nuevo en {cooldownRemaining}s.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="text-st-failed-fg"
          style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function SubmitButton({
  variant,
  pending,
  cooldownRemaining,
  onClick,
}: {
  variant: 'primary' | 'inline';
  pending: boolean;
  cooldownRemaining: number;
  onClick: () => void;
}) {
  const disabled = pending || cooldownRemaining > 0;

  const label = (() => {
    if (pending) return 'Mandando...';
    if (cooldownRemaining > 0) return `Reenviar en ${cooldownRemaining}s`;
    return 'Reenviar el link';
  })();

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'self-start inline-flex items-center gap-1.5',
          'underline text-accent-ink',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm',
          'disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed',
        )}
        style={{ fontSize: 13, fontWeight: 500 }}
      >
        {pending && <Loader2 size={13} className="animate-spin" aria-hidden />}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full inline-flex items-center justify-center gap-2',
        'bg-bg-card text-accent-ink border border-line shadow-card rounded-pill',
        'transition-colors hover:bg-accent-soft',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 500 }}
    >
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {label}
    </button>
  );
}
