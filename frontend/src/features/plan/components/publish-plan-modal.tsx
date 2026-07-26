'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { promoteSimulationDraftAction } from '../actions';
import { SIMULATION_DRAFTS_QUERY_KEY } from '../api';
import type { SimulationDraft } from '../types';

/**
 * "Publicar este borrador como plan del cuatri" modal (US-023, cableado; shell de US-046
 * `v2-modals.jsx::V2ModalPublicarPlan`). Confirma con un resumen de materias + comisión y publica
 * de verdad: POST /api/me/simulations/drafts/{id}/promote. El backend archiva el plan Active
 * anterior del mismo período en la misma transacción.
 *
 * El mock mostraba un checklist con choques de horario / correlativas / carga calculados a mano
 * (`computeChecks`, con la de correlativas ya hardcodeada en `ok: true` sin chequear nada real). El
 * endpoint de borradores no trae esos datos por materia: recalcularlos en este modal implicaría
 * evaluar la combinación de nuevo (POST /api/me/simulator/evaluate) para algo que el spec de esta US
 * no pidió, así que se reemplaza por un resumen honesto de lo que se va a publicar, sin inventar
 * validaciones que no se están corriendo de verdad.
 */
type Props = {
  draft: SimulationDraft | null;
  /** Label a mostrar: label propio del borrador o el fallback con el período, ya resuelto por el caller. */
  label: string;
  onClose: () => void;
};

export function PublishPlanModal({ draft, label, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!draft) return null;

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleConfirm() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await promoteSimulationDraftAction(draft.id);
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        onClose();
        // "Mostrá el resultado" (spec US-023): navega a "En curso" con el término del borrador
        // recién publicado, así el alumno ve directo que ya es su plan vigente, en vez de quedarse
        // en Borradores confiando en que la card desapareció por la invalidación.
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', 'active');
        params.set('termId', draft.termId);
        router.push(`?${params.toString()}`, { scroll: false });
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar "{label}" como tu período en curso</DialogTitle>
          <DialogDescription>
            Si ya tenías un plan publicado para este período, pasa a archivado. Este borrador se
            vuelve tu período en curso: Plan-b te avisa de inscripciones, reseñas y cambios desde
            acá.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border border-line rounded-lg"
          style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <p
            className="text-ink-3"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 2px',
            }}
          >
            {draft.items.length} {draft.items.length === 1 ? 'materia' : 'materias'}
          </p>
          {draft.items.map((item) => (
            <p key={item.subjectId} className="text-ink-2" style={{ fontSize: 12.5, margin: 0 }}>
              {item.subjectCode} · {item.subjectName}
              {item.commissionName ? ` · com ${item.commissionName}` : ''}
            </p>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-st-failed-fg" style={{ fontSize: 13, margin: 0 }}>
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Publicando...' : 'Publicar plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
