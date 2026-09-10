'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { CurrentInstrument } from '@/components/instrument';
import { deleteReviewAction } from '../actions';
import type { MyReview } from '../types';
import { ReviewEditor } from './review-editor';

/**
 * Mis aportes (US-165, US-166): lo que esta cuenta reseñó, para poder corregirlo o borrarlo.
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
  reviews: MyReview[];
  instrument: CurrentInstrument | null;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  // Lo borrado sale de la lista acá mismo, sin esperar a que el servidor vuelva a contestar.
  //
  // No es un adorno: el borrado responde 204 y el refresh que sigue lee por otra conexión, así que
  // hay una ventana en la que esa lectura todavía devuelve la reseña recién borrada. Cuando eso
  // pasaba, el panel de confirmación se cerraba y la tarjeta seguía ahí: al que borró le queda que
  // no pasó nada, y lo más probable es que lo intente otra vez y reciba «esa reseña ya no está».
  // Lo vio el E2E del deshacer, con el 204 y el read siguiente en el log del backend.
  const [removed, setRemoved] = useState<string[]>([]);
  const visible = reviews.filter((review) => !removed.includes(review.id));

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-bg-card p-6">
        <p className="mb-1.5 font-serif text-[19px] font-semibold leading-tight text-ink">
          Todavía no reseñaste ninguna cursada.
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
          Lo que reseñes acá se publica solo en conteos, junto con lo de los demás. Nunca se muestra
          una reseña sola, ni con tu nombre ni sin él.
        </p>
        <Link
          href="/reviews/new"
          className="inline-block rounded-lg px-3.5 py-[9px] text-[13px] font-medium"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          Reseñar una cursada
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((review) =>
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
            instrument={instrument}
            canEdit={instrument !== null}
            onEdit={() => setEditing(review.id)}
            onRemoved={() => setRemoved((prev) => [...prev, review.id])}
          />
        ),
      )}
    </div>
  );
}

/** Mismo código que usa el backend (`PublishingRules.OutcomeItemCode`) y `ReviewForm` en Reseñar. */
const COURSE_OUTCOME_ITEM_CODE = 'COURSE_OUTCOME';

/**
 * La etiqueta del desenlace declarado, si la reseña lo contestó y el instrumento vigente todavía
 * trae esa frase: mismo mapeo opción → etiqueta que usa `ReviewEditor` para dibujar las preguntas,
 * pero de solo lectura. Sin instrumento, sin la frase, o sin esa respuesta, no hay nada que traducir.
 */
function courseOutcomeLabel(review: MyReview, instrument: CurrentInstrument | null): string | null {
  const item = instrument?.items.find((i) => i.code === COURSE_OUTCOME_ITEM_CODE);
  const answer = review.answers.find((a) => a.itemCode === COURSE_OUTCOME_ITEM_CODE);
  if (!item || !answer) return null;
  return item.options.find((option) => option.value === answer.optionValue)?.label ?? null;
}

/**
 * Por cada frase que respondiste en esa cátedra, la opción que elegiste y las voces que suma ahora
 * (US-162, SC-018: "ahora 22 de 42 voces"). El desenlace (`COURSE_OUTCOME`) ya tiene su propia
 * línea arriba y no se repite acá: no es una frase de la ficha, es el registro de cómo terminaste.
 *
 * Sin cátedra declarada no hay tally al que atribuirle voces a ninguna frase (el backend las deja
 * en null), así que la lista sale vacía y no se dibuja nada: mejor nada que un número inventado.
 */
function VoicesList({
  review,
  instrument,
}: {
  review: MyReview;
  instrument: CurrentInstrument | null;
}) {
  const lines = review.answers.flatMap((answer) => {
    if (answer.itemCode === COURSE_OUTCOME_ITEM_CODE) return [];
    if (answer.optionVoices === null || answer.itemTotalVoices === null) return [];

    const item = instrument?.items.find((i) => i.code === answer.itemCode);
    const optionLabel = item?.options.find((o) => o.value === answer.optionValue)?.label;
    if (!item || !optionLabel) return [];

    return [
      {
        itemCode: answer.itemCode,
        text: item.text,
        optionLabel,
        optionVoices: answer.optionVoices,
        itemTotalVoices: answer.itemTotalVoices,
      },
    ];
  });

  if (lines.length === 0) return null;

  return (
    <ul className="mb-3 flex flex-col gap-1 border-l-2 border-line pl-3">
      {lines.map((line) => (
        <li key={line.itemCode} className="text-[12.5px] leading-relaxed text-ink-3">
          {line.text} <span className="text-ink-2">{line.optionLabel}</span>: ahora suma{' '}
          {line.optionVoices} de {line.itemTotalVoices}{' '}
          {line.itemTotalVoices === 1 ? 'voz' : 'voces'}.
        </li>
      ))}
    </ul>
  );
}

function ReviewCard({
  review,
  instrument,
  canEdit,
  onEdit,
  onRemoved,
}: {
  review: MyReview;
  instrument: CurrentInstrument | null;
  canEdit: boolean;
  onEdit: () => void;
  onRemoved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outcomeLabel = courseOutcomeLabel(review, instrument);

  function remove() {
    startTransition(async () => {
      const result = await deleteReviewAction(review.id);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      setConfirming(false);
      // Primero se saca de la vista, y después se pide la lista de nuevo: el refresh trae los
      // conteos al día, pero no puede ser lo que decide si la tarjeta desaparece.
      //
      // Por eso este sitio se queda con `router.refresh()` y no pasa a `reloadAfterMutation`
      // (`lib/reload-after-mutation.ts`) como Mi perfil y Corregir, aunque comparte el mismo fallo
      // bajo carga (issue #491): acá lo que ve la persona (la tarjeta desapareciendo) ya lo decide
      // el estado local de arriba, no este refresh. Si el commit se pierde, lo único que queda
      // stale son los conteos de las tarjetas hermanas, no el borrado. Un reload completo forzaría
      // el commit, pero también volvería a la carrera contra la lectura eventual del backend que
      // `onRemoved` existe para tapar (ver su comentario): la reseña recién borrada podría
      // reaparecer un instante, que es justo lo que el E2E del deshacer verificó que no pasara.
      onRemoved();
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

      {outcomeLabel && (
        <p className="mb-3 text-[12.5px] text-ink-3">
          Cómo terminó: {outcomeLabel}. Esto es tu registro. No se publica: en la ficha se ve solo
          el conteo.
        </p>
      )}

      <VoicesList review={review} instrument={instrument} />

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
