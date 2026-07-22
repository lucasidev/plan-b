'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { isDraftStale } from '../hooks/use-active-academic-period';
import type { Simulation } from '../types';
import { CalendarWeek } from './calendar-week';
import { PromoteBanner } from './promote-banner';
import { PublishPlanModal } from './publish-plan-modal';
import { type StatGridItem, StatsGrid } from './stats-grid';
import { SubjectListCard } from './subject-list-card';

/**
 * "Borrador" tab of Plan (US-046). List of drafts with preview + per-draft actions
 * (Editar, Borrar, Compartir). The "stale" draft (period already started) shows the
 * PromoteBanner. On activate, opens the PublishPlanModal with a validation checklist.
 */
type Props = {
  drafts: Simulation[];
  onCreate: () => void;
};

/**
 * Arma los tiles del mock de un borrador. Sin cambio de comportamiento: es la misma lógica que
 * antes vivía adentro de `StatsGrid`, relocalizada acá porque ese componente pasó a ser puramente
 * presentacional (US-016: el tab activo ahora arma los suyos desde datos reales del planificador,
 * ver `SimulatorEvaluationPanel`). Los borradores siguen sin materias con id real que evaluar
 * (US-023 pendiente), así que siguen mostrando el mock tal cual.
 */
function buildDraftStatsItems(stats: Simulation['stats']): StatGridItem[] {
  return [
    { value: `${stats.weeklyHours}h`, label: 'semanales' },
    {
      value: `${stats.clashes}`,
      label: stats.clashes === 1 ? 'choque' : 'choques',
      warn: stats.clashes > 0,
    },
    { value: stats.avgDiff.toFixed(1), label: 'dificultad' },
    { value: `${Math.round(stats.expectedApproval * 100)}%`, label: 'aprob. esperada' },
  ];
}

export function DraftList({ drafts, onCreate }: Props) {
  const [publishingDraft, setPublishingDraft] = useState<Simulation | null>(null);

  if (drafts.length === 0) {
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
            No tenés borradores
          </h3>
          <p className="text-ink-3" style={{ fontSize: 13.5, lineHeight: 1.5, margin: '0 0 16px' }}>
            Armá un borrador para simular un cuatri futuro: agregás materias, comparás comisiones y
            ves si tu calendario cierra.
          </p>
          <Button onClick={onCreate}>Crear borrador</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {drafts.map((draft) => {
        const stale = isDraftStale(draft.period);
        return (
          <article
            key={draft.id}
            className="bg-bg-card border border-line rounded-lg"
            style={{ padding: 20 }}
          >
            {stale && <PromoteBanner draft={draft} onActivate={(d) => setPublishingDraft(d)} />}
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 12,
              }}
            >
              <div>
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
                  Borrador
                </div>
                <h3 className="text-ink-1" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                  {draft.label}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
                <Button variant="ghost" size="sm">
                  Compartir
                </Button>
                {!stale && (
                  <Button size="sm" onClick={() => setPublishingDraft(draft)}>
                    Publicar
                  </Button>
                )}
              </div>
            </header>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: 16,
              }}
            >
              <SubjectListCard subjects={draft.subjects} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <StatsGrid items={buildDraftStatsItems(draft.stats)} />
                <div className="border border-line rounded" style={{ padding: 16 }}>
                  <CalendarWeek blocks={draft.blocks} />
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <PublishPlanModal
        open={publishingDraft !== null}
        draft={publishingDraft}
        onClose={() => setPublishingDraft(null)}
        onConfirm={() => {
          // Mock: the status flip (draft -> active) is the backend's job (US-023). Here
          // we just close the modal; when that lands, this callback fires the mutation.
          setPublishingDraft(null);
        }}
      />
    </div>
  );
}
