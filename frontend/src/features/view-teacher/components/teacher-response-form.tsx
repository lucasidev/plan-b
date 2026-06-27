'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { respondToReviewAction } from '../actions';
import { initialRespondState } from '../types';

/**
 * Form para que el docente verificado responda una reseña sobre él (US-040). Solo se renderiza
 * cuando el viewer es el docente verificado de esta reseña y todavía no respondió. Mutación pura
 * (ADR-0046): al success hace router.refresh() para que la página server re-renderice con la
 * respuesta ya publicada (y el form desaparezca).
 */
export function TeacherResponseForm({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const fieldId = useId();
  const [state, formAction, isPending] = useActionState(respondToReviewAction, initialRespondState);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reaccionamos al cambio de status.
  useEffect(() => {
    if (state.status !== 'success') return;
    router.refresh();
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-1 flex flex-col gap-2 rounded-md border border-line bg-bg-elev p-3"
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <label htmlFor={fieldId} className="text-[12px] font-medium text-ink-2">
        Tu respuesta como docente
      </label>
      <textarea
        id={fieldId}
        name="text"
        required
        minLength={50}
        maxLength={2000}
        rows={3}
        placeholder="Respondé con tu perspectiva (mínimo 50 caracteres)..."
        className="w-full resize-y rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[11px] text-ink-3">
          Tu respuesta aparece con tu nombre, públicamente.
        </p>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Publicando...' : 'Responder'}
        </Button>
      </div>
      {state.status === 'error' && (
        <p className="m-0 text-[12px] text-st-failed-fg" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
