'use client';

import { useState } from 'react';
import { formatCommissionModality, formatScheduleSummary } from '../lib/commission-format';
import type { AvailableSubject } from '../types';

/**
 * Comparador de comisiones (US-046 shell, cableado a datos reales en US-096). Compara las
 * comisiones ofrecidas de UNA materia entre las que el alumno sumó a la simulación; si sumó más de
 * una, un select adicional deja elegir cuál mirar.
 *
 * Antes usaba `MOCK_COMMISSION_OPTIONS_INT302` (hardcoded a la materia INT302) con "insights" de
 * dificultad/carga/aprobación por comisión inventados. Esos insights NO existen en el backend
 * todavía (agruparían reseñas por comisión, no por materia): se dice explícito en vez de
 * inventarlos. Lo que sí es real: nombre, modalidad, docentes y horario de cada comisión.
 */
type Props = {
  subjects: readonly AvailableSubject[];
};

export function CommissionCompare({ subjects }: Props) {
  const [activeId, setActiveId] = useState<string | null>(subjects[0]?.id ?? null);

  if (subjects.length === 0) {
    return (
      <div
        className="bg-bg-card border border-line rounded-lg text-ink-3"
        style={{ padding: 16, fontSize: 13, textAlign: 'center' }}
      >
        Sumá una materia a la simulación para comparar sus comisiones.
      </div>
    );
  }

  const subject = subjects.find((s) => s.id === activeId) ?? subjects[0];

  return (
    <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
          Comparar comisiones · {subject.code}
        </h2>
        {subjects.length > 1 && (
          <select
            aria-label="Elegí qué materia comparar"
            value={subject.id}
            onChange={(e) => setActiveId(e.target.value)}
            className="border border-line rounded"
            style={{ padding: '4px 8px', fontSize: 12, background: 'var(--bg)' }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {subject.commissions.length === 0 ? (
        <p className="text-ink-3" style={{ fontSize: 13 }}>
          Sin oferta cargada para este período.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(subject.commissions.length, 3)}, 1fr)`,
            gap: 10,
          }}
        >
          {subject.commissions.map((c) => (
            <div key={c.id} className="border border-line rounded" style={{ padding: 12 }}>
              <div
                className="text-ink-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                com {c.name}
              </div>
              <div className="text-ink-2" style={{ fontSize: 12, marginBottom: 2 }}>
                {formatCommissionModality(c.modality)}
              </div>
              <div className="text-ink-2" style={{ fontSize: 12, marginBottom: 2 }}>
                {c.teacherNames.length > 0 ? c.teacherNames.join(', ') : 'Sin docente asignado'}
              </div>
              <div className="text-ink-3" style={{ fontSize: 11, marginBottom: 8 }}>
                {formatScheduleSummary(c.schedule)}
              </div>
              {c.capacity !== null && (
                <div className="text-ink-3" style={{ fontSize: 11 }}>
                  Cupo: {c.capacity}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-ink-4" style={{ fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        Dificultad, carga y aprobación por comisión llegan cuando haya reseñas suficientes por
        comisión.
      </p>
    </div>
  );
}
