import type { Session } from '@/lib/session';
import { AnonymousFooter } from './anonymous-footer';
import { AvatarMenu } from './avatar-menu';
import './planb.css';
import { BackofficeFooterLink, Sidebar } from './sidebar';
import { Topbar } from './topbar';

export type ShellSession = Session | null;

type Props = {
  /** Sesión leída en el layout RSC. `null` cuando se navega sin cuenta (el catálogo se lee así). */
  session: ShellSession;
  children: React.ReactNode;
  /** El slot `@crumbs` de `(planb)`, si el layout que llama lo tiene (ver `Topbar`). */
  crumbsSlot?: React.ReactNode;
};

/**
 * Chrome de toda la aplicación: sidebar (con `AvatarMenu`, `BackofficeFooterLink` o
 * `AnonymousFooter` en el pie) + topbar + área de contenido con scroll. Un solo shell para leer
 * sin cuenta y para lo que pide cuenta: antes el catálogo público tenía su propio header mínimo,
 * separado de este.
 *
 * El pie y la nav de `member` (Mis aportes, Ajustes gateado) son del alumno, no de cualquier
 * sesión: un admin que entra a leer el catálogo antes de ir al backoffice vería, con
 * `role !== 'member'`, links que el guard de `(member)` solo rebota, así que en su lugar el pie
 * es un único link a `/admin`.
 *
 * Server component (no `'use client'`): solo recibe la sesión (o `null`) resuelta en el layout y
 * compone los tres bloques. La interactividad vive en los hijos (Sidebar, Topbar, AvatarMenu
 * marcan `'use client'` donde hace falta).
 *
 * Layout: grid de dos columnas (232px + 1fr, `.pb-shell` de la maqueta aprobada) desde `lg`
 * (1024px); por debajo, una sola columna sin sidebar (`Sidebar` se esconde con `hidden lg:flex`).
 * La maqueta era de escritorio: por debajo de `lg` el topbar compensa con su propia versión
 * angosta (ver `Topbar`). Las utilities de Tailwind (`grid-cols-1 lg:grid-cols-[...]`) conviven
 * con `.pb-shell` y ganan por cascada de layers: fijan el breakpoint real (1024px), no los 760px
 * que trae `@media` portado de la maqueta (calibrado a su propio breakpoint de demo).
 */
export function AppShell({ session, children, crumbsSlot }: Props) {
  return (
    <div
      className="pb-shell grid grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]"
      // `position: relative` lo vuelve el containing block de cualquier descendiente
      // `position: absolute` (los `.sr-only` de labels/legends del formulario, por ejemplo).
      // Sin esto, un absolute profundo en el árbol se posiciona relativo al documento
      // entero en vez de a este shell, y su `top` infla `documentElement.scrollHeight`:
      // el `overflow: hidden` de acá no lo contiene porque ya no es su ancestro
      // posicionado, así que la página entera queda "scrolleable" aunque este shell no
      // debería permitirlo nunca (el scroll vive todo adentro del `main`).
      style={{
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Sidebar footer={footerFor(session)} role={session?.role ?? null} />
      <div className="flex flex-col overflow-hidden">
        <Topbar session={session} crumbsSlot={crumbsSlot} />
        {/* tabIndex: un `main` con scroll propio tiene que llegar por teclado (WCAG 2.1.1 /
            axe scrollable-region-focusable), no solo con el mouse. */}
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: el main es la única región con scroll
            del shell; sin tabIndex, un lector de pantalla no puede alcanzarla con el teclado. */}
        <main className="flex-1 overflow-y-auto bg-bg" tabIndex={0}>
          {children}
        </main>
      </div>
    </div>
  );
}

function footerFor(session: ShellSession): React.ReactNode {
  if (!session) return <AnonymousFooter />;
  if (session.role === 'member') return <AvatarMenu email={session.email} />;
  return <BackofficeFooterLink />;
}
