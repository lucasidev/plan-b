'use client';

import { formatCommissionModality, formatScheduleSummary } from '../lib/commission-format';
import type { AvailableSubject, CommissionSelection } from '../types';

/**
 * Lista de materias sumadas a la simulación, cada una con su selector de comisión (US-096). Sin
 * comisión elegida es un estado válido: la materia sigue contando para horas/dificultad, solo no
 * entra al cálculo de choques hasta que el alumno elija una (ver `SimulatorEvaluationPanel`).
 */
type Props = {
  selections: readonly CommissionSelection[];
  subjectsById: ReadonlyMap<string, AvailableSubject>;
  onSelectCommission: (subjectId: string, commissionId: string | null) => void;
};

export function CommissionPicker({ selections, subjectsById, onSelectCommission }: Props) {
  return (
    <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
      <h2 className="text-base font-semibold text-ink-1" style={{ margin: '0 0 10px' }}>
        Comisión por materia
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {selections.map((selection, i) => {
          const subject = subjectsById.get(selection.subjectId);
          if (!subject) return null;
          return (
            <SubjectCommissionRow
              key={selection.subjectId}
              subject={subject}
              selectedCommissionId={selection.commissionId}
              onChange={(commissionId) => onSelectCommission(selection.subjectId, commissionId)}
              first={i === 0}
            />
          );
        })}
      </div>
    </div>
  );
}

function SubjectCommissionRow({
  subject,
  selectedCommissionId,
  onChange,
  first,
}: {
  subject: AvailableSubject;
  selectedCommissionId: string | null;
  onChange: (commissionId: string | null) => void;
  first: boolean;
}) {
  const selected = subject.commissions.find((c) => c.id === selectedCommissionId) ?? null;

  return (
    <div style={{ padding: '10px 0', borderTop: first ? 'none' : '1px solid var(--line)' }}>
      <div className="text-ink-1" style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
        {subject.code} · {subject.name}
      </div>
      {subject.commissions.length === 0 ? (
        <p className="text-ink-4" style={{ fontSize: 11.5, margin: 0 }}>
          Sin oferta cargada para este período.
        </p>
      ) : (
        <>
          <select
            aria-label={`Comisión de ${subject.name}`}
            value={selectedCommissionId ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
            className="border border-line rounded"
            style={{ padding: '6px 10px', fontSize: 12.5, background: 'var(--bg)', width: '100%' }}
          >
            <option value="">Sin elegir comisión</option>
            {subject.commissions.map((c) => (
              <option key={c.id} value={c.id}>
                Comisión {c.name} · {formatCommissionModality(c.modality)}
              </option>
            ))}
          </select>
          {selected && (
            <p
              className="text-ink-3"
              style={{ fontSize: 11.5, margin: '6px 0 0', lineHeight: 1.4 }}
            >
              {selected.teacherNames.length > 0
                ? selected.teacherNames.join(', ')
                : 'Sin docente asignado'}{' '}
              · {formatScheduleSummary(selected.schedule)}
            </p>
          )}
        </>
      )}
    </div>
  );
}
