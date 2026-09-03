'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { type CurrentInstrument, ItemQuestion } from '@/components/instrument';
import { reviseReviewAction } from '../actions';
import type { MyReview } from '../types';

/**
 * Corregir una reseña propia (US-165, SC-017).
 *
 * No deja cambiar materia, período ni cátedra: esa terna **es** la identidad de la reseña (una voz
 * por cuenta, materia y período), así que cambiarla no sería corregir sino reseñar otra cursada.
 * Lo que se corrige son las respuestas.
 *
 * Saltear sigue valiendo, y acá vale doble: se puede contestar algo que se había salteado, y
 * también **dejar de contestar** algo. En ese caso la respuesta desaparece y su frase vuelve a no
 * contarla en el denominador. Por eso el formulario manda el set completo y no un delta.
 *
 * Y como en la pantalla de reseñar, ninguna opción se pinta de alarma mientras se responde.
 */
export function ReviewEditor({
  review,
  instrument,
  onClose,
}: {
  review: MyReview;
  instrument: CurrentInstrument;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Arranca con lo que ya había contestado. El read que sirve esta pantalla es el único que
  // devuelve respuestas de a una, y solo hacia su autor: sin eso, corregir una sola obligaría a
  // contestar las catorce de nuevo, y nadie corrige nada con ese precio.
  const [answers, setAnswers] = useState<Record<string, number>>(() =>
    Object.fromEntries(review.answers.map((a) => [a.itemCode, a.optionValue])),
  );
  const [freeText, setFreeText] = useState(review.freeText ?? '');

  function answer(itemCode: string, optionValue: number) {
    setAnswers((prev) => ({ ...prev, [itemCode]: optionValue }));
  }

  function skip(itemCode: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[itemCode];
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await reviseReviewAction(
        review.id,
        answers,
        freeText.trim().length > 0 ? freeText : null,
      );
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <article className="rounded-xl border-2 border-ink bg-bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[17px] font-semibold text-ink">{review.subjectName}</h2>
        <span
          className="shrink-0 text-[11px] text-ink-3"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {review.termLabel}
        </span>
      </div>

      <p className="mb-4 text-[12.5px] leading-relaxed text-ink-3">
        Está cargado lo que contestaste. Cambiá lo que quieras, contestá algo que hayas salteado, o
        sacá una con «borrar»: lo que saques deja de contar y los conteos de la ficha se mueven en
        consecuencia.
      </p>

      <div className="mb-4">
        {instrument.items.map((item) => (
          <ItemQuestion
            key={item.code}
            item={item}
            value={answers[item.code]}
            onAnswer={answer}
            onSkip={skip}
          />
        ))}
      </div>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[13px] text-ink">
          ¿Algo más que quieras decir? (no se publica)
        </span>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] text-ink"
        />
      </label>

      {error && (
        <p role="alert" className="mb-3 text-[13px] text-alarm-ink">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending || answeredCount === 0}
          className="rounded-lg px-3.5 py-[9px] text-[13px] font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          {pending ? 'Guardando...' : 'Guardar la corrección'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-lg border border-line px-3 py-[9px] text-[13px] text-ink-2"
        >
          Cancelar
        </button>
        <span className="ml-auto text-[11px] text-ink-4" style={{ fontFamily: 'var(--font-mono)' }}>
          {answeredCount} de {instrument.items.length}
        </span>
      </div>
    </article>
  );
}
