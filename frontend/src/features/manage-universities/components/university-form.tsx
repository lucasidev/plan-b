'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/lib/use-hydrated';
import { createUniversityAction, updateUniversityAction } from '../actions';
import { initialManageUniversityState, type UniversityDetail } from '../types';

type Props = {
  /** create: alta desde cero. edit: prefill con el detalle de la universidad activa. */
  mode: 'create' | 'edit';
  university?: UniversityDetail;
};

const inputClass =
  'w-full rounded-md border border-line bg-bg-card px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-3';

/**
 * Form de alta/edición de universidad (US-060 admin). React 19 primitives + Zod en el action (form
 * plano, sin wizard multi-step: eso es scope de US-091). A diferencia del form de docentes no hay
 * campo inmutable en la edición (el aggregate permite reeditar el slug). Mutación pura (ADR-0046):
 * en success redirige al listado.
 *
 * Los dominios institucionales se editan como chips: cada uno viaja en su propio hidden input con
 * el mismo `name`, así `formData.getAll('institutionalEmailDomains')` arma el array del lado server
 * sin serializar JSON a mano.
 */
export function UniversityForm({ mode, university }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  // Antes de hidratar el submit viaja como POST nativo: la mutación pasa pero el error nunca se ve.
  const hydrated = useHydrated();
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateUniversityAction : createUniversityAction,
    initialManageUniversityState,
  );
  const [domains, setDomains] = useState<string[]>(university?.institutionalEmailDomains ?? []);
  const [domainDraft, setDomainDraft] = useState('');

  const ids = {
    name: useId(),
    slug: useId(),
    domains: useId(),
  };

  useEffect(() => {
    if (state.status !== 'success') return;
    // Solo `push`: el `refresh()` apuntaba a la ruta actual y competía con la navegación, comiéndose
    // el redirect a veces. El listado es `force-dynamic`, así que no hace falta.
    router.push('/admin/universities');
  }, [state, router]);

  function addDomain() {
    const value = domainDraft.trim().toLowerCase();
    if (!value) return;
    if (!domains.includes(value)) {
      setDomains((prev) => [...prev, value]);
    }
    setDomainDraft('');
  }

  function removeDomain(value: string) {
    setDomains((prev) => prev.filter((d) => d !== value));
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {isEdit && university && <input type="hidden" name="id" value={university.id} />}

      <Field label="Nombre" htmlFor={ids.name}>
        <input
          id={ids.name}
          name="name"
          required
          maxLength={200}
          defaultValue={university?.name ?? ''}
          className={inputClass}
        />
      </Field>

      <Field
        label="Slug"
        htmlFor={ids.slug}
        hint="Se usa en URLs. Solo minúsculas, números y guiones. Ej: unsta, utn-frba."
      >
        <input
          id={ids.slug}
          name="slug"
          required
          maxLength={100}
          defaultValue={university?.slug ?? ''}
          className={inputClass}
        />
      </Field>

      <Field
        label="Dominios institucionales"
        htmlFor={ids.domains}
        hint="Opcional. Habilitan que un docente verifique su cuenta con un email de estos dominios. Ej: unsta.edu.ar."
      >
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {domains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-bg-elev px-2.5 py-1 text-[12px] text-ink-2"
              >
                {domain}
                <input type="hidden" name="institutionalEmailDomains" value={domain} />
                <button
                  type="button"
                  onClick={() => removeDomain(domain)}
                  aria-label={`Quitar ${domain}`}
                  className="text-ink-4 hover:text-st-failed-fg"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <input
            id={ids.domains}
            type="text"
            value={domainDraft}
            onChange={(e) => setDomainDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addDomain();
              }
            }}
            placeholder="unsta.edu.ar"
            className={inputClass}
          />
          <Button type="button" variant="ghost" size="sm" onClick={addDomain}>
            Agregar
          </Button>
        </div>
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
          onClick={() => router.push('/admin/universities')}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !hydrated}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Afiliar universidad'}
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
