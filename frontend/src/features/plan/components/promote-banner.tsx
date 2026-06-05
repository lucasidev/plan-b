'use client';

import { daysSinceDraftStart } from '../hooks/use-active-academic-period';
import type { AcademicPeriod, Simulation } from '../types';

/**
 * Nudge banner shown when a draft references a period whose start date is already past
 * (US-046). Appears in the "Borrador" tab with copy like: "Tu borrador para 2026/2c
 * empezó hace 3 días. ¿Lo activás como en-curso?".
 *
 * The backend does not decide automatically: the student may have changed plan,
 * dropped subjects, or postponed enrollment. Manual promotion with nudge (see US-046
 * doc).
 */
type Props = {
  draft: Simulation;
  onActivate: (draft: Simulation) => void;
};

export function PromoteBanner({ draft, onActivate }: Props) {
  const days = daysSinceDraftStart(draft.period);
  const label = formatTermLabel(draft.period);

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, var(--accent-soft) 0%, transparent 100%)',
        border: '1px solid oklch(0.85 0.07 55)',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div>
        <div
          className="text-accent"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          Borrador · {label}
        </div>
        <div className="text-ink-1" style={{ fontSize: 14, lineHeight: 1.45 }}>
          Tu borrador para <b>{label}</b> empezó hace{' '}
          <b>{days === 0 ? 'hoy' : days === 1 ? '1 día' : `${days} días`}</b>. ¿Lo activás como
          en-curso?
        </div>
      </div>
      <button
        type="button"
        onClick={() => onActivate(draft)}
        className="bg-accent text-white border border-accent rounded-pill hover:opacity-90"
        style={{
          padding: '8px 14px',
          fontSize: 12.5,
          fontWeight: 500,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Activar
      </button>
    </div>
  );
}

function formatTermLabel(p: AcademicPeriod): string {
  return `${p.year} · ${p.term === '1c' ? '1er cuatri' : '2do cuatri'}`;
}
