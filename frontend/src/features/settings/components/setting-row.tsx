'use client';

import type { ReactNode } from 'react';

/**
 * Layout primitive for each Ajustes row. Label + description on the left, the control
 * (toggle, select, trigger) on the right. Separators go between rows, not here: each
 * section applies them.
 */
type Props = {
  label: string;
  description?: string;
  control: ReactNode;
  htmlFor?: string;
  /** Los selects y las acciones pasan debajo del texto cuando no entra una fila. */
  stackOnMobile?: boolean;
};

export function SettingRow({ label, description, control, htmlFor, stackOnMobile = false }: Props) {
  return (
    <div
      className={`flex justify-between gap-4 py-4 ${stackOnMobile ? 'flex-col items-start sm:flex-row sm:items-center' : 'items-center'}`}
    >
      <div className="flex-1 min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}
