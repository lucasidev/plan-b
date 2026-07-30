'use client';

import { useQueryClient } from '@tanstack/react-query';
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
import { shareSimulationDraftAction } from '../actions';
import { PUBLIC_SIMULATIONS_QUERY_KEY, SIMULATION_DRAFTS_QUERY_KEY } from '../api';
import type { SimulationDraft } from '../types';

type Props = {
  draft: SimulationDraft | null;
  /** Label a mostrar: label propio del borrador o el fallback con el período, ya resuelto por el caller. */
  label: string;
  onClose: () => void;
};

/**
 * "Compartir con la comunidad" (US-024): antes de publicar el borrador al feed público
 * (`public-feed-tab.tsx`, US-027), le explica al alumno lo que el backend hace de verdad, sin
 * prometer nada que no cumpla: se muestra sin su nombre, solo a alumnos de su mismo plan y período,
 * y puede volver a privado cuando quiera (descompartir ya es idempotente y no repite esta
 * explicación, ver `handleUnshare` en `draft-list.tsx`).
 */
export function ShareDraftModal({ draft, label, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  if (!draft) return null;

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleConfirm() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await shareSimulationDraftAction(draft.id);
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PUBLIC_SIMULATIONS_QUERY_KEY });
        onClose();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir "{label}" con la comunidad</DialogTitle>
          <DialogDescription>
            Se va a mostrar sin tu nombre a otros alumnos de tu mismo plan de carrera y período, en
            la pestaña Comunidad. Podés volverlo privado cuando quieras.
          </DialogDescription>
        </DialogHeader>

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
            {isPending ? 'Compartiendo...' : 'Compartir borrador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
