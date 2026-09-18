'use client';

import { usePathname } from 'next/navigation';
import { type MemberRoute, memberRoutes, memberSections } from '@/lib/member-shell';
import type { Session } from '@/lib/session';
import { cn } from '@/lib/utils';
import './planb.css';
import { FallbackLink } from './fallback-link';

type Props = {
  /** Pie con el menú de cuenta o la entrada para visitantes sin sesión. */
  footer?: React.ReactNode;
  /** `null` sin sesión. Solo `member` ve Mis aportes y el Ajustes directo, sin gate. */
  role: Session['role'] | null;
};

/**
 * Sidebar del shell entero (con o sin sesión): markup y clases `pb-` de `.sidebar` en la maqueta
 * aprobada (planb-catalogo-adentro.html, `frameApp`).
 *
 * Agrupa la navegación en dos secciones: la primaria sin encabezado y "Otros" al pie. El item
 * activo se resalta contra `usePathname()`, con `activePrefixes` para las rutas del catálogo
 * (Explorar queda encendido en `/careers/[id]`, `/subjects/[id]`, etc., no solo en `/universities`).
 *
 * Por debajo de `lg` (1024px) no se renderiza (`hidden lg:flex`): la maqueta era de escritorio, y
 * a 393px de ancho un sidebar fijo de 232px no deja lugar ni para el buscador. El topbar compensa
 * con su propia versión angosta. `.pb-shell`/`.pb-sidebar` traen su propio `@media (max-width:
 * 760px)` (portado de la maqueta), pero `hidden lg:flex` decide el breakpoint real: las utilities
 * de Tailwind ganan por cascada de layers sobre `@layer components`.
 *
 * Client porque necesita `usePathname`. Si el streaming de RSC importa acá en el futuro, separar
 * en un shell server + un sub-componente cliente que solo lea el pathname para el resaltado.
 */
export function Sidebar({ footer, role }: Props) {
  const pathname = usePathname();
  const isMember = role === 'member';

  return (
    <aside className="pb-sidebar hidden lg:flex">
      <FallbackLink href="/" aria-label="Ir a la entrada" prefetch={false} className="pb-brandrow">
        <span className="pb-brand">
          plan-b
          <span style={{ color: 'var(--color-alarm)' }}>.</span>
        </span>
      </FallbackLink>

      <nav>
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
      {/* Sin label no hay encabezado ni su espacio: un div vacío dejaría el hueco que separaba
          los grupos, y la navegación primaria arrancaría flotando bajo el logo. */}
      {label && <div className="pb-sec">{label}</div>}
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
    <FallbackLink
      href={path}
      // Sin prefetch: estos seis links viven montados en toda pantalla del área autenticada, y
      // el auto-prefetch en viewport le compite al router.push/refresh que sigue a guardar un
      // formulario, perdiendo esa navegación (#477). El costo es la primera visita sin cache tibia.
      prefetch={false}
      data-active={active}
      className={cn(active && 'pb-on')}
    >
      <span>{label}</span>
      {shortcut && <span className="pb-sc">{shortcut}</span>}
    </FallbackLink>
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
