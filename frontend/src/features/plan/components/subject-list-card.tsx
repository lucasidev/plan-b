'use client';

import { useState } from 'react';
import type { Subject } from '../types';
import { ModalityPill } from './modality-pill';
import { SubjectPickerDrawer } from './subject-picker-drawer';

const DIFF_PALETTE: Record<string, [string, string]> = {
  hi: ['oklch(0.92 0.06 25)', 'oklch(0.45 0.15 25)'],
  mid: ['oklch(0.93 0.05 70)', 'oklch(0.48 0.13 65)'],
  lo: ['oklch(0.94 0.05 145)', 'oklch(0.42 0.09 145)'],
};

function diffBucket(d: number): 'hi' | 'mid' | 'lo' {
  return d >= 4 ? 'hi' : d === 3 ? 'mid' : 'lo';
}

/**
 * Side list of subjects in the period (US-046). Header with title + count, rows with
 * code + name + pills (modality, commission, difficulty), per-subject "× sacar"
 * button, and a final "+ Agregar materia" CTA that opens the drawer.
 */
export function SubjectListCard({ subjects }: { subjects: Subject[] }) {
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
            Materias del año
          </h2>
          <small className="text-ink-3" style={{ fontWeight: 400 }}>
            {subjects.length}
          </small>
        </div>
        {subjects.map((s, i) => {
          const [bg, fg] = DIFF_PALETTE[diffBucket(s.diff)];
          return (
            <div
              key={s.code}
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
                  marginBottom: 6,
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
                    {s.code}
                  </div>
                  <div
                    className="text-ink-1"
                    style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}
                  >
                    {s.name}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Sacar ${s.name}`}
                  className="text-ink-4 hover:text-ink-2 transition-colors"
                  style={{
                    appearance: 'none',
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 2,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <ModalityPill mod={s.mod} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'var(--line-2, var(--line))',
                    color: 'var(--ink-3)',
                  }}
                >
                  com {s.com}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: bg,
                    color: fg,
                  }}
                >
                  dif {s.diff}
                </span>
              </div>
            </div>
          );
        })}
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

      <SubjectPickerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPick={() => setDrawerOpen(false)}
      />
    </>
  );
}
