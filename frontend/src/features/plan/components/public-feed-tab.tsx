'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { NO_DATA_YET } from '@/lib/copy';
import { publicSimulationsQueries } from '../api';
import type { PublicSimulationItem } from '../types';
import { SimulationSubjectList } from './draft-list';
import { StatsGrid } from './stats-grid';

/**
 * "Comunidad" tab of Plan (US-027): feed de simulaciones compartidas (US-024) del mismo plan de
 * carrera + período elegido, anonimizado (el backend nunca manda nada del autor: ni id ni nombre).
 * Paginado por cursor opaco con "Ver más" (`useSuspenseInfiniteQuery`): no hay un COUNT total, así
 * que un pager por número de página (como `Pager` de browse-reviews) no aplica acá.
 *
 * Sin `careerPlanId` (no encontramos el perfil de alumno) o sin `termId` (sin períodos lectivos
 * cargados) no hay nada que pedirle al backend: se corta antes de montar la query, mismo honesty
 * check que hace `TermSelector` con la lista de términos vacía.
 */
export function PublicFeedTab({
  careerPlanId,
  termId,
  onGoToDrafts,
}: {
  careerPlanId: string | null;
  termId: string | null;
  onGoToDrafts: () => void;
}) {
  if (!careerPlanId) {
    return (
      <Notice text="No encontramos tu perfil de alumno para mostrarte el feed de la comunidad." />
    );
  }
  if (!termId) {
    return <Notice text="Elegí un período para ver qué está armando otra gente." />;
  }

  return <PublicFeedList careerPlanId={careerPlanId} termId={termId} onGoToDrafts={onGoToDrafts} />;
}

function PublicFeedList({
  careerPlanId,
  termId,
  onGoToDrafts,
}: {
  careerPlanId: string;
  termId: string;
  onGoToDrafts: () => void;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    publicSimulationsQueries.feed(careerPlanId, termId),
  );

  const items = data.pages.flatMap((page) => page.items);

  if (items.length === 0) {
    return (
      <div
        className="bg-bg-card border border-line rounded-lg"
        style={{
          minHeight: 240,
          display: 'grid',
          placeItems: 'center',
          borderStyle: 'dashed',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <h3 className="text-ink-1" style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>
            Todavía nadie compartió una simulación acá
          </h3>
          <p className="text-ink-3" style={{ fontSize: 13.5, lineHeight: 1.5, margin: '0 0 16px' }}>
            Cuando otro alumno de tu plan comparta la suya para este período, va a aparecer acá.
            Mientras tanto, ¿compartís vos la tuya?
          </p>
          <Button onClick={onGoToDrafts}>Ir a Borradores</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((item) => (
        <PublicFeedCard key={item.id} item={item} />
      ))}

      {hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={{ alignSelf: 'center' }}
        >
          {isFetchingNextPage ? 'Cargando...' : 'Ver más'}
        </Button>
      )}
    </div>
  );
}

function PublicFeedCard({ item }: { item: PublicSimulationItem }) {
  return (
    <article className="bg-bg-card border border-line rounded-lg" style={{ padding: 20 }}>
      <header style={{ marginBottom: 12 }}>
        <div
          className="text-ink-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          Otro alumno de tu plan
        </div>
        <h3 className="text-ink-1" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          {item.label ?? 'Simulación sin nombre'}
        </h3>
      </header>

      <div style={{ marginBottom: 14 }}>
        <StatsGrid
          items={[
            { value: `${item.totalWeeklyHours}h`, label: 'semanales' },
            item.averageDifficulty === null
              ? { value: NO_DATA_YET, label: 'sin reseñas todavía' }
              : { value: item.averageDifficulty.toFixed(1), label: 'dificultad' },
          ]}
        />
      </div>

      <SimulationSubjectList items={item.items} />
    </article>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div
      className="bg-bg-card border border-line rounded-lg text-ink-3"
      style={{ padding: 16, fontSize: 13, textAlign: 'center' }}
    >
      {text}
    </div>
  );
}
