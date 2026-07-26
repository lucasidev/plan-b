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
import { TextField } from '@/components/ui/text-field';
import { createSimulationDraftAction } from '../actions';
import { SIMULATION_DRAFTS_QUERY_KEY } from '../api';
import type { CommissionSelection } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  termId: string;
  items: readonly CommissionSelection[];
};

/**
 * "Guardar como borrador" (US-023): convierte la combinación armada en "En curso" (materias +
 * comisiones elegidas en esta sesión) en un `SimulationDraft` real, así no se pierde al refrescar.
 * Es el flujo que le da sentido a todo lo demás en Planificar: sin esto, la selección era
 * puramente efímera. Nombre opcional; el borrador queda en la pestaña Borradores para editarlo o
 * publicarlo después.
 */
export function SaveDraftModal({ open, onClose, termId, items }: Props) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleClose() {
    setError(null);
    setLabel('');
    onClose();
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await createSimulationDraftAction(termId, label.trim() || null, items);
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        setLabel('');
        onClose();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar como borrador</DialogTitle>
          <DialogDescription>
            Guardá esta combinación para volver a ella cuando quieras. Vas a poder editarla o
            publicarla como tu período en curso desde la pestaña Borradores.
          </DialogDescription>
        </DialogHeader>

        <TextField
          label="Nombre (opcional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej: Plan liviano"
          maxLength={100}
          disabled={isPending}
        />

        {error && (
          <p role="alert" className="text-st-failed-fg" style={{ fontSize: 13, margin: 0 }}>
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar borrador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
