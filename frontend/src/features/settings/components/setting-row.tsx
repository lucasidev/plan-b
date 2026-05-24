'use client';

import type { ReactNode } from 'react';

/**
 * Layout primitive para cada fila de Ajustes. El label + descripción a la izquierda, el
 * control (toggle, select, trigger) a la derecha. Separadores van entre filas, no acá: cada
 * sección los aplica.
 */
type Props = {
  label: string;
  description?: string;
  control: ReactNode;
  htmlFor?: string;
};

export function SettingRow({ label, description, control, htmlFor }: Props) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="flex-1 min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-1">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}
