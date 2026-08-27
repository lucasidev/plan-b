'use client';

import type { InstrumentItem } from './types';

type ItemQuestionProps = {
  item: InstrumentItem;
  value: number | undefined;
  onAnswer: (itemCode: string, optionValue: number) => void;
  onSkip: (itemCode: string) => void;
};

/**
 * Una pregunta del cuestionario con sus opciones (US-146).
 *
 * Ninguna opción se pinta de alarma, aunque el catálogo sepa cuál es la negativa: alarmar es
 * lectura, de la ficha, y teñir una opción mientras alguien responde es sugerirle la respuesta.
 * Por eso el endpoint del cuestionario ni siquiera manda la valencia.
 *
 * Saltear es una salida visible y sin costo: quien saltea no cuenta en el denominador de este
 * ítem, y el producto se apoya en eso en vez de exigir respuestas (ADR-0082).
 */
export function ItemQuestion({ item, value, onAnswer, onSkip }: ItemQuestionProps) {
  const answered = value !== undefined;

  return (
    <fieldset className="border-t border-line-2 py-4 first:border-t-0">
      <legend className="sr-only">{item.text}</legend>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-ink">{item.text}</p>
        {answered ? (
          <button
            type="button"
            onClick={() => onSkip(item.code)}
            className="shrink-0 font-mono text-[10.5px] text-ink-4 underline decoration-dashed underline-offset-2 hover:text-ink-3"
          >
            borrar
          </button>
        ) : null}
      </div>
      {item.help ? <p className="mb-3 text-[13px] text-ink-3">{item.help}</p> : null}
      <div className="flex flex-wrap gap-2">
        {item.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onAnswer(item.code, option.value)}
              className={
                selected
                  ? 'rounded-pill border border-ink bg-ink px-4 py-2.5 text-[13px] font-medium text-bg-card'
                  : 'rounded-pill border border-line bg-bg-card px-4 py-2.5 text-[13px] text-ink hover:border-ink-3'
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
