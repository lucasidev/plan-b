'use client';

import { REVIEW_TAGS } from '../data/mocks';

/**
 * Campo 4 del editor (US-049): tags rápidos en chip selector múltiple. Espejo del mockup.
 *
 *  - Tags vienen del set fijo en `mocks.REVIEW_TAGS` (marcado como ejemplo en ADR-0041;
 *    la taxonomy definitiva aterriza en otra US).
 *  - Click → toggle. Visualmente: chip pill, on = border accent + bg accent-soft + ink
 *    accent, prefijo ✓; off = border-line + bg-bg-card + ink-2.
 *  - Implementación: cada chip es un `<label>` con un `<input type="checkbox">` visualmente
 *    oculto (sr-only). Esto da semántica de checkbox real al markup, con teclado nativo
 *    (Space) y screen readers que anuncian "checked / not checked" sin ARIA forzada.
 *  - Cap de 12 tags max (enforced por schema). El UI no fuerza el cap visualmente porque el
 *    set actual son 12 tags exactos; si llega más, el zod rebota al submit.
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
