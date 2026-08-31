import Link from 'next/link';
import type { ReviewedChair } from '../lib/reviewed-chairs';

/**
 * Las cátedras que esta cuenta reseñó (US-231). Contesta la pregunta con la que alguien vuelve:
 * si lo que dijo ya publica o qué le falta.
 *
 * Las filas salen de `GET /api/reviews/cursadas/me` y el estado de cada cátedra de
 * `GET /api/reviews/chairs/mine`, que las devuelve todas con su conteo en una consulta: pedirlo
 * fila por fila contra `/api/reviews/chairs/{id}/facts` era un N+1 por red.
 *
 * Mostrar el conteo de una cátedra bajo el piso no adelanta nada: su ficha pública ya dice "junta
 * 3 reseñas: con 7 más se publica" para cualquiera que la abra (ADR-0082).
 *
 * Si el conteo no llegó, la fila se dibuja igual con el slot inerte. Un cero diría que la cátedra
 * no tiene reseñas cuando puede tener doce.
 */
export function ReviewedChairsCard({ chairs }: { chairs: readonly ReviewedChair[] }) {
  if (chairs.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Las cátedras que reseñaste</p>
      <div className="rounded-xl border border-line bg-bg-card">
        {chairs.map((chair, index) => (
          <Row key={chair.chairId} chair={chair} last={index === chairs.length - 1} />
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
        Las voces son de la cátedra, no tuyas, y son las mismas que ve cualquiera en su ficha.
        Ninguna reseña se muestra sola, ni con tu nombre ni sin él.
      </p>
    </section>
  );
}

function Row({ chair, last }: { chair: ReviewedChair; last: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? 0 : '1px solid var(--color-line-2)' }}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={`/chairs/${chair.chairId}`}
          className="text-[14px] text-ink underline-offset-2 hover:underline"
        >
          Cátedra {chair.chairName}
        </Link>
        <p className="text-[11.5px] text-ink-3">
          {chair.subjectName} · {chair.termLabel}
          {chair.ownReviews > 1 ? ` · ${chair.ownReviews} cursadas tuyas` : ''}
        </p>
      </div>

      <ChairState chair={chair} />
    </div>
  );
}

/**
 * El estado de la cátedra. La que ya publica lleva su conteo y nada más: cruzar el piso no es un
 * logro que festejar, es que la ficha existe. La que no llega dice cuánto le falta, sin pintarse
 * de alarma: el contrato visual tiene un solo color y significa que algo está mal, no que falta
 * poco (ADR-0071).
 */
function ChairState({ chair }: { chair: ReviewedChair }) {
  if (chair.voices === null) {
    return (
      <span
        aria-disabled="true"
        title="No pudimos traer este conteo"
        className="shrink-0 cursor-not-allowed select-none rounded-md bg-bg-elev px-2.5 py-1 font-mono text-[10.5px] text-ink-4"
      >
        voces: sin dato
      </span>
    );
  }

  return (
    <span className="shrink-0 text-right">
      <span className="block font-mono text-[13px] text-ink">{chair.voices}</span>
      <span className="block font-mono text-[9.5px] text-ink-3">
        {chair.isPublished ? 'voces · publica' : `voces · ${statePending(chair.missingToPublish)}`}
      </span>
    </span>
  );
}

function statePending(missing: number | null): string {
  if (missing === null) return 'no publica';
  return missing === 1 ? 'le falta una' : `le faltan ${missing}`;
}
