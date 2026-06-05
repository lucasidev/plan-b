'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { TextField } from '@/components/ui';
import { cn } from '@/lib/utils';
import { deactivateAccountAction } from '../actions';
import { initialDeactivateAccountState } from '../types';

/**
 * Destructive card with a "Dar de baja mi cuenta" CTA + confirmation modal that asks the
 * user to retype their email (anti-accidental check). Replaces the previous "Eliminar mi
 * cuenta" (US-038-f) after the ADR-0044 rework: the flow is now soft delete with
 * anonymization (preserves the crowdsourced corpus; the user's reviews stay published as
 * "Ex-miembro").
 *
 * Convention (GitHub, Vercel, Linear): ask for the email instead of the password. The
 * password already authenticated this session; asking for it again adds friction without
 * adding safety. The email is different from the regular flow and forces the user to
 * engage with the action consciously.
 *
 * The comparison is case-insensitive: RFC 5321 allows case-sensitive local-parts but no
 * real provider honors it, and the backend lowercases on store.
 */
export function DeactivateAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descId = useId();

  const [typed, setTyped] = useState('');
  const [state, formAction] = useActionState(
    deactivateAccountAction,
    initialDeactivateAccountState,
  );

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  const close = useCallback(() => {
    setOpen(false);
    setTyped('');
    triggerRef.current?.focus();
  }, []);

  // Move focus into the modal when it opens, and close on ESC. Click-outside is wired
  // separately so we can short-circuit when clicking inside.
  //
  // The `prefer-use-effect-event` rule suggests wrapping `close` with `useEffectEvent`
  // so the effect doesn't resubscribe on every parent render. `useEffectEvent` is still
  // an experimental API in React 19; revisit once it ships. Meanwhile, `close` is stable
  // (useCallback with [] deps) so the resubscription does not occur in practice.
  // Suppression in `react-doctor.config.json#ignore.overrides`.
  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  return (
    <section
      aria-labelledby={`${headingId}-section`}
      className="rounded border border-line bg-bg-card"
      style={{ padding: 20 }}
    >
      <h3
        id={`${headingId}-section`}
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 600,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Dar de baja mi cuenta
      </h3>
      <p className="text-ink-2" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 16 }}>
        Tu cuenta se cierra y tus datos personales (email, nombre, perfil académico) se{' '}
        <b>anonimizan</b>. Tus reseñas, si las hay, quedan publicadas como "Ex-miembro" para que
        sigan siendo útiles a otros alumnos. Esta acción es <b>irreversible</b> y cumple con tu
        derecho de supresión (Ley 25.326).
      </p>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'bg-bg-card text-st-failed-fg border border-st-failed-fg/40 rounded-pill',
          'transition-colors hover:bg-st-failed-bg',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
        )}
        style={{ padding: '10px 16px', fontSize: 13.5, fontWeight: 500 }}
      >
        Dar de baja mi cuenta
      </button>

      {open && (
        <>
          {/*
            Overlay rendered as a sibling of the dialog (not a parent), so
            aria-hidden on the overlay doesn't cascade and hide the dialog
            from the accessibility tree. Click-to-close still works because
            we use absolute positioning to overlap them visually. Keyboard
            users dismiss with ESC (window keydown listener above).
          */}
          <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/40" />
          {/*
            We replace the <div role="dialog"> with the native <dialog> element
            (react-doctor/prefer-tag-over-role rule). The `open` attribute is used to
            show it inline instead of calling showModal() because we already manage
            backdrop + focus + ESC manually; showModal() would conflict with the
            managed state. aria-modal is still required because <dialog open> without
            showModal() is not marked as modal in the AOM.
          */}
          <dialog
            ref={dialogRef}
            open
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={descId}
            className="fixed left-1/2 z-50 -translate-x-1/2 rounded bg-bg-card border border-line shadow-card"
            style={{
              top: 80,
              maxWidth: 440,
              width: 'calc(100% - 32px)',
              padding: 24,
            }}
          >
            <div className="flex items-start gap-3" style={{ marginBottom: 14 }}>
              <AlertTriangle
                className="text-st-failed-fg"
                size={22}
                aria-hidden
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <h2
                  id={headingId}
                  className="text-ink"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  Confirmá la baja
                </h2>
                <p
                  id={descId}
                  className="text-ink-2"
                  style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0 }}
                >
                  Para confirmar, escribí tu email <b>{email}</b> abajo. Tus datos personales se
                  anonimizan ahora; tus reseñas quedan como anónimas.
                </p>
              </div>
            </div>

            <form action={formAction} noValidate>
              <div style={{ marginBottom: 14 }}>
                <TextField
                  ref={inputRef}
                  name="email-confirmation"
                  label="Tu email"
                  type="email"
                  required
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  aria-describedby={
                    typed.length > 0 && !matches ? `${headingId}-mismatch` : undefined
                  }
                />
                {typed.length > 0 && !matches && (
                  <p
                    id={`${headingId}-mismatch`}
                    className="text-st-failed-fg"
                    role="alert"
                    style={{ fontSize: 12.5, marginTop: 6 }}
                  >
                    El email no coincide con el de tu cuenta.
                  </p>
                )}
              </div>

              {state.status === 'error' && (
                <p
                  role="alert"
                  className="rounded border border-line bg-bg-card text-st-failed-fg"
                  style={{
                    padding: 10,
                    marginBottom: 14,
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {state.message}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'bg-bg-card text-ink border border-line rounded-pill',
                    'hover:bg-bg-card-hover transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
                  )}
                  style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <ConfirmButton disabled={!matches} />
              </div>
            </form>
          </dialog>
        </>
      )}
    </section>
  );
}

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'bg-st-failed-fg text-white border border-st-failed-fg rounded-pill',
        'transition-colors hover:opacity-90',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }}
    >
      {pending && <Loader2 size={14} className="animate-spin" aria-hidden />}
      {pending ? 'Dando de baja...' : 'Dar de baja la cuenta'}
    </button>
  );
}
