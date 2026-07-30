'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { formatAcademicPeriod } from '@/lib/academic-terms';
import { deleteSimulationDraftAction, unshareSimulationDraftAction } from '../actions';
import { PUBLIC_SIMULATIONS_QUERY_KEY, SIMULATION_DRAFTS_QUERY_KEY } from '../api';
import type { AcademicTerm, SimulationDraft, SimulationDraftItem } from '../types';
import { EditDraftModal } from './edit-draft-modal';
import { PublishPlanModal } from './publish-plan-modal';
import { ShareDraftModal } from './share-draft-modal';

/**
 * "Borrador" tab of Plan (US-046 shell + US-023 datos reales + US-024 compartir). Lista de
 * borradores propios (status Draft) con label (propio o un fallback legible con el período), y sus
 * materias + comisión. Acciones por fila: Editar, Borrar (con confirmación), Compartir/Dejar de
 * compartir y Publicar. Un borrador `Shared` muestra el chip "Compartido" junto al nombre.
 *
 * Antes mostraba `MOCK_DRAFTS` con una grilla de métricas y un calendario por borrador
 * (`StatsGrid`/`CalendarWeek`, US-046). El endpoint real de borradores (`GET
 * /api/me/simulations/drafts`) no trae ese detalle: ni dificultad ni horario por materia, datos que
 * solo produce evaluar la combinación (US-016). El AC de esta US pide mostrar label + estado +
 * materias con comisión, no reconstruir esas métricas acá, así que se retira ese detalle en vez de
 * inventarlo (el panel de métricas y el calendario reales viven en la pestaña "En curso").
 */
type Props = {
  drafts: readonly SimulationDraft[];
  terms: readonly AcademicTerm[];
  onCreate: () => void;
};

export function DraftList({ drafts, terms, onCreate }: Props) {
  const [publishingDraft, setPublishingDraft] = useState<SimulationDraft | null>(null);
  const [editingDraft, setEditingDraft] = useState<SimulationDraft | null>(null);
  const [sharingDraft, setSharingDraft] = useState<SimulationDraft | null>(null);

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
      {drafts.map((draft) => (
        <DraftCard
          key={draft.id}
          draft={draft}
          label={draftLabel(draft, terms)}
          onEdit={() => setEditingDraft(draft)}
          onPublish={() => setPublishingDraft(draft)}
          onShare={() => setSharingDraft(draft)}
        />
      ))}

      <PublishPlanModal
        draft={publishingDraft}
        label={publishingDraft ? draftLabel(publishingDraft, terms) : ''}
        onClose={() => setPublishingDraft(null)}
      />
      <EditDraftModal draft={editingDraft} onClose={() => setEditingDraft(null)} />
      <ShareDraftModal
        draft={sharingDraft}
        label={sharingDraft ? draftLabel(sharingDraft, terms) : ''}
        onClose={() => setSharingDraft(null)}
      />
    </div>
  );
}

/** Label propio, o un fallback legible con el período (year + cadencia canónica, ADR-0051): nunca
 * un formato codificado tipo "1c". Si el término no se encuentra (edge case), un fallback neutro. */
function draftLabel(draft: SimulationDraft, terms: readonly AcademicTerm[]): string {
  if (draft.label) return draft.label;
  const term = terms.find((t) => t.id === draft.termId);
  if (!term) return 'Borrador sin nombre';
  return formatAcademicPeriod(term.year, term.kind, term.number) ?? term.label;
}

function DraftCard({
  draft,
  label,
  onEdit,
  onPublish,
  onShare,
}: {
  draft: SimulationDraft;
  label: string;
  onEdit: () => void;
  onPublish: () => void;
  onShare: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleDelete() {
    if (!window.confirm(`¿Borrar "${label}"? No se puede deshacer.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSimulationDraftAction(draft.id);
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PUBLIC_SIMULATIONS_QUERY_KEY });
      } else {
        setError(result.message);
      }
    });
  }

  // Descompartir no repite la explicación del modal de compartir (`ShareDraftModal`): volver a
  // privado es reversible y sin riesgo de exposición, así que se ejecuta directo, mismo criterio
  // que el resto de las acciones de fila sin confirmación (Editar, Publicar).
  function handleUnshare() {
    setError(null);
    startTransition(async () => {
      const result = await unshareSimulationDraftAction(draft.id);
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PUBLIC_SIMULATIONS_QUERY_KEY });
      } else {
        setError(result.message);
      }
    });
  }

  const isShared = draft.visibility === 'Shared';

  return (
    <article className="bg-bg-card border border-line rounded-lg" style={{ padding: 20 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
          gap: 12,
          flexWrap: 'wrap',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 className="text-ink-1" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              {label}
            </h3>
            {isShared && <Pill tone="good">Compartido</Pill>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} disabled={isPending}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Borrando...' : 'Borrar'}
          </Button>
          {isShared ? (
            <Button variant="ghost" size="sm" onClick={handleUnshare} disabled={isPending}>
              {isPending ? '...' : 'Dejar de compartir'}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onShare} disabled={isPending}>
              Compartir
            </Button>
          )}
          <Button size="sm" onClick={onPublish} disabled={isPending}>
            Publicar
          </Button>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="text-st-failed-fg"
          style={{ fontSize: 12.5, margin: '0 0 10px' }}
        >
          {error}
        </p>
      )}

      <SimulationSubjectList items={draft.items} />
    </article>
  );
}

/**
 * Lista de materias + comisión de una simulación (código, nombre, comisión elegida o "sin
 * comisión"). Compartido entre `DraftList` (borradores propios, US-023) y `PublicFeedTab` (feed
 * público, US-027): el backend documenta las dos formas como el mismo shape a propósito
 * (`PublicSimulationSubjectItem` = `SimulationDraftListItemSubject`) para reusar el mismo "chip de
 * materia" en ambas pantallas.
 */
export function SimulationSubjectList({ items }: { items: readonly SimulationDraftItem[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, i) => (
        <div
          key={item.subjectId}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            padding: '9px 0',
            borderTop: i ? '1px solid var(--line)' : 'none',
          }}
        >
          <div>
            <span
              className="text-ink-3"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 8 }}
            >
              {item.subjectCode}
            </span>
            <span className="text-ink-1" style={{ fontSize: 13 }}>
              {item.subjectName}
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--line-2, var(--line))',
              color: 'var(--ink-3)',
              flexShrink: 0,
            }}
          >
            {item.commissionName ? `com ${item.commissionName}` : 'sin comisión'}
          </span>
        </div>
      ))}
    </div>
  );
}
