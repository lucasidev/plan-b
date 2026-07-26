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
import { updateSimulationDraftAction } from '../actions';
import { SIMULATION_DRAFTS_QUERY_KEY } from '../api';
import type { SimulationDraft } from '../types';

type Props = {
  draft: SimulationDraft | null;
  onClose: () => void;
};

/**
 * Editar borrador (US-023): al menos nombre + quitar materias, reusando el mismo `Dialog` que ya
 * usa `PublishPlanModal` en vez de inventar un componente de modal nuevo. Sumar materias no entra
 * acá (el AC de esta US lo acota a "label + quitar materias"): eso pasa por el drawer "Agregar
 * materia" de la pestaña En curso.
 *
 * `EditDraftForm` está `key`eado por `draft.id` para que el estado local (nombre, materias)
 * se reinicie solo al abrir un borrador distinto, sin un efecto de sincronización a mano.
 */
export function EditDraftModal({ draft, onClose }: Props) {
  return (
    <Dialog open={draft !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {draft && <EditDraftForm key={draft.id} draft={draft} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditDraftForm({ draft, onClose }: { draft: SimulationDraft; onClose: () => void }) {
  const [label, setLabel] = useState(draft.label ?? '');
  const [items, setItems] = useState(draft.items);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleRemove(subjectId: string) {
    setItems((prev) => prev.filter((item) => item.subjectId !== subjectId));
  }

  function handleSave() {
    if (items.length === 0) {
      setError('Un borrador necesita al menos una materia.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateSimulationDraftAction(
        draft.id,
        label.trim() || null,
        items.map((item) => ({ subjectId: item.subjectId, commissionId: item.commissionId })),
      );
      if (result.status === 'success') {
        queryClient.invalidateQueries({ queryKey: SIMULATION_DRAFTS_QUERY_KEY });
        onClose();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar borrador</DialogTitle>
        <DialogDescription>
          Cambiá el nombre o sacá materias. Para sumar materias nuevas, entrá a la pestaña En curso.
        </DialogDescription>
      </DialogHeader>

      <TextField
        label="Nombre (opcional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={100}
        disabled={isPending}
      />

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
        {items.map((item, i) => (
          <div
            key={item.subjectId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              borderTop: i ? '1px solid var(--line)' : 'none',
            }}
          >
            <div>
              <span
                className="text-ink-3"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 8 }}
              >
                {item.subjectCode}
              </span>
              <span className="text-ink-1" style={{ fontSize: 13 }}>
                {item.subjectName}
              </span>
              {item.commissionName && (
                <span className="text-ink-3" style={{ fontSize: 12 }}>
                  {' '}
                  · com {item.commissionName}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={`Quitar ${item.subjectName}`}
              onClick={() => handleRemove(item.subjectId)}
              disabled={isPending}
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
        ))}
      </div>

      {error && (
        <p role="alert" className="text-st-failed-fg" style={{ fontSize: 13, margin: 0 }}>
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogFooter>
    </>
  );
}
