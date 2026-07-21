'use client';

import { useState } from 'react';
import type { AvailableSubject, Simulation } from '../types';
import { CalendarWeek } from './calendar-week';
import { CommissionCompare } from './commission-compare';
import { SimulatorEvaluationPanel } from './stats-grid';
import { SubjectListCard } from './subject-list-card';

/**
 * "En curso" tab of Plan (US-046). Grid layout: 320px subject list + main with stats +
 * calendar + optional comparator. Mirrors `v2-screens.jsx::V2PlanificarEnCurso`.
 */
export function ActiveTab({ simulation }: { simulation: Simulation }) {
  const [compareOpen, setCompareOpen] = useState(false);

  // Ids reales elegidos en el drawer "Agregar materia" (US-016), acumulados en esta sesión: el
  // simulador no persiste nada (ADR-0029), así que no sobrevive a un refresh ni a cambiar de tab.
  // Arranca vacío a propósito: `simulation.subjects` es mock (US-023 storage pendiente, sin id
  // real de backend), así que no hay nada de ahí para sembrar acá. El panel de métricas
  // reacciona solo a este estado, no al mock de la lista de materias del año.
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  function handleAddSubject(subject: AvailableSubject) {
    setSubjectIds((prev) => (prev.includes(subject.id) ? prev : [...prev, subject.id]));
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 16,
      }}
    >
      <SubjectListCard subjects={simulation.subjects} onAddSubject={handleAddSubject} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SimulatorEvaluationPanel subjectIds={subjectIds} />

        <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
              Distribución semanal
            </h2>
          </div>
          <CalendarWeek blocks={simulation.blocks} />
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

        {compareOpen && <CommissionCompare />}
      </div>
    </div>
  );
}
