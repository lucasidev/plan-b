'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { resolveReportAction } from '../actions';
import type { ReportDecision } from '../types';

const QUEUE = '/admin/moderacion/reportes';

/**
 * Modal de confirmación antes de aplicar la decisión (US-051). Muestra el resumen + el cascade preview
 * (cuántos reports se cierran) y recién ahí dispara el POST. Éxito → vuelve a la cola (mutación pura,
 * ADR-0046: el cliente navega, el action no revalida). 409 (otro moderador ganó la race) → estado de
 * conflicto con botón para volver a la cola.
 */
export function ApplyDecisionModal({
  reportId,
  decision,
  note,
  cascadeCount,
  onClose,
}: {
  reportId: string;
  decision: ReportDecision;
  note: string;
  cascadeCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const isUphold = decision === 'uphold';
  const cascadeMsg =
    isUphold && cascadeCount > 0
      ? ` Esto también cierra ${cascadeCount} ${cascadeCount === 1 ? 'reporte' : 'reportes'} de la misma reseña por cascade.`
      : '';

  function backToQueue() {
    // Sin router.refresh(): la cola es force-dynamic + no-store, ya rinde fresca al navegar. El refresh
    // acá refrescaba la ruta actual (el detalle, del que todavia no saliste) y raceaba con el push,
    // dejando la URL en el detalle de forma intermitente. Mismo espiritu que ADR-0046: el cliente navega,
    // no fuerza un re-render que interfiera con la navegacion.
    router.push(QUEUE);
  }

  function apply() {
    setError(null);
    startTransition(async () => {
      const result = await resolveReportAction(reportId, decision, note);
      if (result.ok) {
        backToQueue();
        return;
      }
      if (result.conflict) {
        setConflict(true);
        return;
      }
      setError(result.message);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-bg-card p-5 shadow-card">
        {conflict ? (
          <>
            <h4 className="m-0 font-display text-[15px] font-semibold text-ink">
              Ya lo resolvió otro moderador
            </h4>
            <p className="mt-2 text-[12.5px] text-ink-2">
              Este reporte se cerró mientras lo mirabas. Volvé a la cola para ver el estado
              actualizado.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={backToQueue}
                className="h-8 rounded-md bg-ink px-4 text-[12.5px] font-medium text-white hover:bg-[#1a110a]"
              >
                Volver a la cola
              </button>
            </div>
          </>
        ) : (
          <>
            <h4 className="m-0 font-display text-[15px] font-semibold text-ink">
              {isUphold ? 'Ocultar esta reseña' : 'Aprobar esta reseña'}
            </h4>
            <p className="mt-2 text-[12.5px] text-ink-2">
              Vas a {isUphold ? 'ocultar' : 'aprobar'} esta reseña.{cascadeMsg} La decisión queda
              registrada en el audit log.
            </p>
            {error && (
              <p className="mt-2 text-[12px] text-st-failed-fg" role="alert">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="h-8 rounded-md border border-line px-3.5 text-[12.5px] text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={isPending}
                className="h-8 rounded-md bg-ink px-4 text-[12.5px] font-medium text-white hover:bg-[#1a110a] disabled:opacity-50"
              >
                {isPending ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
