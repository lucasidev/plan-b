'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { formatRelativeDate } from '@/lib/format-date';
import { editTeacherResponseAction } from '../actions';
import { initialRespondState } from '../types';

type Props = {
  reviewId: string;
  authorName: string | null;
  text: string;
  createdAt: string | null;
  updatedAt: string | null;
  /** El viewer es el docente verificado de esta reseña: puede editar su respuesta (US-041). */
  canEdit: boolean;
};

/**
 * Muestra la respuesta del docente (US-040) y, si el viewer es el docente verificado, permite
 * editarla inline (US-041). "editada" aparece cuando updatedAt > createdAt. Mutación pura
 * (ADR-0046): al guardar hace router.refresh() para re-renderizar con el texto nuevo.
 */
export function TeacherResponseView({
  reviewId,
  authorName,
  text,
  createdAt,
  updatedAt,
  canEdit,
}: Props) {
  const router = useRouter();
  const fieldId = useId();
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    editTeacherResponseAction,
    initialRespondState,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reaccionamos al cambio de status.
  useEffect(() => {
    if (state.status !== 'success') return;
    setEditing(false);
    router.refresh();
  }, [state]);

  const edited = Boolean(updatedAt && createdAt && updatedAt !== createdAt);

  return (
    <div className="mt-1 rounded-md border-l-2 border-accent bg-bg-elev px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-ink">{authorName}</span>
        <VerifiedBadge kind="teacher" />
        {createdAt && (
          <span className="font-mono text-[10.5px] text-ink-3">
            · {formatRelativeDate(createdAt)}
          </span>
        )}
        {edited && <span className="font-mono text-[10.5px] text-ink-4">· editada</span>}
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto font-mono text-[10.5px] text-accent-ink underline-offset-2 hover:underline"
          >
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <form action={formAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="reviewId" value={reviewId} />
          <textarea
            id={fieldId}
            name="text"
            required
            minLength={50}
            maxLength={2000}
            rows={3}
            defaultValue={text}
            aria-label="Editar tu respuesta"
            className="w-full resize-y rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          {state.status === 'error' && (
            <p className="m-0 text-[12px] text-st-failed-fg" role="alert">
              {state.message}
            </p>
          )}
        </form>
      ) : (
        <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-2">{text}</p>
      )}
    </div>
  );
}
