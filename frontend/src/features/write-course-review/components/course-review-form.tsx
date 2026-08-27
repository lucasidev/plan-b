'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { ItemQuestion } from '@/components/instrument';
import { publishCourseReviewAction } from '../actions';
import type {
  AnswerDraft,
  ChairOption,
  CurrentInstrument,
  ItemLayer,
  SubjectOption,
  TermOption,
} from '../types';
import { initialPublishState } from '../types';

type CourseReviewFormProps = {
  instrument: CurrentInstrument;
  subjects: readonly SubjectOption[];
  terms: readonly TermOption[];
};

/** Los tres bloques del cuestionario, en el orden en que se preguntan. */
const BLOCKS: readonly { layer: ItemLayer; step: string; title: string; note?: string }[] = [
  {
    layer: 'Context',
    step: 'Paso 3',
    title: 'Cómo terminó',
    note: 'Esto no se publica con tu reseña: sirve para leer bien los números.',
  },
  { layer: 'ChairConduct', step: 'Paso 4', title: 'Qué hizo la cátedra' },
  { layer: 'StudentExperience', step: 'Paso 5', title: 'Qué te pasó a vos' },
];

/**
 * La pantalla Reseñar, entera (US-146, SC-015). Un formulario de corrido: elegís la cursada,
 * contestás lo que quieras contestar, y antes de enviar leés qué se publica y qué no.
 *
 * El estado vive acá y no en el servidor: no hay borrador persistido todavía, así que recargar
 * pierde lo escrito. Es una limitación conocida y declarada en la ficha de la pantalla; el
 * borrador retomable es trabajo propio y no entró al alcance.
 */
