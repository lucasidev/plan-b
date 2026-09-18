'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { AvatarMenu } from './avatar-menu';

/** Cada entrada navega. La jerarquía del catálogo se recorre desde la universidad. */
type NavItem = { label: string; href: string };

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Catálogo académico',
    items: [
      { label: 'Universidades', href: '/admin/universities' },
      { label: 'Docentes', href: '/admin/teachers' },
      { label: 'Cátedras', href: '/admin/chairs' },
    ],
  },
  {
    group: 'Cuestionarios',
    items: [{ label: 'Preguntas', href: '/admin/items' }],
  },
  {
    group: 'Curaduría',
    items: [{ label: 'Comentarios y notas', href: '/admin/curation' }],
  },
  {
    group: 'Usuarios',
    items: [{ label: 'Alumnos', href: '/admin/users' }],
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

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
              const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
              const className = cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px]',
                active && 'bg-bg-card text-ink shadow-card',
                !active && 'text-ink-2 hover:bg-white/50 hover:text-ink',
              );
              return (
                <Link
                  key={it.label}
                  href={it.href}
                  className={className}
                  aria-current={active ? 'page' : undefined}
                >
                  {it.label}
                </Link>
              );
            })}
          </Fragment>
        ))}
      </nav>

      <div className="mt-auto">
        <AvatarMenu email={email} accountRole="admin" />
      </div>
    </aside>
  );
}
