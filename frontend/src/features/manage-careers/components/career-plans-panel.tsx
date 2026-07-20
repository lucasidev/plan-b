'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import { createPlanAction, deprecatePlanAction, reactivatePlanAction } from '../actions';
import { careerPlanQueries } from '../api';
import { type CareerPlanRow, initialManagePlanState } from '../types';

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

/**
 * Panel de planes de estudio de una carrera (US-061 admin), en el detalle. Alta inline (año + label)
 * + tabla de planes con transición de estado. El modelo es year + status (ADR-0049): un plan por
 * año, Active (vigente) o Deprecated. Los planes son una TanStack Query (prefetcheada en la RSC del
 * detalle); las mutaciones invalidan ese query para refrescar client-side (ADR-0046): router.refresh()
 * no reflejaba de forma confiable una mutación en la misma página en prod build.
 *
 * Cada plan linkea a su backoffice de materias (US-062, `/plans/{id}/subjects`). Del mock de detalle
 * queda afuera, por no tener backend todavía: la columna Alumnos (US-093), "Editar plan" (no hay
 * PATCH de plan: el plan solo muta de estado) y "Migrar" + el estado intermedio "transición"
 * (US-084). Acá los estados son los dos reales: vigente/deprecado.
 */
export function CareerPlansPanel({
  careerId,
  universityId,
}: {
  careerId: string;
  universityId: string;
}) {
  const { data: plans } = useSuspenseQuery(careerPlanQueries.forCareer(careerId));

  return (
    <div className="rounded-lg border border-line bg-bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="m-0 font-display text-[15px] font-semibold text-ink">Planes de estudio</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
          versionados por año
        </span>
      </div>

      <AddPlanForm careerId={careerId} />

      {plans.length === 0 ? (
        <p className="m-0 px-4 py-8 text-center text-[12.5px] text-ink-3">
          Todavía no hay planes cargados. Agregá el primero con el formulario de arriba.
        </p>
      ) : (
        <PlansTable careerId={careerId} universityId={universityId} plans={plans} />
      )}
    </div>
  );
}

function AddPlanForm({ careerId }: { careerId: string }) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(createPlanAction, initialManagePlanState);
  const ids = { year: useId(), label: useId() };

  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    queryClient.invalidateQueries({ queryKey: careerPlanQueries.forCareer(careerId).queryKey });
  }, [state, queryClient, careerId]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3.5"
    >
      <input type="hidden" name="careerId" value={careerId} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.year} className="text-[12px] font-medium text-ink-2">
          Año
        </label>
        <input
          id={ids.year}
          name="year"
          type="number"
          required
          min={1950}
          placeholder="Ej: 2023"
          className={cn(inputClass, 'w-28')}
        />
      </div>
      <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
        <label htmlFor={ids.label} className="text-[12px] font-medium text-ink-2">
          Identificador
        </label>
        <input
          id={ids.label}
          name="label"
          maxLength={60}
          placeholder="Opcional. Ej: plan-2023"
          className={inputClass}
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending || !hydrated}>
        {isPending ? 'Agregando...' : 'Agregar plan'}
      </Button>
      {state.status === 'error' && (
        <p className="m-0 w-full text-[12px] text-st-failed-fg" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

const GRID = 'minmax(0,90px) minmax(0,1fr) 110px 190px';

function PlansTable({
  careerId,
  universityId,
  plans,
}: {
  careerId: string;
  universityId: string;
  plans: CareerPlanRow[];
}) {
  return (
    <div className="text-[12.5px]">
      <div
        className="grid items-center gap-3.5 border-b border-line bg-bg-elev px-4 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3"
        style={{ gridTemplateColumns: GRID, height: 30 }}
      >
        <div>Año</div>
        <div>Identificador</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {plans.map((plan) => (
        <PlanRow key={plan.id} careerId={careerId} universityId={universityId} plan={plan} />
      ))}
    </div>
  );
}

function PlanRow({
  careerId,
  universityId,
  plan,
}: {
  careerId: string;
  universityId: string;
  plan: CareerPlanRow;
}) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isActive = plan.status === 'Active';

  function runToggle() {
    setError(null);
    startTransition(async () => {
      const result = isActive
        ? await deprecatePlanAction(plan.id)
        : await reactivatePlanAction(plan.id);
      if (result.ok) {
        await queryClient.invalidateQueries({
          queryKey: careerPlanQueries.forCareer(careerId).queryKey,
        });
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="border-b border-line-2 last:border-b-0">
      <div
        className={cn('grid items-center gap-3.5 px-4 py-2', !isActive && 'opacity-60')}
        style={{ gridTemplateColumns: GRID }}
      >
        <div className="font-mono text-ink">{plan.year}</div>
        <div className="truncate text-ink-2">
          {plan.label ?? <span className="text-ink-4">sin identificador</span>}
        </div>
        <div>
          <PlanStatusBadge active={isActive} />
        </div>
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/universities/${universityId}/careers/${careerId}/plans/${plan.id}/subjects`}
            className="rounded-md px-2 py-1 text-[11.5px] text-ink-2 hover:bg-bg-elev hover:text-ink"
          >
            Materias
          </Link>
          <button
            type="button"
            onClick={runToggle}
            disabled={isPending}
            className={cn(
              'rounded-md px-2 py-1 text-[11.5px] disabled:opacity-50',
              isActive
                ? 'text-accent-ink hover:bg-accent-soft'
                : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
            )}
          >
            {isPending ? '...' : isActive ? 'Deprecar' : 'Reactivar'}
          </button>
        </div>
      </div>
      {error && (
        <p className="m-0 px-4 pb-2 text-[11.5px] text-st-failed-fg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PlanStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em]',
        active ? 'bg-st-approved-bg text-st-approved-fg' : 'bg-st-pending-bg text-st-pending-fg',
      )}
    >
      {active ? 'VIGENTE' : 'DEPRECADO'}
    </span>
  );
}
