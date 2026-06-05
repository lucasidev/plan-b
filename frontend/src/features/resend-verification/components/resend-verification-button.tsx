'use client';

import { Loader2 } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { resendVerificationAction } from '../actions';
import { initialResendVerificationState, type ResendVerificationFormState } from '../types';

type Props = {
  /** Email to resend the link to. Can come from a searchParam
   *  (`/sign-up/check-inbox?email=`) or from a previous sign-in error
   *  (`email_not_verified`). */
  email: string;
  /** Visual variant:
   *  - `primary`: full-width, primary-button look (used in check-inbox).
   *  - `inline`: compact, ideal for error banners inside forms. */
  variant?: 'primary' | 'inline';
};

/** Post-send cooldown: 60 seconds during which the button stays disabled with a
 *  countdown. Prevents the user from spamming the rate limiter. */
const COOLDOWN_SECONDS = 60;

/**
 * Reusable button that triggers `POST /api/identity/resend-verification`. Handles four
 * visible states (idle / pending / sent / error) plus a 60s local cooldown after a
 * successful send.
 *
 * Implementation: uses `useActionState` with a programmatic trigger on `onClick`
 * instead of wrapping the button in a `<form>`. That choice is deliberate: the button
 * is sometimes inserted inside the sign-in form (already a `<form>`) and a nested form
 * is invalid HTML. The action is still the same server action ('use server'), we just
 * invoke it via `formAction(formData)` without a wrapping form.
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

  function handleResendClick() {
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
        onClick={handleResendClick}
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
