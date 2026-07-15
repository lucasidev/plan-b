'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

/** Roles que operan el backoffice: admin (todo) o moderador (solo moderación). */
export type BackofficeRole = 'admin' | 'moderator';

/**
 * Nav del backoffice (port de `admin-shell.jsx::ADM_NAV`). Los items con `href` navegan a páginas
 * reales; `roles` restringe qué rol ve el link vivo (Docentes es admin-only, Reportes lo ve también el
 * moderador). El resto se muestra inerte para fidelidad del shell, hasta que aterrice cada vista.
 */
type NavItem = { label: string; href?: string; roles?: BackofficeRole[] };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'General', items: [{ label: 'Dashboard' }] },
  {
    group: 'Datos académicos',
    items: [
      { label: 'Universidades', href: '/admin/universities', roles: ['admin'] },
      { label: 'Carreras' },
      { label: 'Materias' },
      { label: 'Docentes', href: '/admin/teachers', roles: ['admin'] },
      { label: 'Comisiones' },
      { label: 'Importador' },
    ],
  },
  {
    group: 'Moderación',
    items: [
      { label: 'Reportes', href: '/admin/moderacion/reportes', roles: ['admin', 'moderator'] },
      { label: 'Usuarios' },
    ],
  },
  { group: 'Operación', items: [{ label: 'Migraciones' }, { label: 'Audit log' }] },
];

export function AdminSidebar({ email, role }: { email: string; role: BackofficeRole }) {
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
              const live = Boolean(it.href && (!it.roles || it.roles.includes(role)));
              const active = live && pathname.startsWith(it.href as string);
              const className = cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px]',
                active && 'bg-bg-card text-ink shadow-card',
                !active && live && 'text-ink-2 hover:bg-white/50 hover:text-ink',
                !live && 'cursor-default text-ink-4',
              );
              return live ? (
                <Link key={it.label} href={it.href as string} className={className}>
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
