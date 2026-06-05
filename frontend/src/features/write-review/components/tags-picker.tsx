'use client';

import { REVIEW_TAGS } from '../data/mocks';

/**
 * Editor field 4 (US-049): quick tags in a multi-chip selector. Mirrors the mockup.
 *
 *  - Tags come from the fixed set in `mocks.REVIEW_TAGS` (flagged as an example in
 *    ADR-0041; the final taxonomy lands in a separate US).
 *  - Click → toggle. Visually: pill chip, on = accent border + accent-soft bg + accent
 *    ink with a ✓ prefix; off = line border + bg-bg-card + ink-2.
 *  - Implementation: each chip is a `<label>` wrapping an sr-only `<input type="checkbox">`.
 *    Real checkbox semantics for the markup, native keyboard (Space) and screen readers
 *    announcing "checked / not checked" with no forced ARIA.
 *  - Cap at 12 tags (enforced by the schema). The UI does not enforce the cap visually
 *    because the current set is exactly 12; if more come in, Zod rejects at submit.
 */
export function TagsPicker({
  selected,
  onToggle,
  fieldId,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
  fieldId: string;
}) {
  const selectedSet = new Set(selected);
  return (
    <div className="mt-3.5">
      <fieldset id={fieldId} className="flex flex-wrap gap-1.5 border-0 p-0">
        <legend className="sr-only">Etiquetas de la cursada</legend>
        {REVIEW_TAGS.map((tag) => {
          const isOn = selectedSet.has(tag);
          return (
            <label
              key={tag}
              className="appearance-none cursor-pointer rounded-pill px-3 py-1.5 text-[12px] transition-all focus-within:outline-none focus-within:ring-2 focus-within:ring-accent"
              style={{
                border: `1px solid ${isOn ? 'var(--color-accent)' : 'var(--color-line)'}`,
                background: isOn ? 'var(--color-accent-soft)' : 'var(--color-bg-card)',
                color: isOn ? 'var(--color-accent-ink)' : 'var(--color-ink-2)',
              }}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => onToggle(tag)}
                className="sr-only"
              />
              {isOn && '✓ '}
              {tag}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
