'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { deleteReviewAction } from '../actions';
import { DELETE_REVIEW_INITIAL_STATE, type DeletableReview } from '../types';

/**
 * Destructive delete-review flow (US-055). Renders a "Borrar" trigger that opens the
 * confirmation modal ported from the mockup (`v2-modals.jsx::V2ModalBorrarResena`):
 * eyebrow + heading with the subject code + body + a preview of the review being deleted
 * + a "mejor editala" nudge + Cancel / Delete CTAs.
 *
 * Per planning (2026-06-07): NO typed-confirm input. The mockup is the source of truth
 * and it shows a direct destructive button; the preview + red button is enough conscious
 * friction. The "marcas útiles" / "respuestas" counts the original doc mentioned are
 * deferred until votes + US-040 land.
 *
 * On success we invalidate the Mías + Pendientes queries so the list updates in place
 * (the deleted review drops from Mías, the cursada reappears in Pendientes) without a
 * full navigation. The modal pattern (native <dialog>, sibling overlay, ESC, focus
 * management) mirrors `deactivate-account-button`.
 */
export function DeleteReviewModal({ review }: { review: DeletableReview }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descId = useId();

  const queryClient = useQueryClient();
  const router = useRouter();
  const [state, formAction] = useActionState(deleteReviewAction, DELETE_REVIEW_INITIAL_STATE);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // On success: invalidate the affected lists, close, and land on the Mías tab. From the
  // Mías card the navigation is a no-op-ish refresh (already there) and the invalidation
  // updates the list in place; from the editor header it navigates the user back to Mías
  // so they do not stay on a now-deleted review's edit page. revalidatePath in the action
  // refreshes the server cache; invalidateQueries refreshes the client TanStack cache.
  useEffect(() => {
    if (state.status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      close();
      router.push('/reviews?tab=mine');
    }
  }, [state.status, queryClient, close, router]);

  useEffect(() => {
    if (!open) return;

    cancelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const previewSnippet =
    review.subjectText && review.subjectText.length > 100
      ? `${review.subjectText.slice(0, 100)}...`
      : review.subjectText;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'text-[12px] font-medium underline-offset-2 hover:underline',
          'text-st-failed-fg',
        )}
      >
        Borrar
      </button>

      {open && (
        <>
          <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/40" />
          <dialog
            ref={dialogRef}
            open
            aria-modal="true"
            aria-labelledby={headingId}
            aria-describedby={descId}
            className="fixed left-1/2 z-50 -translate-x-1/2 rounded-lg bg-bg-card border border-line shadow-card"
            style={{ top: 80, maxWidth: 460, width: 'calc(100% - 32px)', padding: 0 }}
          >
            {/* Header band (tinted, per mock) */}
            <div
              className="rounded-t-lg border-b border-st-failed-fg/20 bg-st-failed-bg"
              style={{ padding: '18px 22px' }}
            >
              <p
                className="text-st-failed-fg"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  margin: 0,
                  marginBottom: 6,
                }}
              >
                Acción permanente
              </p>
              <h2
                id={headingId}
                className="text-ink"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                ¿Borrar tu reseña de {review.subjectCode}?
              </h2>
            </div>

            <div style={{ padding: 22 }}>
              <p
                id={descId}
                className="text-ink-2"
                style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0, marginBottom: 16 }}
              >
                Una vez borrada no podemos recuperarla.
              </p>

              {/* Preview card of the review being deleted */}
              <div
                className="rounded border border-line bg-bg-elev"
                style={{ padding: 14, marginBottom: 16 }}
              >
                <p
                  className="text-ink-3"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    margin: 0,
                    marginBottom: 8,
                  }}
                >
                  La reseña que vas a borrar
                </p>
                <p
                  className="text-ink-3 font-mono"
                  style={{ fontSize: 11.5, margin: 0, marginBottom: previewSnippet ? 8 : 0 }}
                >
                  Dificultad {review.difficultyRating}/5 · {review.subjectCode} ·{' '}
                  {review.subjectName}
                </p>
                {previewSnippet && (
                  <p
                    className="text-ink-2"
                    style={{ fontSize: 12.5, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}
                  >
                    "{previewSnippet}"
                  </p>
                )}
              </div>

              <p className="text-ink-3" style={{ fontSize: 12.5, margin: 0, marginBottom: 18 }}>
                Si querés actualizar lo que escribiste sin perder utilidad, mejor{' '}
                <Link
                  href={`/reviews/edit/${review.id}`}
                  className="text-accent-ink font-medium underline-offset-2 hover:underline"
                >
                  editala
                </Link>
                .
              </p>

              {state.status === 'error' && (
                <p
                  role="alert"
                  className="rounded border border-st-failed-fg/30 bg-st-failed-bg text-st-failed-fg"
                  style={{ padding: 10, marginBottom: 14, fontSize: 13, lineHeight: 1.45 }}
                >
                  {state.message}
                </p>
              )}

              <form action={formAction} className="flex justify-end gap-2">
                <input type="hidden" name="reviewId" value={review.id} />
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={close}
                  className={cn(
                    'inline-flex items-center justify-center',
                    'bg-bg-card text-ink border border-line rounded-pill',
                    'hover:bg-bg-elev transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
                  )}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
                >
                  Cancelar
                </button>
                <DeleteButton />
              </form>
            </div>
          </dialog>
        </>
      )}
    </>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center',
        'bg-st-failed-fg text-white border border-st-failed-fg rounded-pill',
        'transition-colors hover:opacity-90',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
      )}
      style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
    >
      {pending ? 'Borrando...' : 'Borrar reseña'}
    </button>
  );
}
