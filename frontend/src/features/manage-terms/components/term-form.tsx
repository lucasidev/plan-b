'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { createTermAction, updateTermAction } from '../actions';
import { initialManageTermState, type TermDetail } from '../types';

type Props = {
  /** create: alta bajo una uni (universityId de la ruta). edit: prefill con el detalle. */
  mode: 'create' | 'edit';
  /** Uni a la que se ancla el período. En edit sale de `term.universityId`; en create, de la ruta. */
  universityId: string;
  term?: TermDetail;
};

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

const TERM_KINDS = ['Bimestral', 'Cuatrimestral', 'Semestral', 'Anual'] as const;

/**
 * Form de alta/edición de período lectivo (US-064 admin). React 19 primitives + Zod en el action,
 * mismo patrón que CareerForm. El label NO se pide: lo computa el backend a partir de
 * year/number/kind (`AcademicTerm.ComputeLabel`), así el admin no puede desalinearlo del período
 * real. Mutación pura (ADR-0046): en success redirige al listado de períodos de la uni.
 */
export function TermForm({ mode, universityId, term }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateTermAction : createTermAction,
    initialManageTermState,
  );

  const ids = {
    year: useId(),
    number: useId(),
    kind: useId(),
    startDate: useId(),
    endDate: useId(),
    enrollmentOpens: useId(),
    enrollmentCloses: useId(),
  };

  const listHref = `/admin/universities/${universityId}/terms`;

  useEffect(() => {
    if (state.status !== 'success') return;
    // Solo `push`: el `refresh()` apuntaba a la ruta actual y competía con la navegación, comiéndose
    // el redirect a veces. El listado es `force-dynamic`, así que no hace falta.
    router.push(listHref);
  }, [state, router, listHref]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {isEdit && term ? (
        <input type="hidden" name="id" value={term.id} />
      ) : (
        <input type="hidden" name="universityId" value={universityId} />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Año" htmlFor={ids.year}>
          <input
            id={ids.year}
            name="year"
            type="number"
            required
            min={1}
            defaultValue={term?.year ?? ''}
            className={inputClass}
          />
        </Field>
        <Field
          label="Número de período"
          htmlFor={ids.number}
          hint="Entre 1 y 6. Anual siempre es el número 1."
        >
          <input
            id={ids.number}
            name="number"
            type="number"
            required
            min={1}
            max={6}
            defaultValue={term?.number ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Cadencia" htmlFor={ids.kind}>
          <select
            id={ids.kind}
            name="kind"
            required
            defaultValue={term?.kind ?? ''}
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
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Fecha de inicio" htmlFor={ids.startDate}>
          <input
            id={ids.startDate}
            name="startDate"
            type="date"
            required
            defaultValue={term?.startDate ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Fecha de fin" htmlFor={ids.endDate}>
          <input
            id={ids.endDate}
            name="endDate"
            type="date"
            required
            defaultValue={term?.endDate ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Apertura de inscripción"
          htmlFor={ids.enrollmentOpens}
          hint="Cuándo se habilita la inscripción a este período."
        >
          <input
            id={ids.enrollmentOpens}
            name="enrollmentOpens"
            type="datetime-local"
            required
            defaultValue={toDateTimeLocalValue(term?.enrollmentOpens)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Cierre de inscripción"
          htmlFor={ids.enrollmentCloses}
          hint="Cuándo se cierra la inscripción a este período."
        >
          <input
            id={ids.enrollmentCloses}
            name="enrollmentCloses"
            type="datetime-local"
            required
            defaultValue={toDateTimeLocalValue(term?.enrollmentCloses)}
            className={inputClass}
          />
        </Field>
      </div>

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
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear período'}
        </Button>
      </div>
    </form>
  );
}

/**
 * "2026-07-19T10:00:00-03:00" (ISO del backend) -> "2026-07-19T10:00" (`input
 * type="datetime-local"`). Recorta el string en vez de parsearlo a `Date`: evita cualquier
 * conversión de huso horario al prefillear el form de edición.
 */
function toDateTimeLocalValue(iso: string | undefined): string {
  return iso ? iso.slice(0, 16) : '';
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
