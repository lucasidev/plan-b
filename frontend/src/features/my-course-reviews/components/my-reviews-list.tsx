'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { CurrentInstrument } from '@/components/instrument';
import { deleteCourseReviewAction } from '../actions';
import type { MyCourseReview } from '../types';
import { ReviewEditor } from './review-editor';

/**
 * Mis aportes (US-165, US-166): lo que esta cuenta contó, para poder corregirlo o borrarlo.
 *
 * Es el único lugar del producto donde una reseña se ve de a una, y solo la ve quien la escribió.
 * Todo lo que se publica es agregado: la ficha nunca muestra una reseña individual, ni siquiera
 * anónima.
 *
 * Borrar mueve los conteos de las fichas hacia atrás, y la pantalla lo dice antes de confirmar en
 * vez de esconderlo: es el mecanismo por el que alguien saca algo antes de darse de baja, así que
 * tiene que entenderse que hace exactamente eso.
 */
export function MyReviewsList({
  reviews,
  instrument,
}: {
  reviews: MyCourseReview[];
  instrument: CurrentInstrument | null;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-bg-card p-6">
        <p className="mb-1.5 font-serif text-[19px] font-semibold leading-tight text-ink">
          Todavía no contaste ninguna cursada.
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
          Lo que cuentes acá se publica solo en conteos, junto con lo de los demás. Nunca se muestra
          una reseña sola, ni con tu nombre ni sin él.
        </p>
        <Link
          href="/reviews/new"
          className="inline-block rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          Contar una cursada
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {reviews.map((review) =>
        editing === review.id && instrument ? (
          <ReviewEditor
            key={review.id}
            review={review}
            instrument={instrument}
            onClose={() => setEditing(null)}
          />
        ) : (
          <ReviewCard
            key={review.id}
            review={review}
            canEdit={instrument !== null}
            onEdit={() => setEditing(review.id)}
          />
        ),
      )}
    </div>
  );
}

function ReviewCard({
  review,
  canEdit,
  onEdit,
}: {
  review: MyCourseReview;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      const result = await deleteCourseReviewAction(review.id);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-line bg-bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[17px] font-semibold text-ink">
          <Link href={`/subjects/${review.subjectId}`} className="underline underline-offset-2">
            {review.subjectName}
          </Link>
        </h2>
        <span
          className="shrink-0 text-[11px] text-ink-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {review.termLabel}
        </span>
      </div>

      <p className="mb-3 text-[12.5px] text-ink-3">
        {review.chairId && review.chairName ? (
          <Link href={`/chairs/${review.chairId}`} className="underline underline-offset-2">
            Cátedra {review.chairName}
          </Link>
        ) : (
          'Sin cátedra declarada'
        )}
        {' · '}
        {review.answeredItems}{' '}
        {review.answeredItems === 1 ? 'pregunta contestada' : 'preguntas contestadas'}
      </p>

      {review.freeText && (
        <p className="mb-3 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-2">
          {review.freeText}
          <span className="mt-1 block text-[11px] text-ink-4">
            Esto no se publica: lo lee el equipo para descubrir qué falta preguntar.
          </span>
        </p>
      )}

      {confirming ? (
        <div className="rounded-lg border border-line bg-bg-elev p-3">
          <p className="mb-2 text-[13px] leading-relaxed text-ink">
            Si la borrás, sus respuestas dejan de contar y los conteos de la ficha se mueven hacia
            atrás. No se puede deshacer.
          </p>
          {error && <p className="mb-2 text-[12.5px] text-alarm-ink">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
              style={{ background: 'var(--color-alarm)', color: 'var(--color-bg-card)' }}
            >
              {pending ? 'Borrando...' : 'Sí, borrarla'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-2"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={!canEdit}
            className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink disabled:opacity-50"
          >
            Corregir
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg px-3 py-1.5 text-[12.5px] text-ink-3 hover:text-alarm-ink"
          >
            Borrar
          </button>
        </div>
      )}
    </article>
  );
}
