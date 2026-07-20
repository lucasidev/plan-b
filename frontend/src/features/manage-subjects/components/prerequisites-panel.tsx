'use client';

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useActionState, useEffect, useId, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { addPrerequisiteAction, removePrerequisiteAction } from '../actions';
import { prerequisiteQueries } from '../api';
import {
  type AdminSubjectRow,
  initialManagePrerequisiteState,
  type PrerequisiteEdge,
  type PrerequisiteType,
} from '../types';

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3 disabled:opacity-50';

const TYPE_LABELS: Record<PrerequisiteType, string> = {
  ParaCursar: 'Para cursar',
  ParaRendir: 'Para rendir',
};

/**
 * Panel de correlativas de un plan de estudios (US-062 admin), debajo del listado de materias. Alta
 * (materia + correlativa + tipo) + dos listas separadas por tipo (ADR-0003: "para cursar" y "para
 * rendir" son dos DAGs distintos sobre las mismas materias, así que nunca se muestran mezclados). El
 * grafo es una TanStack Query (prefetcheada en la RSC de la página); las mutaciones invalidan ese
 * query para refrescar client-side (mismo patrón que CareerPlansPanel, ADR-0021 + ADR-0046).
 */
export function PrerequisitesPanel({
  planId,
  subjects,
}: {
  planId: string;
  subjects: AdminSubjectRow[];
}) {
  const { data: edges } = useSuspenseQuery(prerequisiteQueries.forPlan(planId));
  const subjectsById = new Map(subjects.map((s) => [s.id, s]));

  return (
    <div className="mt-6 rounded-lg border border-line bg-bg-card">
      <div className="border-b border-line px-4 py-3">
        <h2 className="m-0 font-display text-[15px] font-semibold text-ink">Correlativas</h2>
        <p className="m-0 mt-1 text-[12px] text-ink-3">
          Para cursar y para rendir son grafos separados: una correlativa en uno no implica la otra.
        </p>
      </div>

      <AddPrerequisiteForm planId={planId} subjects={subjects} />

      <div className="grid grid-cols-1 border-t border-line sm:grid-cols-2">
        <PrerequisiteTypeList
          title={TYPE_LABELS.ParaCursar}
          type="ParaCursar"
          edges={edges.filter((e) => e.type === 'ParaCursar')}
          subjectsById={subjectsById}
          planId={planId}
        />
        <PrerequisiteTypeList
          title={TYPE_LABELS.ParaRendir}
          type="ParaRendir"
          edges={edges.filter((e) => e.type === 'ParaRendir')}
          subjectsById={subjectsById}
          planId={planId}
          className="border-t border-line sm:border-t-0 sm:border-l"
        />
      </div>
    </div>
  );
}

function AddPrerequisiteForm({
  planId,
  subjects,
}: {
  planId: string;
  subjects: AdminSubjectRow[];
}) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    addPrerequisiteAction,
    initialManagePrerequisiteState,
  );
  const [subjectId, setSubjectId] = useState('');
  const ids = { subjectId: useId(), requiredSubjectId: useId(), type: useId() };

  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    setSubjectId('');
    queryClient.invalidateQueries({ queryKey: prerequisiteQueries.forPlan(planId).queryKey });
  }, [state, queryClient, planId]);

  const candidateRequired = subjects.filter((s) => s.id !== subjectId);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3.5"
    >
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <label htmlFor={ids.subjectId} className="text-[12px] font-medium text-ink-2">
          Materia
        </label>
        <select
          id={ids.subjectId}
          name="subjectId"
          required
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className={inputClass}
        >
          <option value="">Elegí una materia</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <label htmlFor={ids.requiredSubjectId} className="text-[12px] font-medium text-ink-2">
          Correlativa
        </label>
        <select
          key={subjectId}
          id={ids.requiredSubjectId}
          name="requiredSubjectId"
          required
          disabled={!subjectId}
          defaultValue=""
          className={inputClass}
        >
          <option value="">Elegí la materia correlativa</option>
          {candidateRequired.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={ids.type} className="text-[12px] font-medium text-ink-2">
          Tipo
        </label>
        <select
          id={ids.type}
          name="type"
          required
          defaultValue=""
          className={cn(inputClass, 'w-40')}
        >
          <option value="">Elegí un tipo</option>
          <option value="ParaCursar">{TYPE_LABELS.ParaCursar}</option>
          <option value="ParaRendir">{TYPE_LABELS.ParaRendir}</option>
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? 'Agregando...' : 'Agregar correlativa'}
      </Button>
      {state.status === 'error' && (
        <p className="m-0 w-full text-[12px] text-st-failed-fg" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

function PrerequisiteTypeList({
  title,
  type,
  edges,
  subjectsById,
  planId,
  className,
}: {
  title: string;
  type: PrerequisiteType;
  edges: PrerequisiteEdge[];
  subjectsById: Map<string, AdminSubjectRow>;
  planId: string;
  className?: string;
}) {
  const sorted = sortEdges(edges, subjectsById);

  return (
    <div className={cn('px-4 py-3.5', className)}>
      <h3 className="m-0 mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
        {title} · {edges.length}
      </h3>
      {sorted.length === 0 ? (
        <p className="m-0 text-[12px] text-ink-4">Todavía no hay correlativas de este tipo.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {sorted.map((edge) => (
            <PrerequisiteChip
              key={`${edge.subjectId}-${edge.requiredSubjectId}`}
              edge={edge}
              type={type}
              subjectsById={subjectsById}
              planId={planId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PrerequisiteChip({
  edge,
  type,
  subjectsById,
  planId,
}: {
  edge: PrerequisiteEdge;
  type: PrerequisiteType;
  subjectsById: Map<string, AdminSubjectRow>;
  planId: string;
}) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const subject = subjectsById.get(edge.subjectId);
  const required = subjectsById.get(edge.requiredSubjectId);
  const subjectLabel = subject?.code ?? edge.subjectId;
  const requiredLabel = required?.code ?? edge.requiredSubjectId;

  function runRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removePrerequisiteAction(edge.subjectId, edge.requiredSubjectId, type);
      if (result.ok) {
        await queryClient.invalidateQueries({
          queryKey: prerequisiteQueries.forPlan(planId).queryKey,
        });
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <li className="flex flex-col gap-1 rounded-md bg-bg-elev px-2.5 py-1.5 text-[12px]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-ink">
          <span className="font-mono text-ink-2">{subjectLabel}</span> requiere{' '}
          <span className="font-mono text-ink-2">{requiredLabel}</span>
        </span>
        <button
          type="button"
          onClick={runRemove}
          disabled={isPending}
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-ink-3 hover:bg-st-failed-bg hover:text-st-failed-fg disabled:opacity-50"
          aria-label={`Quitar correlativa: ${subjectLabel} requiere ${requiredLabel}`}
        >
          {isPending ? '...' : 'Quitar'}
        </button>
      </div>
      {error && (
        <p className="m-0 text-[11px] text-st-failed-fg" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

function sortEdges(
  edges: PrerequisiteEdge[],
  subjectsById: Map<string, AdminSubjectRow>,
): PrerequisiteEdge[] {
  return [...edges].sort((a, b) => {
    const codeA = subjectsById.get(a.subjectId)?.code ?? '';
    const codeB = subjectsById.get(b.subjectId)?.code ?? '';
    if (codeA !== codeB) return codeA.localeCompare(codeB);
    const reqA = subjectsById.get(a.requiredSubjectId)?.code ?? '';
    const reqB = subjectsById.get(b.requiredSubjectId)?.code ?? '';
    return reqA.localeCompare(reqB);
  });
}
