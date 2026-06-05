'use client';

import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Simulation } from '../types';
import { ActiveTab } from './active-tab';
import { DraftList } from './draft-list';
import { PlanEmpty } from './empty-state';
import { PlanTabs, type TabId } from './plan-tabs';

/**
 * Plan shell (US-046). Renders the header + tabs + active-tab content. Global empty
 * state if there is no active simulation nor drafts. Mock data for now (US-016 +
 * US-023 pending); when the backend lands, this shell consumes real queries with the
 * same contract.
 */
type Props = {
  active: Simulation | null;
  drafts: Simulation[];
  activeTab: TabId;
};

export function PlanShell({ active, drafts, activeTab }: Props) {
  const [_createDraftRequested, setCreateDraftRequested] = useState(false);

  const isEmpty = !active && drafts.length === 0;

  if (isEmpty) {
    return (
      <div>
        <PlanEmpty onCreateDraft={() => setCreateDraftRequested(true)} />
      </div>
    );
  }

  const tabs = [
    {
      id: 'active' as TabId,
      label: active ? `En curso · ${active.period.year}` : 'En curso',
      tag: active ? `${active.subjects.length}` : undefined,
    },
    {
      id: 'draft' as TabId,
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

      {/* Suspense required because PlanTabs uses useSearchParams()
          (react-doctor/nextjs-no-use-search-params-without-suspense rule). Without the
          boundary the entire page bails out to client-side rendering. Fallback `null`
          is OK: the tabs are visually light and the initial snapshot renders in
          under 50ms. */}
      <Suspense fallback={null}>
        <PlanTabs items={tabs} active={activeTab} />
      </Suspense>

      {activeTab === 'active' ? (
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
