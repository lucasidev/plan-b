import { FallbackLink } from '@/components/layout/fallback-link';
import type { DataHighlight } from '../lib/data-highlights';

/**
 * "Lo que los datos dicen" (ADR-0096, maqueta aprobada, `V.explore().aside`): `.pb-section` con
 * el título como `.pb-eyebrow` y una `.pb-kv` de cinco líneas `k`/`v`/`src`. Va en las dos lentes
 * de Explorar, con los mismos datos.
 */
export function DataHighlights({ highlights }: { highlights: DataHighlight[] }) {
  return (
    <aside className="pb-section" aria-labelledby="data-highlights-heading">
      <h2 id="data-highlights-heading" className="pb-eyebrow">
        Lo que los datos dicen
      </h2>
      <div className="pb-kv">
        {highlights.map((highlight) => (
          <HighlightRow key={highlight.id} highlight={highlight} />
        ))}
      </div>
    </aside>
  );
}

/**
 * Una línea `k`/`v`/`src`. El link a la regla de un derivado (ADR-0090) va antes de `summary.source`
 * (`facts[0].derivedTag`, no `summary`, porque `summary` es texto plano sin links embebidos).
 */
function HighlightRow({ highlight }: { highlight: DataHighlight }) {
  const { summary } = highlight;
  const derivedTag = highlight.facts.find(
    (fact) => fact.tier === 'primary' && fact.derivedTag,
  )?.derivedTag;

  return (
    <div>
      <div className="pb-k">{highlight.label}</div>
      <div className="pb-v">
        {summary.href ? (
          <FallbackLink href={summary.href} prefetch={false} className="pb-link">
            {summary.name}
          </FallbackLink>
        ) : (
          summary.name
        )}
        {summary.annotation && (
          <small className="pb-muted font-sans text-[13px]"> {summary.annotation}</small>
        )}
      </div>
      {(summary.source || derivedTag) && (
        <div className="pb-src pb-meta">
          {derivedTag && (
            <>
              <FallbackLink href={derivedTag.href} prefetch={false} className="pb-link">
                {derivedTag.label}
              </FallbackLink>
              {summary.source ? ' · ' : ''}
            </>
          )}
          {summary.source}
        </div>
      )}
    </div>
  );
}
