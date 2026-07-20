import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pill } from '@/components/ui';
import type { CareerPlan } from '../types';

/**
 * Listado de planes de estudio de una carrera (US-001, `/careers/[id]/plans`). El AC pide no
 * ocultar los históricos (un alumno puede seguir cursando bajo un plan Deprecated), así que
 * siempre se muestran todos; solo se ordena para que el/los vigentes queden primero.
 */
export function PlanList({ plans }: { plans: CareerPlan[] }) {
  if (plans.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">
        Esta carrera todavía no tiene planes de estudio cargados.
      </p>
    );
  }

  const sorted = [...plans].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
    return b.year - a.year;
  });

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((plan) => {
        const isActive = plan.status === 'Active';
        return (
          <li key={plan.id}>
            <Link
              href={`/plans/${plan.id}/subjects`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
            >
              <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                Plan {plan.year}
                {!plan.isOfficial && <Pill>No oficial</Pill>}
              </span>
              <span className="flex items-center gap-3">
                <Pill tone={isActive ? 'good' : 'neutral'}>
                  {isActive ? 'Vigente' : 'Histórico'}
                </Pill>
                <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
