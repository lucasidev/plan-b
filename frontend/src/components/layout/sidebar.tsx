'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui';
import { type MemberRoute, memberRoutes, memberSections } from '@/lib/member-shell';
import type { Session } from '@/lib/session';
import { cn } from '@/lib/utils';
import { ShellLink } from './shell-link';

type Props = {
  /** Slot rendered below the nav (see `<AvatarMenu />` / `<BackofficeFooterLink />` / `<AnonymousFooter />`). */
  footer?: React.ReactNode;
  /** `null` sin sesión. Solo `member` ve Mis aportes y el Ajustes directo, sin gate. */
  role: Session['role'] | null;
};

/**
 * Sidebar del shell entero (con o sin sesión), per `docs/design/reference/components/shell.jsx::Sidebar`.
 *
 * Agrupa la navegación en dos secciones: la primaria sin encabezado y "Otros" al pie. El item
 * activo se resalta contra `usePathname()`, con `activePrefixes` para las rutas del catálogo
 * (Explorar queda encendido en `/careers/[id]`, `/subjects/[id]`, etc., no solo en `/universities`).
 *
 * Por debajo de `lg` (1024px) no se renderiza (`hidden lg:flex`): la maqueta era de escritorio, y
 * a 393px de ancho un sidebar fijo de 240px no deja lugar ni para el buscador. El topbar
 * compensa con su propia versión angosta.
 *
 * Client porque necesita `usePathname`. Si el streaming de RSC importa acá en el futuro, separar
 * en un shell server + un sub-componente cliente que solo lea el pathname para el resaltado.
 */
export function Sidebar({ footer, role }: Props) {
  const pathname = usePathname();
  const isMember = role === 'member';

  return (
    <aside
      className="hidden lg:flex flex-col bg-bg border-r border-line p-4 gap-4 overflow-y-auto"
      style={{ width: 240, height: '100vh' }}
    >
      <ShellLink
        href="/"
        aria-label="Ir a la entrada"
        prefetch={false}
        className="flex items-baseline gap-1.5 pb-3 border-b border-line"
        style={{ padding: '4px 6px 12px' }}
      >
        <Logo size={22} />
      </ShellLink>

      <nav className="flex flex-col gap-px">
        {memberSections.map((section) => (
          <SectionGroup
            key={section.key}
            label={section.label}
            items={memberRoutes.filter(
              (r) => r.section === section.key && (!r.requiresSession || isMember),
            )}
            pathname={pathname}
            isMember={isMember}
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
  isMember,
}: {
  label?: string;
  items: readonly MemberRoute[];
  pathname: string;
  isMember: boolean;
}) {
  return (
    <>
      {/* Sin label no hay encabezado ni su espacio: un div vacío dejaría el hueco de 26px que
          separaba los grupos, y la navegación primaria arrancaría flotando bajo el logo. */}
      {label && (
        <div
          // text-ink-3, no text-ink-4: el design system reserva ink-4 para disabled/placeholder,
          // nunca para texto legible (docs/product/design-system.md), y "Otros" es justo la
          // etiqueta de una sección (el mismo uso documentado de ink-3).
          className="text-ink-3"
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
      )}
      {items.map((item) => (
        <NavItem
          key={item.path}
          path={hrefForRoute(item, isMember)}
          label={item.label}
          shortcut={item.shortcut}
          active={isActive(pathname, item)}
        />
      ))}
    </>
  );
}

/** El pie del sidebar para una sesión que no es `member` (hoy, admin): un solo link al backoffice. */
export function BackofficeFooterLink() {
  return (
    <div className="border-t border-line" style={{ padding: 8 }}>
      <NavItem path="/admin" label="Backoffice" active={false} />
    </div>
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
    <ShellLink
      href={path}
      // Sin prefetch: estos seis links viven montados en toda pantalla del área autenticada, y
      // el auto-prefetch en viewport le compite al router.push/refresh que sigue a guardar un
      // formulario, perdiendo esa navegación (#477). El costo es la primera visita sin cache tibia.
      prefetch={false}
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
          // text-ink-2, no text-ink-3: contra `bg-line` (el fondo del estado inactivo) ink-3 no
          // llega a 4,5:1 (WCAG AA); el design system solo garantiza ese mínimo para ink-3 contra
          // bg/bg-card/bg-elev, no contra line (que es un color de borde, no de relleno de texto).
          className={cn('text-ink-2', active ? 'bg-bg-elev' : 'bg-line')}
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
    </ShellLink>
  );
}

/**
 * A dónde linkea el item: directo a su `path`, salvo que declare `gateWhenAnonymous` y la sesión
 * no sea `member` (anónimo o cualquier otro rol), y ahí pasa por `/sign-in?from=<path>`, mismo
 * patrón que `reviewCtaHref` (US-229). Un anónimo vuelve al item después de entrar; una cuenta
 * que no es de alumno pasa igual por el gate en vez de pegar contra el guard de `(member)`.
 */
function hrefForRoute(route: MemberRoute, isMember: boolean): string {
  if (route.gateWhenAnonymous && !isMember) {
    return `/sign-in?from=${encodeURIComponent(route.path)}`;
  }
  return route.path;
}

/**
 * Activo si el pathname coincide con alguno de los `activePrefixes` de la ruta (el propio `path`
 * si no declaró ninguno), exacto o como prefijo seguido de `/`. Así `/careers/[id]/plans` deja
 * encendido "Explorar" (que declara `/careers` entre sus prefijos) sin que, por ejemplo,
 * `/reviews/mine` quedara encendido por cualquier ruta que empiece igual.
 */
function isActive(pathname: string, route: MemberRoute): boolean {
  const prefixes = route.activePrefixes ?? [route.path];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
