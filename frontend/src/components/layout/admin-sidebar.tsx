'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

/**
 * Nav del backoffice (port de `admin-shell.jsx::ADM_NAV`). Solo "Docentes" apunta a una página real
 * (US-063); el resto se muestra para fidelidad del shell pero queda inerte (no navega a rutas que no
 * existen). A medida que aterricen las otras vistas del backoffice se les cablea el `href`.
 */
const NAV: { group: string; items: { label: string; href?: string }[] }[] = [
  { group: 'General', items: [{ label: 'Dashboard' }] },
  {
    group: 'Datos académicos',
    items: [
      { label: 'Universidades' },
      { label: 'Carreras' },
      { label: 'Materias' },
      { label: 'Docentes', href: '/admin/teachers' },
      { label: 'Comisiones' },
      { label: 'Importador' },
    ],
  },
  { group: 'Moderación', items: [{ label: 'Reportes' }, { label: 'Usuarios' }] },
  { group: 'Operación', items: [{ label: 'Migraciones' }, { label: 'Audit log' }] },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <aside className="flex flex-col border-r border-line bg-bg-elev px-2.5 py-3">
      <div className="flex items-baseline gap-2 border-b border-line px-2 pb-3">
        <span className="font-display text-[14px] font-semibold tracking-[-0.01em] text-ink">
          plan-b
          <span className="ml-0.5 inline-block h-[5px] w-[5px] -translate-y-[3px] rounded-full bg-accent" />
        </span>
        <span className="rounded-sm bg-ink px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
          admin
        </span>
      </div>

      <nav className="flex flex-col">
        {NAV.map((g) => (
          <Fragment key={g.group}>
            <div className="px-2 pt-3.5 pb-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-3">
              {g.group}
            </div>
            {g.items.map((it) => {
              const active = it.href ? pathname.startsWith(it.href) : false;
              const className = cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px]',
                active && 'bg-bg-card text-ink shadow-card',
                !active && it.href && 'text-ink-2 hover:bg-white/50 hover:text-ink',
                !it.href && 'cursor-default text-ink-4',
              );
              return it.href ? (
                <Link key={it.label} href={it.href} className={className}>
                  {it.label}
                </Link>
              ) : (
                <span key={it.label} className={className} title="Próximamente">
                  {it.label}
                </span>
              );
            })}
          </Fragment>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-line px-2 pt-2.5 text-[11.5px] text-ink-2">
        <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-ink font-mono text-[10px] font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate">{email}</div>
          <small className="block font-mono text-[10px] text-ink-3">plan-b · admin</small>
        </div>
      </div>
    </aside>
  );
}
