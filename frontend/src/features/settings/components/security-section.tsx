'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ChangePasswordModal } from '@/features/change-password';
import { SectionCard } from './section-card';
import { SettingRow } from './setting-row';

/**
 * Sección Seguridad de Ajustes (US-072). Por ahora solo monta la fila "Contraseña" que
 * dispara el modal de cambio (US-079-i frontend). Si más adelante aterrizan otros toggles
 * de seguridad (MFA, sessions activas, etc.) se suman acá.
 */
export function SecuritySection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SectionCard title="Seguridad" description="Control de acceso de tu cuenta.">
        <SettingRow
          label="Contraseña"
          description="Cambiá tu contraseña. Vas a tener que iniciar sesión de nuevo."
          control={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 text-sm text-accent hover:underline focus:underline focus:outline-none"
            >
              Cambiar contraseña
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          }
        />
      </SectionCard>

      <ChangePasswordModal open={open} onOpenChange={setOpen} />
    </>
  );
}
