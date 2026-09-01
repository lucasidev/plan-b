'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { publishEditorialNoteAction } from '../actions';
import type { CatalogOption } from '../api.server';
import { initialEditorialNoteState } from '../types';

/**
 * Escribir una nota del equipo sobre una carrera (ADR-0084): la síntesis de lo que se leyó en el
 * campo libre. La síntesis se publica; el texto del que salió, no.
 *
 * <p>
 * La carrera se elige de una lista y no se tipea: no hay nivel cátedra en el selector porque no lo
 * hay en el producto, y a ese nivel el docente sería identificable.
 * </p>
 */
export function EditorialNoteForm({
  universities,
  careers,
  selectedUniversityId,
}: {
  universities: readonly CatalogOption[];
  careers: readonly CatalogOption[];
  selectedUniversityId: string | null;
}) {
  const [state, action, pending] = useActionState(
    publishEditorialNoteAction,
    initialEditorialNoteState,
  );
  const hydrated = useHydrated();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    router.refresh();
  }, [state.status, router]);

  const disabled = pending || !hydrated;

  return (
    <div className="rounded-lg border border-line bg-bg-card p-4">
      <p className="mb-1 text-[13px] font-medium text-ink">Escribir una nota del equipo</p>
      <p className="mb-3 text-[11.5px] leading-relaxed text-ink-3">
        Se publica en la ficha de la carrera, con su fecha y diciendo de dónde sale. Va a nivel
        carrera y nunca de una cátedra: ahí el docente es identificable.
      </p>

      {/* La universidad va por la URL y no por el form: al elegirla hay que ir a buscar sus
          carreras, y eso es una navegación, no parte del envío de la nota. */}
      <label htmlFor="note-university" className="mb-1 block text-[12.5px] text-ink-2">
        Universidad
      </label>
      <select
        id="note-university"
        defaultValue={selectedUniversityId ?? ''}
        disabled={disabled}
        onChange={(e) => router.push(`/admin/curation?universityId=${e.target.value}`)}
        className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
      >
        <option value="">Elegí una</option>
        {universities.map((university) => (
          <option key={university.id} value={university.id}>
            {university.name}
          </option>
        ))}
      </select>

      <form ref={formRef} action={action}>
        <label htmlFor="note-career" className="mb-1 block text-[12.5px] text-ink-2">
          Carrera
        </label>
        <select
          id="note-career"
          name="careerId"
          required
          disabled={disabled || careers.length === 0}
          className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-ink disabled:opacity-60"
        >
          {careers.length === 0 ? (
            <option value="">Elegí primero la universidad</option>
          ) : (
            careers.map((career) => (
              <option key={career.id} value={career.id}>
                {career.name}
              </option>
            ))
          )}
        </select>

        <label htmlFor="note-text" className="mb-1 block text-[12.5px] text-ink-2">
          La nota
        </label>
        <textarea
          id="note-text"
          name="text"
          required
          rows={4}
          maxLength={1000}
          disabled={disabled}
          placeholder="Varias cursadas mencionan que no se sabe con qué se rinde el final."
          className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] leading-relaxed text-ink disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={disabled || careers.length === 0}
          className="rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          {pending ? 'Publicando…' : 'Publicar nota'}
        </button>

        {state.status === 'error' && (
          <p role="alert" className="mt-2.5 text-[12.5px] text-accent-ink">
            {state.message}
          </p>
        )}
        {state.status === 'success' && (
          <p role="status" className="mt-2.5 text-[12.5px] text-ink-2">
            Publicada. Ya se lee en la ficha de esa carrera.
          </p>
        )}
      </form>
    </div>
  );
}
