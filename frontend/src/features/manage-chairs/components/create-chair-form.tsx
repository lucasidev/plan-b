'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useActionState, useEffect, useRef } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { createChairAction } from '../actions';
import { adminChairQueries } from '../api';
import { initialManageChairState } from '../types';

/**
 * Alta de una cátedra sobre la materia abierta (US-196).
 *
 * El action es una mutación pura y no revalida ni redirige adentro ([ADR-0046]): la pantalla
 * reacciona al `status: 'success'` invalidando el query del listado, que refetchea client-side.
 *
 * Invalida y no hace `router.refresh()`: medido, el refresh no traía la cátedra recién cargada en
 * la mitad de las corridas, con el backend ya teniéndola y un reload completo mostrándola siempre.
 * Es el mismo hallazgo que ya había documentado el panel de planes de una carrera.
 *
 * El submit arranca deshabilitado hasta hidratar (`useHydrated`). Sin eso hay una ventana real en
 * la que el browser manda el form como POST nativo: la cátedra se crea, pero el resultado nunca
 * llega al estado del cliente, así que ni el refresh ni el mensaje de error ocurren y quien carga
 * ve que no pasó nada.
 */
export function CreateChairForm({ subjectId }: { subjectId: string }) {
  const [state, action, pending] = useActionState(createChairAction, initialManageChairState);
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== 'success') return;
    formRef.current?.reset();
    queryClient.invalidateQueries({ queryKey: adminChairQueries.forSubject(subjectId).queryKey });
  }, [state.status, queryClient, subjectId]);

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
          disabled={pending || !hydrated}
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
