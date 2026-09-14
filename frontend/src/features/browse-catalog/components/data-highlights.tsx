import Link from 'next/link';
import type { DataHighlight } from '../lib/data-highlights';

/**
 * "Lo que los datos dicen" (ADR-0096, maqueta aprobada): la tira compacta `kv` de Explorar, una
 * línea por highlight con su etiqueta, el nombre corto (institución o carrera) con su aclaración
 * atenuada al lado, y una sola línea chica de fuente + lo secundario. Nunca un número compuesto ni
 * un promedio (THESIS, "Qué publicamos" 3 y 8).
 */
export function DataHighlights({ highlights }: { highlights: DataHighlight[] }) {
  return (
    <aside aria-labelledby="data-highlights-heading" className="flex flex-col gap-1">
      <h2 id="data-highlights-heading" className="font-display text-[15px] font-semibold text-ink">
        Lo que los datos dicen
      </h2>
      <dl className="flex flex-col">
        {highlights.map((highlight) => (
          <HighlightRow key={highlight.id} highlight={highlight} />
        ))}
      </dl>
    </aside>
  );
}

/**
 * Una línea `k`/`v`/`src`: el link a la regla de un derivado (ADR-0090) se busca en la fact
 * primaria porque `summary` es texto plano, no JSX con links embebidos.
 */
function HighlightRow({ highlight }: { highlight: DataHighlight }) {
  const { summary } = highlight;
  const derivedTag = highlight.facts.find(
    (fact) => fact.tier === 'primary' && fact.derivedTag,
  )?.derivedTag;

  return (
    <div className="border-t border-line-2 py-2.5 first:border-t-0 first:pt-0">
      <dt className="text-[11px] text-ink-3">{highlight.label}</dt>
      <dd className="mt-0.5 font-serif text-[17px] leading-snug text-ink">
        {summary.href ? (
          <Link href={summary.href} prefetch={false} className="hover:underline">
            {summary.name}
          </Link>
        ) : (
          summary.name
        )}
        {summary.annotation && (
          <span className="ml-1.5 font-sans text-[13px] text-ink-3">{summary.annotation}</span>
        )}
      </dd>
      {(summary.source || derivedTag) && (
        <p className="mt-0.5 text-[11px] text-ink-3">
          {summary.source}
          {derivedTag && (
            <>
              {summary.source ? ' · ' : ''}
              <Link
                href={derivedTag.href}
                prefetch={false}
                className="text-accent-ink underline-offset-2 hover:underline"
              >
                {derivedTag.label}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
