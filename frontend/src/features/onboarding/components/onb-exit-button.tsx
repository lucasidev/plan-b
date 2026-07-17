'use client';

import { useRef } from 'react';
import { signOutAction } from '@/features/sign-out';

/**
 * Botón "Salir" del topbar del onboarding (US-059-f). Confirma antes de cerrar la
 * sesión: en el onboarding el usuario ya está autenticado pero todavía sin
 * StudentProfile, así que "Salir" = signOut + volver a `/sign-in`.
 *
 * Client component por el confirm. El botón es `type="button"` y dispara el submit
 * del form con `requestSubmit()` sólo si el usuario confirma, así evitamos un
 * `preventDefault` sobre el submit. `signOutAction` (server) revoca el refresh,
 * limpia las cookies y redirige. Dialog nativo por simplicidad (US-059-f).
 */
export function OnbExitButton() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={signOutAction}>
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
