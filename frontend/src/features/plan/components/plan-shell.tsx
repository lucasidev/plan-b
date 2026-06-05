'use client';

import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Simulation } from '../types';
import { ActiveTab } from './active-tab';
import { DraftList } from './draft-list';
import { PlanificarEmpty } from './empty-state';
import { PlanificarTabs, type TabId } from './plan-tabs';

/**
 * Shell del Planificar (US-046). Renderea el header + tabs + contenido del tab activo.
 * Empty state global si no hay ni activo ni borradores. Mock data por ahora (US-016 + US-023
 * pendientes); cuando aterrice el backend, este shell consume queries reales con el mismo
 * contrato.
 */
type Props = {
  active: Simulation | null;
  drafts: Simulation[];
  activeTab: TabId;
};

export function PlanificarShell({ active, drafts, activeTab }: Props) {
  const [_createDraftRequested, setCreateDraftRequested] = useState(false);

  const isEmpty = !active && drafts.length === 0;

  if (isEmpty) {
    return (
      <div>
        <PlanificarEmpty onCreateDraft={() => setCreateDraftRequested(true)} />
      </div>
    );
  }

  const tabs = [
    {
      id: 'en-curso' as TabId,
      label: active ? `En curso · ${active.period.year}` : 'En curso',
      tag: active ? `${active.subjects.length}` : undefined,
    },
    {
      id: 'borrador' as TabId,
      label: 'Borradores',
      tag: `${drafts.length}`,
    },
  ];

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 16,
          gap: 24,
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            className="text-accent"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Planificar
          </div>
          <h1
            className="text-ink-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Tu período, ajustable.
          </h1>
          <p className="text-ink-3" style={{ fontSize: 14, lineHeight: 1.5, marginTop: 6 }}>
            Editá lo que estás cursando o armá borradores del próximo. La modalidad la define la
            cátedra; vos elegís comisión y horario.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Comparar
          </Button>
          <Button size="sm" onClick={() => setCreateDraftRequested(true)}>
            + Nuevo borrador
          </Button>
        </div>
      </header>

      {/* Suspense requerida porque PlanificarTabs usa useSearchParams() (regla
          react-doctor/nextjs-no-use-search-params-without-suspense). Sin la boundary la
          page entera bailout a client-side rendering. Fallback `null` está OK: los tabs
          son visualmente livianos y el snapshot inicial se renderea en <50ms. */}
      <Suspense fallback={null}>
        <PlanificarTabs items={tabs} active={activeTab} />
      </Suspense>

      {activeTab === 'en-curso' ? (
        active ? (
          <ActiveTab simulation={active} />
        ) : (
          <p className="text-ink-3" style={{ padding: 24 }}>
            No tenés período activo. Pasá a la tab Borradores y publicá uno.
          </p>
        )
      ) : (
        <DraftList drafts={drafts} onCreate={() => setCreateDraftRequested(true)} />
      )}
    </div>
  );
}