export function CourseReviewForm({ instrument, subjects, terms }: CourseReviewFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    publishCourseReviewAction,
    initialPublishState,
  );

  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [chairId, setChairId] = useState<string | null>(null);
  const [chairs, setChairs] = useState<readonly ChairOption[]>([]);
  const [answers, setAnswers] = useState<AnswerDraft>({});
  const [freeText, setFreeText] = useState('');
  const [query, setQuery] = useState('');

  // Las cátedras dependen de la materia: hasta elegirla no se sabe cuáles mirar. Se piden al
  // cliente por eso, no por preferencia de arquitectura.
  useEffect(() => {
    if (!subjectId) {
      setChairs([]);
      setChairId(null);
      return;
    }
    let alive = true;
    fetch(`/api/academic/subjects/${subjectId}/chairs`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ChairOption[]) => {
        if (alive) {
          setChairs(data);
          setChairId(null);
        }
      })
      .catch(() => {
        if (alive) setChairs([]);
      });
    return () => {
      alive = false;
    };
  }, [subjectId]);

  useEffect(() => {
    if (state.status !== 'success') return;
    router.push('/reviews?published=1');
  }, [state, router]);

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects.slice(0, 8);
    return subjects
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [subjects, query]);

  const answeredCount = Object.keys(answers).length;
  const chosenSubject = subjects.find((s) => s.id === subjectId);
  const canSubmit = Boolean(subjectId) && Boolean(termId) && answeredCount > 0 && !pending;

  const payload = JSON.stringify({
    subjectId,
    termId,
    chairId,
    answers,
    freeText: freeText.trim().length > 0 ? freeText : null,
  });

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

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="payload" value={payload} />

      <header>
        <h1 className="font-serif text-[28px] leading-tight font-semibold text-ink">
          Contá tu cursada
        </h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Un minuto y medio. Saltear también vale, y nada sale con tu nombre.
        </p>
      </header>

      <section className="rounded-lg border border-line bg-bg-card p-4">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
          Paso 1 · Qué cursaste
        </p>
        <label htmlFor="subject-search" className="sr-only">
          Buscá la materia que cursaste
        </label>
        <input
          id="subject-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscala por nombre"
          className="mb-3 w-full rounded-sm border border-line bg-bg px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-4"
        />
        <ul className="flex flex-col gap-1.5">
          {filteredSubjects.map((subject) => {
            const selected = subject.id === subjectId;
            return (
              <li key={subject.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSubjectId(subject.id)}
                  className={
                    selected
                      ? 'flex w-full items-center justify-between rounded-sm border border-ink bg-bg-card px-3 py-2.5 text-left'
                      : 'flex w-full items-center justify-between rounded-sm border border-line bg-bg-card px-3 py-2.5 text-left hover:border-ink-3'
                  }
                >
                  <span className="text-[14px] text-ink">{subject.name}</span>
                  <span className="font-mono text-[10.5px] text-ink-3">
                    {subject.yearInPlan}° año
                  </span>
                </button>
              </li>
            );
          })}
          {filteredSubjects.length === 0 ? (
            <li className="py-2 text-[13px] text-ink-3">
              Ninguna materia de tu plan coincide con eso.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-bg-card p-4">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
          Paso 2 · Cuándo y con quién
        </p>
        <p className="mb-2 text-[14px] text-ink">¿Cuándo la cursaste?</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {terms.map((term) => (
            <button
              key={term.id}
              type="button"
              aria-pressed={term.id === termId}
              onClick={() => setTermId(term.id)}
              className={
                term.id === termId
                  ? 'rounded-pill border border-ink bg-ink px-4 py-2.5 text-[13px] font-medium text-bg-card'
                  : 'rounded-pill border border-line bg-bg-card px-4 py-2.5 text-[13px] text-ink hover:border-ink-3'
              }
            >
              {term.label}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[14px] text-ink">¿Con qué cátedra?</p>
        {!subjectId ? (
          <p className="text-[13px] text-ink-3">Elegí primero la materia.</p>
        ) : chairs.length === 0 ? (
          <p className="text-[13px] text-ink-3">
            Esta materia todavía no tiene cátedras cargadas. Tu reseña cuenta igual en la materia.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chairs.map((chair) => (
              <button
                key={chair.id}
                type="button"
                aria-pressed={chair.id === chairId}
                onClick={() => setChairId(chair.id)}
                className={
                  chair.id === chairId
                    ? 'rounded-pill border border-ink bg-ink px-4 py-2.5 text-[13px] font-medium text-bg-card'
                    : 'rounded-pill border border-line bg-bg-card px-4 py-2.5 text-[13px] text-ink hover:border-ink-3'
                }
              >
                {chair.name}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={chairId === null}
              onClick={() => setChairId(null)}
              className={
                chairId === null
                  ? 'rounded-pill border border-ink-3 bg-bg-elev px-4 py-2.5 text-[13px] text-ink'
                  : 'rounded-pill border border-line bg-bg-card px-4 py-2.5 text-[13px] text-ink-3 hover:border-ink-3'
              }
            >
              No me acuerdo
            </button>
          </div>
        )}
      </section>

      {BLOCKS.map((block) => {
        const items = instrument.items.filter((i) => i.layer === block.layer);
        if (items.length === 0) return null;
        return (
          <section key={block.layer} className="rounded-lg border border-line bg-bg-card p-4">
            <p className="mb-1 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
              {block.step} · {block.title}
            </p>
            {block.note ? <p className="mb-2 text-[12px] text-ink-3">{block.note}</p> : null}
            <div className="mt-2">
              {items.map((item) => (
                <ItemQuestion
                  key={item.code}
                  item={item}
                  value={answers[item.code]}
                  onAnswer={answer}
                  onSkip={skip}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-lg border border-line bg-bg-card p-4">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
          Paso 6 · Lo último
        </p>
        <label htmlFor="free-text" className="mb-2 block text-[14px] text-ink">
          ¿Algo que no te preguntamos y deberíamos?
        </label>
        <textarea
          id="free-text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Contalo con tus palabras…"
          className="w-full rounded-sm border border-line bg-bg px-3 py-2.5 text-[13px] text-ink placeholder:text-ink-4"
        />
        <p className="mt-2 text-[12px] text-ink-3">
          Esto no se publica: lo lee el equipo para mejorar las preguntas.
        </p>

        <ul className="mt-4 flex flex-col gap-2 border-t border-line-2 pt-3 text-[13.5px] text-ink">
          <li>Tus respuestas se suman al total de la cátedra.</li>
          <li>Nunca se muestra una reseña individual, ni cómo terminó nadie.</li>
          <li>Nadie de la facultad accede a quién respondió.</li>
        </ul>

        {state.status === 'error' ? (
          <p
            role="alert"
            className="mt-3 rounded-sm bg-alarm-soft px-3 py-2 text-[13px] text-alarm-ink"
          >
            {state.message}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-ink-3">
            {answeredCount} {answeredCount === 1 ? 'respuesta' : 'respuestas'}
            {chosenSubject ? ` · ${chosenSubject.name}` : ''}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-sm bg-ink px-5 py-2.5 text-[14px] font-medium text-bg-card disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Enviando…' : 'Enviar la reseña'}
          </button>
        </div>
      </section>
    </form>
  );
}
