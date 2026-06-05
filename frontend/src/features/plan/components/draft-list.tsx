'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { isDraftStale } from '../hooks/use-active-academic-period';
import type { Simulation } from '../types';
import { CalendarWeek } from './calendar-week';
import { PromoteBanner } from './promote-banner';
import { PublishPlanModal } from './publish-plan-modal';
import { StatsGrid } from './stats-grid';
import { SubjectListCard } from './subject-list-card';

/**
 * Tab "Borrador" de Planificar (US-046). Lista de borradores con preview + acciones por
 * borrador (Editar, Borrar, Compartir). El borrador "vencido" (período ya empezó) muestra el
 * PromoteBanner. Al activar, abre el PublishPlanModal con checklist de validaciones.
 */
type Props = {
  drafts: Simulation[];
  onCreate: () => void;
};

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
                <StatsGrid stats={draft.stats} />
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
          // Mock: el flip de status (draft → active) lo hace el backend (US-023). Acá solo
          // cerramos el modal; cuando aterrice, este callback dispara la mutation.
          setPublishingDraft(null);
        }}
      />
    </div>
  );
}
