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
