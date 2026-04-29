'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui';
import { memberRoutes, memberSections } from '@/lib/member-shell';
import { cn } from '@/lib/utils';

type Props = {
  /** Slot que va abajo del nav (ver `<AvatarMenu />`). */
  footer?: React.ReactNode;
  /**
   * Texto chico debajo del logo. Hoy hardcoded a "UNSTA · Lic. Sistemas"
   * porque la session todavía no carga universidad/carrera (US-012). Cuando
   * StudentProfile aterrice, este prop se llena desde la session.
   */
  contextLabel?: string;
};

/**
 * Sidebar del área `(member)` per `docs/design/reference/components/shell.jsx::Sidebar`.
 *
 * Agrupa los links de navegación en tres secciones (Mi cuatrimestre,
 * Comunidad, Cuenta). El item activo se resalta basado en `usePathname()`,
 * con fallback a startsWith para sub-rutas futuras (`/subjects/[id]`
 * mantiene "Materias" activo).
 *
 * Cliente porque necesita `usePathname`. Si en el futuro nos importa el
 * RSC streaming acá, se split en un componente shell server + un
 * sub-componente cliente que solo lee pathname para el highlight.
 */
export function Sidebar({ footer, contextLabel = 'UNSTA · Lic. Sistemas' }: Props) {
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
 * Active when pathname matches exactly. For non-dashboard routes also
 * matches `/route/...` so a future `/subjects/[id]` keeps "Materias" lit.
 * Dashboard is exact-only so `/dashboard/foo` doesn't accidentally light
 * up the home item if some sub-route appears.
 */
function isActive(pathname: string, path: string): boolean {
  if (path === '/dashboard') return pathname === '/dashboard';
  return pathname === path || pathname.startsWith(`${path}/`);
}
