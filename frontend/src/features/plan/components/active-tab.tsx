'use client';

import { useState } from 'react';
import type { Simulation } from '../types';
import { CalendarWeek } from './calendar-week';
import { CommissionCompare } from './commission-compare';
import { StatsGrid } from './stats-grid';
import { SubjectListCard } from './subject-list-card';

/**
 * "En curso" tab of Plan (US-046). Grid layout: 320px subject list + main with stats +
 * calendar + optional comparator. Mirrors `v2-screens.jsx::V2PlanificarEnCurso`.
 */
export function ActiveTab({ simulation }: { simulation: Simulation }) {
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 16,
      }}
    >
      <SubjectListCard subjects={simulation.subjects} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <StatsGrid stats={simulation.stats} />

        <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
          <div
            style={{
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
              Distribución semanal
            </h2>
            {simulation.stats.clashes > 0 && (
              <small className="text-accent" style={{ fontWeight: 500 }}>
                ⚠ {simulation.stats.clashes} choque(s)
              </small>
            )}
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
