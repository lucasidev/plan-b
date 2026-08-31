'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useRef } from 'react';
import { createChairAction } from '../actions';
import { initialManageChairState } from '../types';

/**
 * Alta de una cátedra sobre la materia abierta (US-196).
 *
 * El action es una mutación pura y no revalida ni redirige adentro ([ADR-0046]): la pantalla
 * reacciona al `status: 'success'` refrescando, que es lo que trae la cátedra nueva al listado.
 */
export function CreateChairForm({ subjectId }: { subjectId: string }) {
  const [state, action, pending] = useActionState(createChairAction, initialManageChairState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    router.refresh();
  }, [state.status, router]);

  return (
    <form ref={formRef} action={action} className="rounded-lg border border-line bg-bg-card p-4">
      <input type="hidden" name="subjectId" value={subjectId} />

      <label htmlFor="chair-name" className="mb-1.5 block text-[13px] text-ink">
        Nombre de la cátedra
      </label>
      <div className="flex gap-2">
        <input
          id="chair-name"
          name="name"
          maxLength={100}
          required
          placeholder="Pérez"
          className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[13.5px] text-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg px-3.5 py-2 text-[13px] font-medium disabled:opacity-60"
          style={{ background: 'var(--color-ink)', color: 'var(--color-bg-card)' }}
        >
          {pending ? 'Cargando…' : 'Cargar cátedra'}
        </button>
      </div>

      <p className="mt-1.5 text-[11.5px] text-ink-3">
        Se identifica por su titular, que es como el alumno la recuerda. Nace sin equipo: los
        integrantes se suman después, cada uno con el período desde el que integra.
      </p>

      {state.status === 'error' && (
        <p role="alert" className="mt-2 text-[12.5px] text-alarm-ink">
          {state.message}
        </p>
      )}
    </form>
  );
}
