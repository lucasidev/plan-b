'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { simulationDraftsQueries } from '../api';
import type { AcademicTerm } from '../types';
import { ActiveTab } from './active-tab';
import { DraftList } from './draft-list';
import { PlanEmpty } from './empty-state';
import { PlanTabs, type TabId } from './plan-tabs';
import { TermSelector } from './term-selector';

/**
 * Plan shell (US-046 + US-096 + US-023). Renders the header (con el selector de período) + tabs +
 * tab content. Global empty state si el alumno no tiene ningún borrador (de ningún estado). Los
 * borradores (US-023) ya son datos reales: `useSuspenseQuery` los lee del cache hidratado por la
 * RSC de /plan (mismo queryKey), y este componente agrupa por status + término para decidir qué va
 * en "En curso" (el `Active` del período elegido) y en "Borradores" (los `Draft`).
 */
type Props = {
  activeTab: TabId;
  terms: readonly AcademicTerm[];
  selectedTermId: string | null;
};

export function PlanShell({ activeTab, terms, selectedTermId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data } = useSuspenseQuery(simulationDraftsQueries.list());
  const allDrafts = data.items;

  // "+ Nuevo borrador" / "Crear (primer) borrador": armar una combinación pasa siempre por la
  // pestaña "En curso" (el drawer "Agregar materia" + "Guardar como borrador" viven ahí, US-023).
  // Preserva el resto de los query params (ej. `?termId=`) para no perder el período elegido.
  function goToBuilder() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'active');
    router.push(`?${params.toString()}`, { scroll: false });
  }

  if (allDrafts.length === 0) {
    return (
      <div>
        <PlanEmpty onCreateDraft={goToBuilder} />
      </div>
    );
  }

  const activeDraft =
    allDrafts.find((d) => d.status === 'Active' && d.termId === selectedTermId) ?? null;
  const draftItems = allDrafts.filter((d) => d.status === 'Draft');
  const activeTerm = terms.find((t) => t.id === activeDraft?.termId);

  const tabs = [
    {
      id: 'active' as TabId,
      label: activeDraft && activeTerm ? `En curso · ${activeTerm.year}` : 'En curso',
      tag: activeDraft ? `${activeDraft.items.length}` : undefined,
    },
    {
      id: 'draft' as TabId,
      label: 'Borradores',
      tag: `${draftItems.length}`,
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
        <div className="flex flex-col items-end gap-2">
          {/* Suspense porque TermSelector usa useSearchParams() (mismo motivo que PlanTabs abajo). */}
          <Suspense fallback={null}>
            <TermSelector terms={terms} selectedTermId={selectedTermId} />
          </Suspense>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Comparar
            </Button>
            <Button size="sm" onClick={goToBuilder}>
              + Nuevo borrador
            </Button>
          </div>
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
        // Suspense porque ActiveTab lee useSuspenseQuery(availableSubjectsQueries.list) directo
        // (US-096, para el picker de comisión). Normalmente resuelve al toque desde el cache
        // hidratado por la RSC de /plan (mismo criterio que el Suspense del drawer en
        // SubjectListCard); el boundary es la red de contención si algún día suspende de verdad.
        <Suspense fallback={null}>
          <ActiveTab activeDraft={activeDraft} termId={selectedTermId} />
        </Suspense>
      ) : (
        <DraftList drafts={draftItems} terms={terms} onCreate={goToBuilder} />
      )}
    </div>
  );
}
