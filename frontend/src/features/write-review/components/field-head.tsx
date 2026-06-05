/**
 * Header for each numbered editor field (US-049). Mirrors `V2FieldHead` in the canvas.
 *
 *  - Step number (mono, ink-3, 01..06).
 *  - Main label (ink-1, semibold).
 *  - Accent asterisk when required.
 *  - Optional hint below (ink-3, aligned with the label's left margin).
 *
 * Not a strong H tag: a row with number + label inside a card. The page has its own
 * `<h1>` ("Reseñá tu cursada"); the six field heads are visual form labels.
 */
export function FieldHead({
  n,
  label,
  hint,
  required,
  htmlFor,
}: {
  n: number;
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
}) {
  const numStr = n.toString().padStart(2, '0');
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
          {numStr}
        </span>
        <label htmlFor={htmlFor} className="flex-1 text-sm font-medium text-ink">
          {label}
          {required && (
            <span className="ml-1.5 text-accent" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(requerido)</span>}
        </label>
      </div>
      {hint && <p className="ml-6 mt-1 text-[11.5px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}
