'use client';

import { useState } from 'react';
import { RATING_LABELS } from '../data/mocks';

/**
 * Campo 1 del editor (US-049): rating general 1..5 estrellas. Espejo del mockup.
 *
 *  - 5 estrellas que llenan accent al pasar el mouse o al elegir.
 *  - Label semántica al lado (mala/regular/aceptable/buena/excelente) en mono.
 *  - Hover state preview; al salir vuelve al valor seleccionado.
 *  - Implementación: `<fieldset>` con 5 `<input type="radio">` visualmente ocultos +
 *    `<label>` envolvente. Da semántica radio real (screen readers anuncian "1 of 5
 *    selected"), teclado nativo (flechas / Tab), sin role+aria-checked manual.
 *
 * Valor 0 = "no elegido" (sentinel); el schema bloquea el submit con rating < 1.
 */
export function StarRatingInput({
  value,
  onChange,
  fieldId,
}: {
  value: number;
  onChange: (v: number) => void;
  fieldId: string;
}) {
  const [hover, setHover] = useState(0);
  const displayed = hover || value;
  const label = displayed >= 1 && displayed <= 5 ? RATING_LABELS[displayed] : '';
  const groupName = `${fieldId}-radio`;

  return (
    <div className="mt-3.5 flex items-center gap-3.5">
      <fieldset
        id={fieldId}
        className="m-0 flex gap-1 border-0 p-0"
        onMouseLeave={() => setHover(0)}
      >
        <legend className="sr-only">Calificación general</legend>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = displayed >= n;
          return (
            <label
              key={n}
              className="appearance-none border-none bg-transparent px-1 py-0.5 text-[34px] leading-none transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1"
              style={{
                color: filled ? 'var(--color-accent)' : 'var(--color-line)',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHover(n)}
            >
              <input
                type="radio"
                name={groupName}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                className="sr-only"
              />
              <span aria-hidden="true">★</span>
              <span className="sr-only">
                {n} estrella{n > 1 ? 's' : ''}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="min-h-[1.2em] min-w-[78px] border-l border-line pl-2 font-mono text-[13px] text-ink-2">
        {label}
      </div>
    </div>
  );
}
