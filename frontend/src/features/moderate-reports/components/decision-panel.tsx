'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ReportDecision } from '../types';
import { ApplyDecisionModal } from './apply-decision-modal';

/**
 * Una opción del panel de decisión. `decision` presente = acción live (US-051); ausente = placeholder
 * disabled que aterriza en US-085 (pedir edición, advertir, banear). El canvas quiere las 5 desde el
 * inicio para que el moderador no se acostumbre a una decisión binaria.
 */
type Option = {
  id: string;
  title: string;
  hint: string;
  decision?: ReportDecision;
  danger?: boolean;
};

const OPTIONS: Option[] = [
  {
    id: 'aprobar',
    title: 'Aprobar',
    hint: 'La crítica es legítima aunque dura. Se queda visible.',
    decision: 'dismiss',
  },
  {
    id: 'pedir-edicion',
    title: 'Pedir edición al autor',
    hint: 'Mensaje al autor con plazo de 48h para suavizar.',
  },
  {
    id: 'ocultar',
    title: 'Ocultar reseña',
    hint: 'Solo visible al autor. No banea.',
    decision: 'uphold',
  },
  {
    id: 'ocultar-advertir',
    title: 'Ocultar + advertir al autor',
    hint: 'Strike 1. Otra y va a ban temporal.',
    danger: true,
  },
  {
    id: 'ocultar-banear',
    title: 'Ocultar + banear al autor',
    hint: 'Acción terminal. Solo casos serios.',
    danger: true,
  },
];

/**
 * Panel "Decisión" del detalle (US-051). Radios (2 live + 3 placeholders US-085) + nota interna +
 * botón que abre el modal de confirmación. `canUphold` es false si la reseña ya está removed/deleted:
 * ahí "Ocultar" se deshabilita y solo queda "Aprobar" (desestimar).
 */
export function DecisionPanel({
  reportId,
  cascadeCount,
  canUphold,
}: {
  reportId: string;
  cascadeCount: number;
  canUphold: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const isLive = (o: Option) => o.decision !== undefined && (o.decision !== 'uphold' || canUphold);

  const selectedOption = OPTIONS.find((o) => o.id === selected) ?? null;
  const liveDecision =
    selectedOption != null && isLive(selectedOption) ? selectedOption.decision : undefined;
  const canApply = liveDecision !== undefined;

  return (
    <section className="rounded-lg border border-line bg-bg-card p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="m-0 font-display text-[14px] font-semibold text-ink">Decisión</h3>
        <small className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-4">
          queda en audit log
        </small>
      </header>

      <div className="flex flex-col gap-1.5">
        {OPTIONS.map((o) => {
          const disabled = !isLive(o);
          const active = selected === o.id;
          const tooltip = disabled
            ? o.decision === 'uphold' && !canUphold
              ? 'La reseña ya no está visible'
              : 'Próximamente · US-085'
            : undefined;
          return (
            <label
              key={o.id}
              title={tooltip}
              className={cn(
                'flex gap-2.5 rounded-md border p-2.5',
                disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
                active && o.danger && 'border-[#b04a1c] bg-accent-soft',
                active && !o.danger && 'border-ink bg-bg-elev',
                !active && 'border-line',
              )}
            >
              <input
                type="radio"
                name="decision"
                className="mt-0.5 flex-shrink-0"
                checked={active}
                disabled={disabled}
                onChange={() => setSelected(o.id)}
              />
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-[12.5px] font-medium',
                    o.danger ? 'text-[#b04a1c]' : 'text-ink',
                  )}
                >
                  {o.title}
                </span>
                <span className="block text-[11.5px] text-ink-3">{o.hint}</span>
              </span>
            </label>
          );
        })}
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-4">
          Nota interna (opcional)
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Razón de la decisión, para futuro."
          className="w-full resize-y rounded-md border border-line bg-bg px-2.5 py-2 text-[12.5px] text-ink placeholder:text-ink-4 focus:border-ink focus:outline-none"
        />
      </label>

      <button
        type="button"
        disabled={!canApply}
        onClick={() => setModalOpen(true)}
        className="mt-3 h-9 w-full rounded-md bg-ink text-[13px] font-medium text-white transition-colors hover:bg-[#1a110a] disabled:opacity-40"
      >
        Aplicar decisión
      </button>

      {modalOpen && liveDecision && (
        <ApplyDecisionModal
          reportId={reportId}
          decision={liveDecision}
          note={note}
          cascadeCount={cascadeCount}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
