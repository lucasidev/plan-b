'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { declareCareerAction } from '../actions';
import { type DeclareCareerFormState, initialDeclareCareerState } from '../types';
import { CareerPicker } from './career-picker';

/**
 * Declarar la carrera desde Mi perfil, para una cuenta que no la tiene.
 *
 * Es la única forma de llegar a este estado hoy: toda cuenta creada por el registro declara su
 * carrera ahí y su perfil nace al verificar el mail. Vive acá, y no antes de reseñar, porque
 * pedir que completes algo para dejarte aportar es lo que la garantía US-170 prohíbe.
 */
export function DeclareCareerCard() {
  const router = useRouter();
  const [careerPlanId, setCareerPlanId] = useState('');
  const [state, formAction] = useActionState<DeclareCareerFormState, FormData>(
    declareCareerAction,
    initialDeclareCareerState,
  );

  useEffect(() => {
    if (state.status === 'success') router.refresh();
  }, [state.status, router]);

  return (
    <section className="max-w-2xl rounded-lg border border-line bg-bg p-6">
      <h2 className="text-base font-semibold text-ink-1">Todavía no sabemos qué cursás</h2>
      <p className="mt-1 text-sm text-ink-3">
        Con tu carrera podemos mostrarte tus materias y sus cátedras. Es lo único que te
        preguntamos: el resto sale de lo que cuentes.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <CareerPicker value={careerPlanId} onChange={setCareerPlanId} />

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}

        <SubmitButton disabled={!careerPlanId} />
      </form>
    </section>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? 'Guardando…' : 'Guardar mi carrera'}
    </Button>
  );
}
