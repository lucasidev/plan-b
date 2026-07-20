'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { availableSubjectsQueries } from '../api';
import type { AvailabilityStatus, AvailableSubject, BlockedBySubject } from '../types';

/**
 * "Agregar materia" drawer (US-046 shell, cableado a datos reales por US-016). Catálogo de
 * materias del plan evaluadas contra el historial del alumno (GET /api/me/simulator/available):
 * disponibles (clickeables, se pueden sumar a la simulación) y bloqueadas (deshabilitadas, con el
 * motivo). Las que ya aprobó, regularizó o está cursando no se listan: no tiene sentido sumarlas a
 * una simulación del cuatrimestre que viene.
 *
 * Sin ModalityPill ni chip de profesor: esos datos son de Commission (la oferta de un
 * cuatrimestre puntual), no de Subject. TODO(US-093): cuando exista el backoffice de comisiones,
 * volver a mostrar modalidad + docente acá con la oferta real del próximo período.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (subject: AvailableSubject) => void;
};

const VISIBLE_STATUSES: ReadonlySet<AvailabilityStatus> = new Set(['Available', 'Blocked']);

/**
 * Disponibles + bloqueadas (con motivo). Las ya aprobadas/regularizadas/en curso quedan afuera:
 * no tiene sentido ofrecerlas para sumar a una simulación del cuatrimestre que viene.
 */
export function selectVisibleSubjects(items: readonly AvailableSubject[]): AvailableSubject[] {
  return items.filter((item) => VISIBLE_STATUSES.has(item.status));
}

/**
 * "Año 2 · Cuatrimestral 1" / "Año 2 · Anual" (Anual nunca trae termInYear, invariante del
 * backend). Sin traducir a ordinales: mismo criterio simple que `SubjectHeader` de view-subject
 * (termKind ya viaja en español desde el backend).
 */
export function formatSubjectPeriod(
  yearInPlan: number,
  termInYear: number | null,
  termKind: string,
): string {
  const term = termInYear !== null ? `${termKind} ${termInYear}` : termKind;
  return `Año ${yearInPlan} · ${term}`;
}

/** "Te falta aprobar o regularizar: MAT101 Análisis Matemático I, FIS101 Física I". */
export function formatBlockedReason(blockedBy: readonly BlockedBySubject[]): string {
  const list = blockedBy.map((b) => `${b.code} ${b.name}`).join(', ');
  return `Te falta aprobar o regularizar: ${list}`;
}

export function SubjectPickerDrawer({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  const { data } = useSuspenseQuery(availableSubjectsQueries.list());

  if (!open) return null;

  const visible = selectVisibleSubjects(data.items);
  const filtered = visible.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar drawer"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40"
        style={{ border: 0, cursor: 'pointer' }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Agregar materia"
        className="bg-bg border-l border-line"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          gap: 14,
          overflowY: 'auto',
        }}
      >
        <header className="flex items-start justify-between">
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
              Catálogo
            </div>
            <h2 className="text-lg font-semibold text-ink-1" style={{ margin: 0 }}>
              Agregar materia
            </h2>
            <p className="text-sm text-ink-3" style={{ marginTop: 4, lineHeight: 1.45 }}>
              Filtradas por tu plan + historial. Sumá las que querés simular.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-ink-3 hover:text-ink-1"
            style={{
              appearance: 'none',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código o nombre..."
          aria-label="Buscar materia"
          className="border border-line rounded"
          style={{
            padding: '9px 12px',
            fontSize: 13,
            background: 'var(--bg)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.length === 0 ? (
            <p className="text-sm text-ink-3" style={{ padding: 16, textAlign: 'center' }}>
              No tenés materias disponibles para el próximo cuatrimestre.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink-3" style={{ padding: 16, textAlign: 'center' }}>
              No encontramos materias con "{query}".
            </p>
          ) : (
            filtered.map((s) =>
              s.status === 'Blocked' ? (
                <BlockedSubjectCard key={s.id} subject={s} />
              ) : (
                <AvailableSubjectCard key={s.id} subject={s} onPick={onPick} />
              ),
            )
          )}
        </div>
      </aside>
    </>
  );
}

function AvailableSubjectCard({
  subject,
  onPick,
}: {
  subject: AvailableSubject;
  onPick: (subject: AvailableSubject) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(subject)}
      className="bg-bg-card border border-line hover:border-accent-soft transition-colors text-left"
      style={{
        padding: 12,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <SubjectHeading code={subject.code} name={subject.name} />
        <span className="text-accent" style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          + Sumar
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <InfoPill>
          {formatSubjectPeriod(subject.yearInPlan, subject.termInYear, subject.termKind)}
        </InfoPill>
        <InfoPill>{subject.weeklyHours} hs/sem</InfoPill>
      </div>
    </button>
  );
}

function BlockedSubjectCard({ subject }: { subject: AvailableSubject }) {
  return (
    <div
      className="bg-bg-elev border border-line"
      style={{
        padding: 12,
        borderRadius: 8,
        cursor: 'not-allowed',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <SubjectHeading code={subject.code} name={subject.name} muted />
        <span
          className="text-ink-4"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            fontWeight: 600,
            flexShrink: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Bloqueada
        </span>
      </div>
      <p className="text-ink-4" style={{ fontSize: 11.5, lineHeight: 1.4, margin: 0 }}>
        {formatBlockedReason(subject.blockedBy)}
      </p>
    </div>
  );
}

function SubjectHeading({ code, name, muted }: { code: string; name: string; muted?: boolean }) {
  return (
    <div>
      <div
        className="text-ink-3"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em' }}
      >
        {code}
      </div>
      <div
        className={muted ? 'text-ink-4' : 'text-ink-1'}
        style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}
      >
        {name}
      </div>
    </div>
  );
}

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-ink-3"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        padding: '2px 8px',
        borderRadius: 999,
        background: 'var(--bg-elev, var(--bg))',
      }}
    >
      {children}
    </span>
  );
}
