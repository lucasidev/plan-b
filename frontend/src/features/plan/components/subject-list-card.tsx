'use client';

import { Suspense, useState } from 'react';
import type { AvailableSubject } from '../types';
import { SubjectPickerDrawer } from './subject-picker-drawer';

/**
 * Materia sumada a la combinación actual (US-023), ya resuelta contra el catálogo para mostrarse:
 * `code`/`name` salen de `AvailableSubject`, `commissionName` de la comisión elegida (si hay). Lo
 * arma `ActiveTab` a partir de `selections` + el catálogo; este componente no sabe de dónde sale.
 */
export type SelectedSubjectRow = {
  subjectId: string;
  code: string;
  name: string;
  commissionName: string | null;
};

/**
 * Side list de la combinación armada en "En curso" (US-023, antes US-046 con datos mock). Header
 * con título + contador, filas con code + name + comisión elegida (si hay), botón "x sacar" por
 * fila, y un CTA final "+ Agregar materia" que abre el drawer.
 *
 * Antes mostraba `simulation.subjects`, un array mock fijo sin relación con lo que el alumno
 * elegía (US-046/US-016): ahora muestra `rows`, derivado de la selección real de la sesión
 * (`CommissionSelection[]`), así que "x sacar" pasa a tener efecto real (`onRemoveSubject`). Se
 * dejaron afuera la píldora de modalidad/cadencia y la de dificultad por materia: la primera no
 * aporta nada nuevo en esta vista (ya está acotada al período elegido) y la segunda no tiene fuente
 * real (`AvailableSubject` no trae una dificultad por materia; la única real es la ponderada de la
 * combinación entera, en el panel de métricas de arriba).
 */
export function SubjectListCard({
  rows,
  onAddSubject,
  onRemoveSubject,
  termId,
}: {
  rows: SelectedSubjectRow[];
  onAddSubject?: (subject: AvailableSubject) => void;
  onRemoveSubject?: (subjectId: string) => void;
  termId: string | null;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="bg-bg-card border border-line rounded-lg" style={{ padding: 16 }}>
        <div
          style={{
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <h2 className="text-base font-semibold text-ink-1" style={{ margin: 0 }}>
            Materias elegidas
          </h2>
          <small className="text-ink-3" style={{ fontWeight: 400 }}>
            {rows.length}
          </small>
        </div>
        {rows.length === 0 && (
          <p className="text-ink-3" style={{ fontSize: 12.5, padding: '4px 0 12px' }}>
            Todavía no sumaste materias.
          </p>
        )}
        {rows.map((row, i) => (
          <div
            key={row.subjectId}
            style={{
              padding: '11px 0',
              borderTop: i ? '1px solid var(--line)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <div>
                <div
                  className="text-ink-3"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.04em',
                    marginBottom: 2,
                  }}
                >
                  {row.code}
                </div>
                <div
                  className="text-ink-1"
                  style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}
                >
                  {row.name}
                </div>
                {row.commissionName && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 5,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--line-2, var(--line))',
                      color: 'var(--ink-3)',
                    }}
                  >
                    com {row.commissionName}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label={`Sacar ${row.name}`}
                onClick={() => onRemoveSubject?.(row.subjectId)}
                className="text-ink-4 hover:text-ink-2 transition-colors"
                style={{
                  appearance: 'none',
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-accent hover:bg-bg-elev transition-colors"
          style={{
            padding: '10px 0',
            marginTop: 8,
            fontSize: 12.5,
            width: '100%',
            border: '1px dashed var(--line)',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          + Agregar materia
        </button>
      </div>

      {/* Suspense porque el drawer lee useSuspenseQuery: normalmente resuelve al toque desde el
          cache hidratado por la RSC de /plan, pero el boundary es la red de contención si algún
          día suspende de verdad (invalidación, navegación sin SSR fresco). Fallback null: cerrado
          no muestra nada igual, y abierto resuelve sin parpadeo en el camino feliz. */}
      <Suspense fallback={null}>
        <SubjectPickerDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onPick={(subject) => {
            onAddSubject?.(subject);
            setDrawerOpen(false);
          }}
          termId={termId}
        />
      </Suspense>
    </>
  );
}
