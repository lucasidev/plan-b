'use client';

import { Flag } from 'lucide-react';
import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { reportReviewAction } from '../actions';
import { REPORT_REASONS, REPORT_REVIEW_INITIAL_STATE, type ReportableReview } from '../types';

/**
 * Report-review flow (US-019). A "Reportar" trigger on each public-feed card opens the
 * confirmation modal ported from `v2-modals.jsx::V2ModalReportar`: eyebrow + heading +
 * "anónimo, lo revisa el equipo" subtitle + five reason cards (radios) + optional details
 * textarea + Cancelar / Enviar reporte.
 *
 * Native <dialog> + sibling overlay + ESC + focus management, same pattern as the other
 * review modals. On success the body swaps to a short confirmation; "Enviar" stays disabled
 * until a reason is picked.
 */
export function ReportReviewModal({ review }: { review: ReportableReview }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const descId = useId();

  const [state, formAction] = useActionState(reportReviewAction, REPORT_REVIEW_INITIAL_STATE);

  const close = useCallback(() => {
    setOpen(false);
    setReason('');
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    firstRadioRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const succeeded = state.status === 'success';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1 text-[12px] text-ink-3',
          'underline-offset-2 hover:text-ink-2 hover:underline',
        )}
      >
        <Flag size={12} aria-hidden />
        Reportar
      </button>

      {open && (
        <>
          <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/40" />
          <dialog
            open
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={descId}
            className="fixed left-1/2 z-50 -translate-x-1/2 rounded-lg bg-bg-card border border-line shadow-card"
            style={{ top: 64, maxWidth: 480, width: 'calc(100% - 32px)', padding: 0 }}
          >
            {succeeded ? (
              <div style={{ padding: 24 }} className="flex flex-col items-center gap-3 text-center">
                <h2 id={headingId} className="font-display font-semibold text-lg text-ink m-0">
                  Gracias por avisar.
                </h2>
                <p className="text-sm text-ink-3 max-w-sm">
                  El equipo de plan-b revisa los reportes en menos de 24 hs. Si varios alumnos
                  reportan la misma reseña, se oculta automáticamente mientras la revisamos.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    'mt-2 inline-flex items-center justify-center rounded-pill',
                    'bg-accent text-white hover:bg-accent-hover transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
                  )}
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 500 }}
                >
                  Listo
                </button>
              </div>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="reviewId" value={review.id} />
                <div style={{ padding: 22 }}>
                  <p
                    className="text-ink-3"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    Reportar
                  </p>
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
                    ¿Por qué reportás esta reseña?
                  </h2>
                  <p
                    id={descId}
                    className="text-ink-3"
                    style={{ fontSize: 13, margin: 0, marginBottom: 16 }}
                  >
                    El reporte es anónimo. Lo revisa el equipo de plan-b en menos de 24 hs.
                  </p>

                  <fieldset
                    className="m-0 p-0 border-0 flex flex-col gap-2"
                    style={{ marginBottom: 16 }}
                  >
                    <legend className="sr-only">Motivo del reporte</legend>
                    {REPORT_REASONS.map((option, index) => (
                      <label
                        key={option.value}
                        className={cn(
                          'flex items-start gap-3 rounded border p-3 cursor-pointer transition-colors',
                          reason === option.value
                            ? 'border-accent bg-accent-soft'
                            : 'border-line hover:bg-bg-elev',
                        )}
                      >
                        <input
                          ref={index === 0 ? firstRadioRef : undefined}
                          type="radio"
                          name="reason"
                          value={option.value}
                          checked={reason === option.value}
                          onChange={(e) => setReason(e.target.value)}
                          className="mt-0.5 accent-accent"
                        />
                        <span className="flex flex-col">
                          <span className="text-[13.5px] font-medium text-ink">{option.label}</span>
                          <span className="text-[12px] text-ink-3">{option.hint}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <label htmlFor={`${headingId}-details`} className="block">
                    <span
                      className="text-ink-3"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Detalle (opcional)
                    </span>
                    <textarea
                      id={`${headingId}-details`}
                      name="details"
                      maxLength={2000}
                      placeholder="Contanos algo más si ayuda a entender el reporte."
                      className="mt-1.5 min-h-[72px] w-full resize-y rounded border border-line bg-bg-card px-3 py-2 font-sans text-[13px] leading-relaxed text-ink outline-none focus:border-accent"
                    />
                  </label>

                  {state.status === 'error' && (
                    <p
                      role="alert"
                      className="mt-3 rounded border border-st-failed-fg/30 bg-st-failed-bg text-st-failed-fg"
                      style={{ padding: 10, fontSize: 13, lineHeight: 1.45 }}
                    >
                      {state.message}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className={cn(
                        'inline-flex items-center justify-center rounded-pill',
                        'bg-bg-card text-ink border border-line hover:bg-bg-elev transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
                      )}
                      style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
                    >
                      Cancelar
                    </button>
                    <SubmitButton disabled={reason === ''} />
                  </div>
                </div>
              </form>
            )}
          </dialog>
        </>
      )}
    </>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        'inline-flex items-center justify-center rounded-pill',
        'bg-accent text-white hover:bg-accent-hover transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
    >
      {pending ? 'Enviando...' : 'Enviar reporte'}
    </button>
  );
}
