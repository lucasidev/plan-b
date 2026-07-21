'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { createSubjectAction, updateSubjectAction } from '../actions';
import { SUBJECT_LIMITS } from '../schema';
import { initialManageSubjectState, type SubjectDetail } from '../types';

type Props = {
  /** create: alta bajo un plan (planId de la ruta). edit: prefill con el detalle. */
  mode: 'create' | 'edit';
  universityId: string;
  careerId: string;
  planId: string;
  subject?: SubjectDetail;
};

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3 disabled:opacity-50';

const TERM_KINDS = ['Bimestral', 'Cuatrimestral', 'Semestral', 'Anual'] as const;

/**
 * Form de alta/edición de materia (US-062 admin). React 19 primitives + Zod en el action, mismo
 * patrón que CareerForm/TermForm. El campo "Cuatrimestre / bimestre" se deshabilita cuando la
 * cadencia es Anual: un input disabled no viaja en el FormData, así el invariante del backend
 * (anual ⇒ term_in_year null) se cumple solo con el estado del <select>, sin lógica extra en el
 * submit. Mutación pura (ADR-0046): en success redirige al listado de materias del plan.
 */
export function SubjectForm({ mode, universityId, careerId, planId, subject }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateSubjectAction : createSubjectAction,
    initialManageSubjectState,
  );
  const [termKind, setTermKind] = useState(subject?.termKind ?? '');
  const isAnnual = termKind === 'Anual';

  const ids = {
    code: useId(),
    name: useId(),
    yearInPlan: useId(),
    termKind: useId(),
    termInYear: useId(),
    weeklyHours: useId(),
    totalHours: useId(),
    description: useId(),
  };

  const listHref = `/admin/universities/${universityId}/careers/${careerId}/plans/${planId}/subjects`;

  useEffect(() => {
    if (state.status !== 'success') return;
    // Solo `push`: el `refresh()` que había acá apuntaba a la ruta actual (el form) y competía con
    // la navegación recién iniciada, así que a veces se comía el redirect y el admin se quedaba en
    // el form creyendo que no se guardó nada. No hace falta: el listado es `force-dynamic`.
    router.push(listHref);
  }, [state, router, listHref]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {isEdit && subject ? (
        <input type="hidden" name="id" value={subject.id} />
      ) : (
        <input type="hidden" name="planId" value={planId} />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_1fr]">
        <Field label="Nombre de la materia" htmlFor={ids.name}>
          <input
            id={ids.name}
            name="name"
            required
            maxLength={SUBJECT_LIMITS.name.maxLength}
            defaultValue={subject?.name ?? ''}
            className={inputClass}
          />
        </Field>
        {/* Sin ejemplo de código: cada plan usa su propia nomenclatura (la TUDCS numera 101, 111,
            213; otras carreras usan prefijos) y un ejemplo inventado se lee como formato exigido. */}
        <Field
          label="Código"
          htmlFor={ids.code}
          hint="Único dentro del plan. El que figura en el plan de estudios."
        >
          <input
            id={ids.code}
            name="code"
            required
            maxLength={SUBJECT_LIMITS.code.maxLength}
            defaultValue={subject?.code ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Año del plan" htmlFor={ids.yearInPlan}>
          <input
            id={ids.yearInPlan}
            name="yearInPlan"
            type="number"
            required
            min={SUBJECT_LIMITS.yearInPlan.min}
            max={SUBJECT_LIMITS.yearInPlan.max}
            defaultValue={subject?.yearInPlan ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Cadencia" htmlFor={ids.termKind}>
          <select
            id={ids.termKind}
            name="termKind"
            required
            defaultValue={subject?.termKind ?? ''}
            onChange={(e) => setTermKind(e.target.value)}
            className={inputClass}
          >
            <option value="">Elegí una cadencia</option>
            {TERM_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Cuatrimestre / bimestre"
          htmlFor={ids.termInYear}
          hint={
            isAnnual
              ? 'No aplica: la materia es anual.'
              : `Entre ${SUBJECT_LIMITS.termInYear.min} y ${SUBJECT_LIMITS.termInYear.max}, según la cadencia.`
          }
        >
          <input
            id={ids.termInYear}
            name="termInYear"
            type="number"
            min={SUBJECT_LIMITS.termInYear.min}
            max={SUBJECT_LIMITS.termInYear.max}
            required={!isAnnual}
            disabled={isAnnual}
            defaultValue={subject?.termInYear ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Carga horaria semanal"
          htmlFor={ids.weeklyHours}
          hint={`En horas. Entre ${SUBJECT_LIMITS.weeklyHours.min} y ${SUBJECT_LIMITS.weeklyHours.max}; 0 si no tiene horario semanal fijo.`}
        >
          <input
            id={ids.weeklyHours}
            name="weeklyHours"
            type="number"
            required
            min={SUBJECT_LIMITS.weeklyHours.min}
            max={SUBJECT_LIMITS.weeklyHours.max}
            defaultValue={subject?.weeklyHours ?? ''}
            className={inputClass}
          />
        </Field>
        <Field
          label="Carga horaria total"
          htmlFor={ids.totalHours}
          hint="En horas. Tiene que ser al menos la semanal."
        >
          <input
            id={ids.totalHours}
            name="totalHours"
            type="number"
            required
            min={SUBJECT_LIMITS.totalHours.min}
            defaultValue={subject?.totalHours ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Descripción corta"
        htmlFor={ids.description}
        hint="Opcional. Visible al alumno en la ficha de la materia."
      >
        <textarea
          id={ids.description}
          name="description"
          rows={3}
          maxLength={SUBJECT_LIMITS.description.maxLength}
          defaultValue={subject?.description ?? ''}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {state.status === 'error' && (
        <p className="m-0 text-[12.5px] text-st-failed-fg" role="alert">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => router.push(listHref)}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !hydrated}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear materia'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </div>
  );
}
