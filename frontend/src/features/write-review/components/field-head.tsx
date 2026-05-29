/**
 * Header de cada campo numerado del editor (US-049). Espejo de `V2FieldHead` del canvas.
 *
 *  - Número de paso (mono, ink-3, 01..06).
 *  - Label principal (ink-1, semibold).
 *  - Asterisco accent si es required.
 *  - Hint opcional debajo (ink-3, alineada al margen del label).
 *
 * No es un H tag fuerte: es un row con número + label dentro de una card. La página tiene
 * un `<h1>` aparte ("Reseñá tu cursada"); los 6 campos son labels visuales del form.
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
