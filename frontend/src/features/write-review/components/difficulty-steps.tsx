'use client';

import { DIFFICULTY_LABELS } from '../data/mocks';

/**
 * Editor field 2 (US-049): difficulty, 1..5 steps. Mirrors `V2Steps` in the canvas.
 *
 *  - 5 grid columns. Each cell: large number on top (mono), short label below.
 *  - Visual states:
 *    - Selected step: accent border + accent-soft bg + strong ink + 600.
 *    - "Filled" steps up to the selected one: bg-bg-elev ("consumed"), ink.
 *    - Following steps: bg-bg-card + ink-3 (muted).
 *  - Implementation: fieldset + 5 visually hidden radio inputs + enclosing labels.
 *
 * Value 0 means "unset"; the schema blocks the submit when difficulty < 1.
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
