'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui';
import { memberRoutes, memberSections } from '@/lib/member-shell';
import { cn } from '@/lib/utils';

type Props = {
  /** Slot rendered below the nav (see `<AvatarMenu />`). */
  footer?: React.ReactNode;
  /**
   * Small text below the logo: "Universidad · Carrera" del student profile, resuelto en el
   * layout RSC (member) desde GET /api/me/student-profile. Si viene vacío (career colgada), la
   * línea simplemente no se renderiza, en vez de mostrar un valor hardcodeado falso.
   */
  contextLabel?: string;
};

/**
 * `(member)` area sidebar per `docs/design/reference/components/shell.jsx::Sidebar`.
 *
 * Groups navigation links in three sections (Mi cuatrimestre, Comunidad, Cuenta). The
 * active item is highlighted based on `usePathname()`, with a startsWith fallback for
 * future sub-routes (`/subjects/[id]` keeps "Materias" lit).
 *
 * Client because it needs `usePathname`. If RSC streaming matters here in the future,
 * split into a server shell component + a client sub-component that only reads
 * pathname for the highlight.
 */
export function Sidebar({ footer, contextLabel = '' }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col bg-bg border-r border-line p-4 gap-4 overflow-y-auto"
      style={{ width: 240, height: '100vh' }}
    >
      <div
        className="flex items-baseline gap-1.5 pb-3 border-b border-line"
        style={{ padding: '4px 6px 12px' }}
      >
        <Logo size={22} />
      </div>
      {contextLabel && (
        <small
          className="text-ink-3"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0 6px',
            marginTop: -8,
          }}
        >
          {contextLabel}
        </small>
      )}

      <nav className="flex flex-col gap-px">
        {memberSections.map((section) => (
          <SectionGroup
            key={section.key}
            label={section.label}
            items={memberRoutes.filter((r) => r.section === section.key)}
            pathname={pathname}
          />
        ))}
      </nav>

      {footer && <div className="mt-auto">{footer}</div>}
    </aside>
  );
}

function SectionGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: ReadonlyArray<{ path: string; label: string; shortcut?: string }>;
  pathname: string;
}) {
  return (
    <>
      <div
        className="text-ink-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '14px 6px 6px',
        }}
      >
        {label}
      </div>
      {items.map((item) => (
        <NavItem key={item.path} {...item} active={isActive(pathname, item.path)} />
      ))}
    </>
  );
}

function NavItem({
  path,
  label,
  shortcut,
  active,
}: {
  path: string;
  label: string;
  shortcut?: string;
  active: boolean;
}) {
  return (
    <Link
      href={path}
      prefetch
      data-active={active}
      className={cn(
        'flex items-center justify-between gap-2 text-left',
        'transition-colors',
        active
          ? 'bg-bg-card text-ink shadow-card'
          : 'bg-transparent text-ink-2 hover:bg-line-2 hover:text-ink',
      )}
      style={{
        padding: '7px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13.5,
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span
          className={cn('text-ink-3', active ? 'bg-bg-elev' : 'bg-line')}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
            letterSpacing: '0.04em',
          }}
        >
          {shortcut}
        </span>
      )}
    </Link>
  );
}

/**
 * Active when pathname matches exactly. For non-home routes it also matches
 * `/route/...` so a future `/subjects/[id]` keeps "Materias" lit. Home is exact-only
 * so `/home/foo` (if a sub-route ever appeared) does not light Inicio incorrectly.
 */
function isActive(pathname: string, path: string): boolean {
  if (path === '/home') return pathname === '/home';
  return pathname === path || pathname.startsWith(`${path}/`);
}
