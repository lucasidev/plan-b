'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { availableSubjectsQueries, simulationEvaluationQueries } from '../api';
import type {
  AvailableSubject,
  CommissionSelection,
  SimulationDraft,
  SimulationEvaluation,
} from '../types';
import { CalendarWeek } from './calendar-week';
import { CommissionCompare } from './commission-compare';
import { CommissionPicker } from './commission-picker';
import { SaveDraftModal } from './save-draft-modal';
import { SimulatorEvaluationPanel } from './stats-grid';
import type { SelectedSubjectRow } from './subject-list-card';
import { SubjectListCard } from './subject-list-card';

/**
 * "En curso" tab of Plan (US-046 + US-016 + US-096 + US-023). Grid layout: 320px subject list +
 * main with stats + comisión picker + calendar + optional comparator. Mirrors
 * `v2-screens.jsx::V2PlanificarEnCurso`.
 */
export function ActiveTab({
  activeDraft,
  termId,
}: {
  activeDraft: SimulationDraft | null;
  termId: string | null;
}) {
  const [compareOpen, setCompareOpen] = useState(false);
  const [saveDraftOpen, setSaveDraftOpen] = useState(false);

  // Selecciones de esta sesión (materia + comisión elegida, US-016 + US-096), sembradas desde el
  // plan Active real del período elegido si existe (US-023): "En curso" es un único armador, no dos
  // cosas separadas, así que ver el plan vigente y seguir editándolo es la misma superficie. Sin
  // plan Active, arranca vacío (nada que sembrar). "Guardar como borrador" (más abajo) saca una foto
  // de este estado tal cual esté en ese momento.
  const [selections, setSelections] = useState<CommissionSelection[]>([]);

  // Cambiar de período (o que el plan Active resuelto para ese período cambie, ej. recién
  // publicado uno) resiembra la combinación desde cero: una comisión y una materia elegidas para un
  // término no tienen por qué existir en otro. Se compara por id, no por referencia: la query de
  // borradores puede devolver un array nuevo en cada refetch aunque el draft Active sea "el mismo".
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset atado al término + identidad del draft, no a selections.
  useEffect(() => {
    setSelections(
      activeDraft
        ? activeDraft.items.map((item) => ({
            subjectId: item.subjectId,
            commissionId: item.commissionId,
          }))
        : [],
    );
  }, [termId, activeDraft?.id]);

  const { data: catalog } = useSuspenseQuery(availableSubjectsQueries.list(termId));
  const subjectsById = useMemo(
    () => new Map(catalog.items.map((subject) => [subject.id, subject])),
    [catalog],
  );

  function handleAddSubject(subject: AvailableSubject) {
    setSelections((prev) =>
      prev.some((s) => s.subjectId === subject.id)
        ? prev
        : [...prev, { subjectId: subject.id, commissionId: null }],
    );
  }

  function handleRemoveSubject(subjectId: string) {
    setSelections((prev) => prev.filter((s) => s.subjectId !== subjectId));
  }

  function handleSelectCommission(subjectId: string, commissionId: string | null) {
    setSelections((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, commissionId } : s)),
    );
  }

  const { data: evaluation } = useQuery(simulationEvaluationQueries.forSelections(selections));

  const selectedSubjects = selections
    .map((s) => subjectsById.get(s.subjectId))
    .filter((s): s is AvailableSubject => s !== undefined);

  // Filas reales para el sidebar (US-023): code/name salen del catálogo, la comisión elegida (si
  // hay) de la oferta de esa materia. Una selección cuya materia no está en el catálogo (edge case:
  // ya no pertenece al plan activo) se omite en vez de mostrar un placeholder inventado; sigue
  // contando para el cálculo de métricas igual.
  const rows: SelectedSubjectRow[] = selections
    .map((selection) => {
      const subject = subjectsById.get(selection.subjectId);
      if (!subject) return null;
      const commission = subject.commissions.find((c) => c.id === selection.commissionId);
      return {
        subjectId: selection.subjectId,
        code: subject.code,
        name: subject.name,
        commissionName: commission?.name ?? null,
      };
    })
    .filter((row): row is SelectedSubjectRow => row !== null);

  return (
    <div>
      {!activeDraft && (
        <p className="text-ink-3" style={{ fontSize: 13, margin: '0 0 12px' }}>
          Todavía no tenés un período en curso. Armá tu combinación acá abajo y guardala como
          borrador: la publicás desde la pestaña Borradores cuando quieras.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSaveDraftOpen(true)}
          disabled={selections.length === 0 || !termId}
        >
          Guardar como borrador
        </Button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: 16,
        }}
      >
        <SubjectListCard
          rows={rows}
          onAddSubject={handleAddSubject}
          onRemoveSubject={handleRemoveSubject}
          termId={termId}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SimulatorEvaluationPanel selections={selections} />

          {selections.length > 0 && (
            <CommissionPicker
              selections={selections}
              subjectsById={subjectsById}
              onSelectCommission={handleSelectCommission}
            />
          )}

          <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
                Distribución semanal
              </h2>
            </div>
            <WeekCalendarSection selections={selections} evaluation={evaluation} />
          </div>

          <button
            type="button"
            onClick={() => setCompareOpen((v) => !v)}
            className="text-accent hover:underline self-start"
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
              padding: '4px 0',
            }}
          >
            {compareOpen ? 'Ocultar comparador' : 'Comparar comisiones'}
          </button>

          {compareOpen && <CommissionCompare subjects={selectedSubjects} />}
        </div>
      </div>

      {termId && (
        <SaveDraftModal
          open={saveDraftOpen}
          onClose={() => setSaveDraftOpen(false)}
          termId={termId}
          items={selections}
        />
      )}
    </div>
  );
}

/**
 * Estado del calendario semanal (US-096): honesto en cada etapa. Sin materias elegidas, no hay
 * nada que armar. Con materias pero sin ninguna comisión elegida, `clashes` viaja null ("no
 * sabemos", nunca "cero choques"): se invita a elegir en vez de mostrar un calendario vacío sin
 * explicación. Con comisiones elegidas pero sin horario cargado, se distingue de "no elegiste
 * nada" (son estados distintos: acá el alumno sí eligió, la oferta es la que no tiene datos).
 */
function WeekCalendarSection({
  selections,
  evaluation,
}: {
  selections: readonly CommissionSelection[];
  evaluation: SimulationEvaluation | undefined;
}) {
  if (selections.length === 0) {
    return <CalendarNotice text="Sumá materias para armar tu calendario." />;
  }
  if (!evaluation) {
    return <CalendarNotice text="Calculando tu calendario..." />;
  }
  if (!evaluation.isValid) {
    return <CalendarNotice text="Resolvé la combinación bloqueada para ver tu calendario." />;
  }
  if (evaluation.clashes === null) {
    return <CalendarNotice text="Elegí una comisión por materia para ver tu calendario real." />;
  }
  if (evaluation.schedule.length === 0) {
    return <CalendarNotice text="Las comisiones elegidas todavía no tienen horario cargado." />;
  }
  return <CalendarWeek blocks={evaluation.schedule} />;
}

function CalendarNotice({ text }: { text: string }) {
  return (
    <p className="text-ink-3" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
      {text}
    </p>
  );
}
