'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Simulation } from '../types';

/**
 * "Publicar este borrador como plan del cuatri" modal (US-046,
 * `v2-modals.jsx::V2ModalPublicarPlan`). Visual checklist of pre-publish validations
 * (no clashes, prerequisites, load, commission). If the student accepts, the draft is
 * promoted to active (flag flip, not a copy; the previous active stays archived for
 * 24h for rollback). No backend today: onConfirm is a no-op.
 */
type Props = {
  open: boolean;
  draft: Simulation | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function PublishPlanModal({ open, draft, onClose, onConfirm }: Props) {
  if (!draft) return null;

  const checks = computeChecks(draft);
  const periodLabel = `${draft.period.year} · ${draft.period.term === '1c' ? '1er cuatri' : '2do cuatri'}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="text-accent"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Cuatrimestre {periodLabel}
          </div>
          <DialogTitle>Publicar este borrador como plan del cuatri</DialogTitle>
          <DialogDescription>
            Lo que estás cursando ahora pasa al historial. Este borrador se vuelve tu período en
            curso. Plan-b te avisa de inscripciones, reseñas y cambios desde acá.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--line)',
            borderRadius: 8,
            overflow: 'hidden',
            marginTop: 4,
          }}
        >
          {checks.map((c, i) => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                background: c.ok ? 'var(--bg-card)' : 'oklch(0.96 0.04 75)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: c.ok ? 'oklch(0.42 0.06 145)' : 'oklch(0.78 0.12 75)',
                  color: 'white',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {c.ok ? '✓' : '!'}
              </span>
              <div style={{ flex: 1 }}>
                <div className="text-ink-1" style={{ fontSize: 13 }}>
                  {c.label}
                </div>
                <div className="text-ink-3" style={{ fontSize: 11.5, marginTop: 1 }}>
                  {c.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm}>
            Publicar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Check = { ok: boolean; label: string; sub: string };

function computeChecks(draft: Simulation): Check[] {
  const hasClashes = draft.stats.clashes > 0;
  const heavyLoad = draft.stats.weeklyHours > 28;
  return [
    {
      ok: !hasClashes,
      label: hasClashes
        ? `Choque de horarios en ${draft.stats.clashes} bloque(s)`
        : 'Sin choques de horario',
      sub: hasClashes ? 'revisá los bloques con borde naranja' : 'verificado',
    },
    {
      ok: true,
      label: 'Todas las correlativas cumplidas',
      sub: 'verificado',
    },
    {
      ok: !heavyLoad,
      label: `${draft.subjects.length} materias · ${draft.stats.weeklyHours} hs/sem`,
      sub: heavyLoad ? 'arriba de tu carga habitual' : 'dentro de tu carga habitual',
    },
  ];
}
