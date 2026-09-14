import Link from 'next/link';
import type { DataHighlight, DataHighlightFact } from '../lib/data-highlights';

/**
 * "Lo que los datos dicen" (ADR-0096): la columna derecha de la lente de Universidades. Cinco
 * hechos de un solo dato oficial o de catálogo, cada uno con su fuente; nunca un número compuesto
 * ni un promedio (THESIS, "Qué publicamos" 3 y 8).
 */
export function DataHighlights({ highlights }: { highlights: DataHighlight[] }) {
  return (
    <aside aria-labelledby="data-highlights-heading" className="flex flex-col gap-4">
      <h2 id="data-highlights-heading" className="font-display text-[15px] font-semibold text-ink">
        Lo que los datos dicen
      </h2>
      {highlights.map((highlight) => (
        <div key={highlight.id} className="rounded-xl border border-line bg-bg-card p-4">
          <p className="mb-1.5 text-[11px] text-ink-3">{highlight.label}</p>
          <div className="flex flex-col gap-2">
            {highlight.facts.map((fact) => (
              <HighlightLine key={fact.text} fact={fact} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

/**
 * Una línea de un highlight. `tier` decide el estilo (nunca la posición en el array: dos hechos
 * empatados en el máximo se ven igual, ninguno "ganador" del otro). El período o la nota, y el
 * link a la regla cuando el hecho es derivado, van chicos debajo, como el resto de las fichas.
 */
function HighlightLine({ fact }: { fact: DataHighlightFact }) {
  const textClassName =
    fact.tier === 'primary'
      ? 'font-serif text-[15px] font-medium leading-snug text-ink'
      : 'text-[12px] leading-relaxed text-ink-3';
  const footer = [fact.sourceName, fact.period].filter(Boolean).join(' · ');

  return (
    <div>
      <p className={textClassName}>
        {fact.href ? (
          <Link href={fact.href} prefetch={false} className="hover:underline">
            {fact.text}
          </Link>
        ) : (
          fact.text
        )}
        {fact.links && <FactLinks links={fact.links} />}
      </p>
      {fact.derivedTag && (
        <p className="mt-0.5 text-[11px] text-ink-3">
          {'('}
          <Link
            href={fact.derivedTag.href}
            prefetch={false}
            className="text-accent-ink underline-offset-2 hover:underline"
          >
            {fact.derivedTag.label}
          </Link>
          {')'}
        </p>
      )}
      {footer && <p className="mt-0.5 text-[11px] text-ink-3">{footer}</p>}
    </div>
  );
}

/** Las instituciones de un grupo canónico, cada una linkeada a su propia oferta: "en A, B y C" (US-171: alfabético, ya lo trae `links`). */
function FactLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <>
      {' '}
      {links.map((link, index) => (
        <span key={link.href}>
          <Link
            href={link.href}
            prefetch={false}
            className="text-accent-ink underline-offset-2 hover:underline"
          >
            {link.label}
          </Link>
          {index < links.length - 2 ? ', ' : index === links.length - 2 ? ' y ' : ''}
        </span>
      ))}
    </>
  );
}
