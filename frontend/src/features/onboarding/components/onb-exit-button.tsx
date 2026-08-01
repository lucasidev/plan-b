'use client';

import { useActionState, useEffect, useRef } from 'react';
import { initialSignOutState, signOutAction } from '@/features/sign-out';
import { navigateAfterMutation } from '@/lib/navigate-after-mutation';

/**
 * Botón "Salir" del topbar del onboarding (US-059-f). Confirma antes de cerrar la
 * sesión: en el onboarding el usuario ya está autenticado pero todavía sin
 * StudentProfile, así que "Salir" = signOut + volver a `/sign-in`.
 *
 * Client component por el confirm. El botón es `type="button"` y dispara el submit
 * del form con `requestSubmit()` sólo si el usuario confirma, así evitamos un
 * `preventDefault` sobre el submit. `signOutAction` (server) revoca el refresh y limpia las
 * cookies; la vuelta a `/sign-in` la hace el cliente (ADR-0046). Dialog nativo por simplicidad
 * (US-059-f).
 */
export function OnbExitButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(signOutAction, initialSignOutState);

  useEffect(() => {
    if (state.status !== 'success') return;
    navigateAfterMutation(state.redirectTo);
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('¿Salir del onboarding? Se cierra la sesión y volvés al ingreso.')) {
            formRef.current?.requestSubmit();
          }
        }}
        className="font-mono text-ink-4 hover:text-ink-2 transition-colors cursor-pointer"
        style={{
          fontSize: 11,
          letterSpacing: '0.04em',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        Salir
      </button>
    </form>
  );
}
