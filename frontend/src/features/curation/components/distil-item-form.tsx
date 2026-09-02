'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { distilItemAction } from '../actions';
import { ITEM_LAYERS, ITEM_SUBJECTS, OPTION_VALENCES } from '../schema';
import { initialDistilItemState } from '../types';

/** Cómo se lee cada capa, sujeto y valencia. El valor es código; la etiqueta, lo que se ve. */
const LAYER_LABELS: Record<(typeof ITEM_LAYERS)[number], string> = {
  Context: 'Contexto de la cursada',
  ChairConduct: 'Qué hizo la cátedra',
  StudentExperience: 'Qué te pasó a vos',
};

const SUBJECT_LABELS: Record<(typeof ITEM_SUBJECTS)[number], string> = {
  Chair: 'De la cátedra',
  Subject: 'De la materia',
};

const VALENCE_LABELS: Record<(typeof OPTION_VALENCES)[number], string> = {
  None: 'sin valencia',
  Positive: 'buena',
  Neutral: 'neutra',
  Negative: 'mala',
};

type DraftOption = { label: string; valence: (typeof OPTION_VALENCES)[number] };

const EMPTY_OPTIONS: DraftOption[] = [
  { label: '', valence: 'Positive' },
  { label: '', valence: 'Negative' },
];

/**
 * Destilar una pregunta del campo libre (ADR-0084): si mucha gente escribe variaciones de lo mismo,
 * eso se convierte en una pregunta cerrada y entra al instrumento como versión nueva.
 *
 * El campo y el submit esperan la hidratación (`useHydrated`). Sin eso el browser manda el form
 * como POST nativo: la pregunta se crea y el resultado nunca llega al estado del cliente.
 */
export function DistilItemForm() {
  const [state, action, pending] = useActionState(distilItemAction, initialDistilItemState);
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const [options, setOptions] = useState<DraftOption[]>(EMPTY_OPTIONS);

  // Se limpia el form y nada más: lo que esta pantalla muestra son textos libres, y destilar no
  // los cambia. La pregunta nueva se ve en Método y al reseñar, no acá.
  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    setOptions(EMPTY_OPTIONS);
  }, [state.status]);

  const disabled = pending || !hydrated;

  return (
    <form ref={formRef} action={action} className="rounded-lg border border-line bg-bg-card p-4">
      <p className="mb-1 text-[13px] font-medium text-ink">Destilar una pregunta</p>
      <p className="mb-3 text-[11.5px] leading-relaxed text-ink-3">
        Entra al cuestionario como versión nueva y arranca su propia serie: lo que se responda desde
        ahora se cuenta bajo esta pregunta, sin compararse con lo de antes, que no la tenía.
      </p>

      {/* Las opciones son un array de largo variable y FormData no lo expresa sin inventar una
          convención de nombres, así que viajan como JSON en un campo. */}
      <input
        type="hidden"
        name="options"
        value={JSON.stringify(
          options.map((option, index) => ({
            value: index + 1,
            order: index + 1,
            label: option.label,
            valence: option.valence,
          })),
        )}
      />

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <Field label="Código" htmlFor="distil-code">
          <input
            id="distil-code"
            name="code"
            required
            maxLength={60}
            disabled={disabled}
            placeholder="CHAIR_EXAM_SCOPE"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[12.5px] text-ink disabled:opacity-60"
          />
        </Field>

        <Field label="Capa" htmlFor="distil-layer">
          <select
            id="distil-layer"
            name="layer"
            required
            disabled={disabled}
            defaultValue="ChairConduct"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
          >
            {ITEM_LAYERS.map((layer) => (
              <option key={layer} value={layer}>
                {LAYER_LABELS[layer]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="La pregunta" htmlFor="distil-text">
        <input
          id="distil-text"
          name="text"
          required
          maxLength={200}
          disabled={disabled}
          placeholder="¿Sabías con qué se rendía el final?"
          className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] text-ink disabled:opacity-60"
        />
      </Field>

      <Field label="De qué habla" htmlFor="distil-subject">
        <select
          id="distil-subject"
          name="subject"
          required
          disabled={disabled}
          defaultValue="Chair"
          className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
        >
          {ITEM_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {SUBJECT_LABELS[subject]}
            </option>
          ))}
        </select>
      </Field>

      <p className="mb-1.5 text-[11.5px] text-ink-3">
        Las opciones, en el orden en que se van a leer. La valencia decide qué se pinta de alarma en
        la ficha, y por eso se elige acá y no al responder.
      </p>
      <div className="mb-3 flex flex-col gap-2">
        {options.map((option, index) => (
          // El índice es la identidad: son posiciones de una lista ordenada que se edita en el
          // lugar, no entidades con id propio.
          // biome-ignore lint/suspicious/noArrayIndexKey: la posición es la identidad
          <div key={index} className="flex gap-2">
            <input
              aria-label={`Etiqueta de la opción ${index + 1}`}
              value={option.label}
              disabled={disabled}
              maxLength={80}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((o, i) => (i === index ? { ...o, label: e.target.value } : o)),
                )
              }
              placeholder={index === 0 ? 'Sí' : 'No'}
              className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
            />
            <select
              aria-label={`Valencia de la opción ${index + 1}`}
              value={option.valence}
              disabled={disabled}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((o, i) =>
                    i === index ? { ...o, valence: e.target.value as DraftOption['valence'] } : o,
                  ),
                )
              }
              className="rounded-lg border border-line bg-bg px-2 py-2 text-[12.5px] text-ink disabled:opacity-60"
            >
              {OPTION_VALENCES.map((valence) => (
                <option key={valence} value={valence}>
                  {VALENCE_LABELS[valence]}
                </option>
              ))}
            </select>
            {options.length > 2 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                className="rounded-lg px-2 text-[12px] text-ink-3 hover:text-ink disabled:opacity-60"
              >
                Sacar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOptions((prev) => [...prev, { label: '', valence: 'Neutral' }])}
          className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-2 hover:text-ink disabled:opacity-60"
        >
          Sumar opción
        </button>

        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          {pending ? 'Destilando…' : 'Destilar'}
        </button>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="mt-2.5 text-[12.5px] text-accent-ink">
          {state.message}
        </p>
      )}
      {state.status === 'success' && (
        <p role="status" className="mt-2.5 text-[12.5px] text-ink-2">
          Lista: <span className="font-mono">{state.code}</span> entró en la versión{' '}
          {state.instrumentVersion} del cuestionario.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[12.5px] text-ink-2">
        {label}
      </label>
      {children}
    </div>
  );
}
