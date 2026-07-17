'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { submitInstitutionalEmailAction } from '../actions';
import { claimState, initialEmailState, type TeacherClaim } from '../types';

/**
 * Una fila de "Mis reclamos" (US-030/031). Según el estado del claim muestra:
 *   - verified: badge de docente verificado.
 *   - email_pending: "te enviamos un mail a X".
 *   - pending: botón "Verificar identidad" que despliega el form de email institucional (US-031).
 *
 * El submit del email es una mutación pura (ADR-0046): al success hace router.refresh() para que la
 * página server re-fetchee y el claim pase a email_pending.
 */
export function TeacherClaimCard({ claim }: { claim: TeacherClaim }) {
  const { refresh } = useRouter();
  const emailFieldId = useId();
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, isPending] = useActionState(
    submitInstitutionalEmailAction,
    initialEmailState,
  );

  useEffect(() => {
    if (state.status !== 'success') return;
    setShowForm(false);
    refresh();
  }, [state, refresh]);

  const status = claimState(claim);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line bg-bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-[13.5px] font-medium text-ink">{claim.teacherName}</p>
          {claim.teacherTitle && (
            <p className="m-0 truncate text-[12px] text-ink-3">{claim.teacherTitle}</p>
          )}
        </div>
        {status === 'verified' && <VerifiedBadge kind="teacher" />}
        {status === 'email_pending' && <Pill tone="warm">Esperando verificación</Pill>}
        {status === 'pending' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
          >
            Verificar identidad
          </Button>
        )}
      </div>

      {status === 'email_pending' && (
        <p className="m-0 text-[12.5px] text-ink-3">
          Te enviamos un mail a <span className="text-ink-2">{claim.institutionalEmail}</span>. Hacé
          click en el link para terminar de verificarte.
        </p>
      )}

      {status === 'pending' && showForm && (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="claimId" value={claim.claimId} />
          <label htmlFor={emailFieldId} className="text-[12px] text-ink-2">
            Tu email institucional
          </label>
          <div className="flex gap-2">
            <input
              id={emailFieldId}
              name="email"
              type="email"
              required
              placeholder="nombre@unsta.edu.ar"
              className="flex-1 rounded-md border border-line bg-bg-card px-3 py-1.5 text-[13px] text-ink outline-none focus:border-ink-3"
            />
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
          <p className="m-0 text-[11.5px] text-ink-3">
            Te mandamos un link para confirmar que el dominio del email es el de tu universidad.
          </p>
          {state.status === 'error' && (
            <p className="m-0 text-[12px] text-st-failed-fg" role="alert">
              {state.message}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
