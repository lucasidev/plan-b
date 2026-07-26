'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { availableSubjectsQueries, simulationEvaluationQueries } from '../api';
import type {
  AvailableSubject,
  CommissionSelection,
  Simulation,
  SimulationEvaluation,
} from '../types';
import { CalendarWeek } from './calendar-week';
import { CommissionCompare } from './commission-compare';
import { CommissionPicker } from './commission-picker';
import { SimulatorEvaluationPanel } from './stats-grid';
import { SubjectListCard } from './subject-list-card';

/**
 * "En curso" tab of Plan (US-046 + US-016 + US-096). Grid layout: 320px subject list + main with
 * stats + comisión picker + calendar + optional comparator. Mirrors
 * `v2-screens.jsx::V2PlanificarEnCurso`.
 */
export function ActiveTab({
  simulation,
  termId,
}: {
  simulation: Simulation;
  termId: string | null;
}) {
  const [compareOpen, setCompareOpen] = useState(false);

  // Selecciones reales elegidas en el drawer "Agregar materia" (US-016) + comisión por materia
  // (US-096), acumuladas en esta sesión: el planificador no persiste nada (ADR-0029), así que no
  // sobrevive a un refresh ni a cambiar de tab. Arranca vacío a propósito: `simulation.subjects` es
  // mock (US-023 storage pendiente, sin id real de backend), así que no hay nada de ahí para
  // sembrar acá. El panel de métricas y el calendario reaccionan solo a este estado, no al mock de
  // la lista de materias del año.
  const [selections, setSelections] = useState<CommissionSelection[]>([]);

  // Cambiar de período invalida cualquier comisión elegida: una comisión es la oferta de UN
  // término puntual, así que la elegida para el término anterior no tiene sentido (ni existe,
  // probablemente) en el nuevo. Las materias sumadas siguen siendo válidas: pertenecen al plan del
  // alumno, no a un término específico.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset atado al término, no a selections.
  useEffect(() => {
    setSelections((prev) =>
      prev.some((s) => s.commissionId !== null)
        ? prev.map((s) => ({ ...s, commissionId: null }))
        : prev,
    );
  }, [termId]);

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

  function handleSelectCommission(subjectId: string, commissionId: string | null) {
    setSelections((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, commissionId } : s)),
    );
  }

  const { data: evaluation } = useQuery(simulationEvaluationQueries.forSelections(selections));

  const selectedSubjects = selections
    .map((s) => subjectsById.get(s.subjectId))
    .filter((s): s is AvailableSubject => s !== undefined);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 16,
      }}
    >
      <SubjectListCard
        subjects={simulation.subjects}
        onAddSubject={handleAddSubject}
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
