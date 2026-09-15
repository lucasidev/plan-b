import { FallbackLink } from '@/components/layout/fallback-link';
import type { ChairNearFloor } from '../api.server';

/**
 * "Tu reseña la publica" (US-231 E3): las cátedras de la carrera declarada a una reseña de cruzar
 * el piso, sin las que esta cuenta ya reseñó: la ficha (SC-018) las excluye porque ya están en el
 * bloque 1, no por una unicidad de una sola cátedra por cuenta (la real es cuenta × materia ×
 * período: la misma cuenta puede reseñar la misma cátedra otra vez, en otro período). No se
 * dibuja si no queda ninguna, ni siquiera el encabezado: es la única forma de que "leer no
 * depende de que reseñes" también valga cuando no hay nada que ofrecer.
 */
export function ChairsNearFloorList({
  chairs,
  reviewedChairIds,
}: {
  chairs: readonly ChairNearFloor[];
  reviewedChairIds: ReadonlySet<string>;
}) {
  const pending = chairs.filter((chair) => !reviewedChairIds.has(chair.chairId));
  if (pending.length === 0) return null;

  return (
    <section className="mb-5">
      <p className="mb-2 text-[12px] text-ink-3">Tu reseña la publica</p>
      <div className="rounded-xl border border-line bg-bg-card">
        {pending.map((chair, index) => (
          <Row key={chair.chairId} chair={chair} last={index === pending.length - 1} />
        ))}
      </div>
    </section>
  );
}

function Row({ chair, last }: { chair: ChairNearFloor; last: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? 0 : '1px solid var(--color-line-2)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-ink">{chair.subjectName}</p>
        <p className="text-[11.5px] text-ink-3">
          Cátedra {chair.chairName} · junta {chair.reviewCount}{' '}
          {chair.reviewCount === 1 ? 'reseña' : 'reseñas'}: con la tuya se publica
        </p>
      </div>
      <FallbackLink
        href="/reviews/new"
        className="shrink-0 text-[12.5px] text-accent-ink underline-offset-2 hover:underline"
      >
        Reseñar
      </FallbackLink>
    </div>
  );
}
