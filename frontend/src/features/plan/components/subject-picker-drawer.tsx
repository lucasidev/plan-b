'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { MOCK_AVAILABLE_SUBJECTS } from '../data/mocks';
import type { Subject } from '../types';
import { ModalityPill } from './modality-pill';

/**
 * "Agregar materia" drawer (US-046). Filterable catalog of subjects the student can
 * take per their transcript + plan. Mock for now; when US-014 transcript + US-023
 * storage land, the filtering comes from the backend.
 *
 * Simple visual aligned with the subject cards of the v2 canvas. Clicking a subject
 * "adds" it (mock: closes the drawer; in production it fires the mutation).
 */
type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (s: Subject) => void;
};

export function SubjectPickerDrawer({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const filtered = MOCK_AVAILABLE_SUBJECTS.filter((s) => {
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
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-3" style={{ padding: 16, textAlign: 'center' }}>
              No encontramos materias con "{query}".
            </p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => onPick(s)}
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
                  <div>
                    <div
                      className="text-ink-3"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {s.code}
                    </div>
                    <div
                      className="text-ink-1"
                      style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}
                    >
                      {s.name}
                    </div>
                  </div>
                  <span
                    className="text-accent"
                    style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                  >
                    + Sumar
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <ModalityPill mod={s.mod} />
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
                    {s.prof}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
