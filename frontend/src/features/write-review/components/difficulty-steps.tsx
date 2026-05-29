'use client';

import { DIFFICULTY_LABELS } from '../data/mocks';

/**
 * Campo 2 del editor (US-049): dificultad 1..5 steps. Espejo de `V2Steps` del canvas.
 *
 *  - 5 cards en grid columns. Cada una: número grande arriba (mono), label corta abajo.
 *  - Estados visuales:
 *    - Step seleccionado: borde accent + bg accent-soft + ink fuerte + 600.
 *    - Steps "llenos" hasta el seleccionado: bg-bg-elev (visualmente "consumidos"), ink.
 *    - Steps siguientes: bg-bg-card + ink-3 (apagados).
 *  - Implementación: fieldset + 5 inputs radio visualmente ocultos + label envolvente.
 *
 * Valor 0 = "no elegido"; el schema bloquea el submit con difficulty < 1.
 */
export function DifficultySteps({
  value,
  onChange,
  fieldId,
}: {
  value: number;
  onChange: (v: number) => void;
  fieldId: string;
}) {
  const groupName = `${fieldId}-radio`;
  return (
    <div className="mt-3.5">
      <fieldset
        id={fieldId}
        className="m-0 grid gap-1.5 border-0 p-0"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        <legend className="sr-only">Dificultad</legend>
        {DIFFICULTY_LABELS.map((label, i) => {
          const v = i + 1;
          const isSelected = v === value;
          const isFilled = v <= value;
          return (
            <label
              key={v}
              className="cursor-pointer rounded px-2 py-2.5 text-[11.5px] transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-accent"
              style={{
                border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-line)'}`,
                background: isSelected
                  ? 'var(--color-accent-soft)'
                  : isFilled
                    ? 'var(--color-bg-elev)'
                    : 'var(--color-bg-card)',
                color: isFilled ? 'var(--color-ink)' : 'var(--color-ink-3)',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <input
                type="radio"
                name={groupName}
                value={v}
                checked={isSelected}
                onChange={() => onChange(v)}
                className="sr-only"
              />
              <div className="mb-0.5 font-mono text-[13px]">{v}</div>
              <div className="leading-tight">{label}</div>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
