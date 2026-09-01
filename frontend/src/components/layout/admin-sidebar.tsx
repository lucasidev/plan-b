'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

/**
 * Nav del backoffice (port de `admin-shell.jsx::ADM_NAV`). Los items con `href` navegan a páginas
 * reales; el resto se muestra inerte para fidelidad del shell.
 *
 * Un item inerte dice por qué lo está, y eso importa: Carreras y Materias SÍ existen, pero cuelgan
 * de una universidad (`/admin/universities/[id]/careers`, y las materias de su plan), así que no hay
 * ruta de primer nivel a la que linkear. Anunciarlas como "Próximamente" le miente justo a la
 * persona cuyo trabajo es cargarlas, así que llevan `hint` con dónde se gestionan. Lo que todavía no
 * está construido no lleva `hint` y cae en el "Próximamente" por defecto.
 */
type NavItem = { label: string; href?: string; hint?: string };

const DENTRO_DE_UNA_UNIVERSIDAD = 'Se gestionan dentro de cada universidad';

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Datos académicos',
    items: [
      { label: 'Universidades', href: '/admin/universities' },
      { label: 'Carreras', hint: DENTRO_DE_UNA_UNIVERSIDAD },
      { label: 'Materias', hint: DENTRO_DE_UNA_UNIVERSIDAD },
      { label: 'Docentes', href: '/admin/teachers' },
      { label: 'Cátedras', href: '/admin/chairs' },
      { label: 'Importador' },
    ],
  },
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
              const live = Boolean(it.href);
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
                <span key={it.label} className={className} title={it.hint ?? 'Próximamente'}>
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
