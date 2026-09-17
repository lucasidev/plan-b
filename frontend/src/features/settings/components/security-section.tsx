'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ChangePasswordModal } from '@/features/change-password';
import { SectionCard } from './section-card';
import { SettingRow } from './setting-row';

/**
 * Security section of Ajustes (US-072). For now only mounts the "Contraseña" row that
 * triggers the change modal (US-079-i frontend). If more security toggles land later
 * (MFA, active sessions, etc.) they join here.
 */
export function SecuritySection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SectionCard title="Seguridad" description="Control de acceso de tu cuenta.">
        <SettingRow
          stackOnMobile
          label="Contraseña"
          description="Cambiá tu contraseña. Vas a tener que iniciar sesión de nuevo."
          control={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex min-h-10 items-center gap-1 rounded-[6px] border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-bg-elev"
            >
              Cambiar contraseña
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          }
        />
      </SectionCard>

      <ChangePasswordModal open={open} onOpenChange={setOpen} />
    </>
  );
}
