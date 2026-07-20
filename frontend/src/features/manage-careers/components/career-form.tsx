'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { createCareerAction, updateCareerAction } from '../actions';
import { type CareerDetail, initialManageCareerState } from '../types';

type Props = {
  /** create: alta bajo una uni (universityId de la ruta). edit: prefill con el detalle. */
  mode: 'create' | 'edit';
  /** Uni a la que se ancla la carrera. En edit sale de `career.universityId`; en create, de la ruta. */
  universityId: string;
  career?: CareerDetail;
};

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

const DEGREE_TYPES = ['Grado', 'Posgrado', 'Tecnicatura'] as const;
const CADENCES = ['Anual', 'Cuatrimestral', 'Semestral'] as const;

/**
 * Form de alta/edición de carrera (US-061 admin). React 19 primitives + Zod en el action (form
 * plano, sin wizard: el wizard de onboarding del mock es otra vista). name + slug obligatorios; el
 * resto (nombre corto, código, tipo de título, duración, modalidad, descripción) son metadata
 * opcional que el crowdsourcing no carga y el admin completa. Mutación pura (ADR-0046): en success
 * redirige al listado de carreras de la uni.
 *
 * El selector "Estado al lanzar" (Borrador / Beta / Pública) del mock NO va acá: es el lifecycle de
 * visibilidad de US-091, ortogonal al CRUD. La carrera nace oficial (isOfficial) del catálogo admin.
 * TODO(US-091): sumar el control de visibilidad cuando aterrice el lifecycle draft/beta/live.
 */
export function CareerForm({ mode, universityId, career }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateCareerAction : createCareerAction,
    initialManageCareerState,
  );

  const ids = {
    name: useId(),
    slug: useId(),
    shortName: useId(),
    code: useId(),
    degreeType: useId(),
    durationYears: useId(),
    cadence: useId(),
    description: useId(),
  };

  const listHref = `/admin/universities/${universityId}/careers`;

  useEffect(() => {
    if (state.status !== 'success') return;
    // Solo `push`: el `refresh()` apuntaba a la ruta actual y competía con la navegación, comiéndose
    // el redirect a veces. El listado es `force-dynamic`, así que no hace falta.
    router.push(listHref);
  }, [state, router, listHref]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {isEdit && career ? (
        <input type="hidden" name="id" value={career.id} />
      ) : (
        <input type="hidden" name="universityId" value={universityId} />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_1fr]">
        <Field label="Nombre de la carrera" htmlFor={ids.name}>
          <input
            id={ids.name}
            name="name"
            required
            maxLength={200}
            defaultValue={career?.name ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Código interno" htmlFor={ids.code} hint="Opcional. Ej: ISI, LE.">
          <input
            id={ids.code}
            name="code"
            maxLength={40}
            defaultValue={career?.code ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.4fr_1fr]">
        <Field
          label="Slug"
          htmlFor={ids.slug}
          hint="Se usa en URLs. Solo minúsculas, números y guiones. Ej: ing-sistemas."
        >
          <input
            id={ids.slug}
            name="slug"
            required
            maxLength={120}
            defaultValue={career?.slug ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre corto" htmlFor={ids.shortName} hint="Opcional. Ej: Ing. Sistemas.">
          <input
            id={ids.shortName}
            name="shortName"
            maxLength={100}
            defaultValue={career?.shortName ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Tipo de título" htmlFor={ids.degreeType}>
          <select
            id={ids.degreeType}
            name="degreeType"
            defaultValue={career?.degreeType ?? ''}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            {DEGREE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duración (años)" htmlFor={ids.durationYears} hint="Opcional. Entre 1 y 15.">
          <input
            id={ids.durationYears}
            name="durationYears"
            type="number"
            min={1}
            max={15}
            defaultValue={career?.durationYears ?? ''}
            className={inputClass}
          />
        </Field>
        <Field label="Modalidad mayoritaria" htmlFor={ids.cadence}>
          <select
            id={ids.cadence}
            name="cadence"
            defaultValue={career?.cadence ?? ''}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            {/* El form ofrece 3 de los 4 TermKind. Si la carrera ya tiene una cadencia fuera de esa
                lista (ej. Bimestral, que un import crowdsourced podría setear), la preservamos como
                opción para no borrarla en silencio al guardar: Update hace replace incondicional, así
                que un defaultValue que no matchea ninguna opción se enviaría vacío y limpiaría el campo. */}
            {career?.cadence && !(CADENCES as readonly string[]).includes(career.cadence) && (
              <option value={career.cadence}>{career.cadence}</option>
            )}
            {CADENCES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Descripción corta"
        htmlFor={ids.description}
        hint="Opcional. Visible al alumno en el catálogo."
      >
        <textarea
          id={ids.description}
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={career?.description ?? ''}
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
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear carrera'}
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
