'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { GlobalSearch } from '@/features/global-search';
// Import directo al archivo, no al barrel `@/features/write-review`: ese barrel también
// reexporta `api.server.ts` (marcado `server-only`), y este topbar es un Client Component.
import { reviewCtaHref } from '@/features/write-review/review-cta-href';
import { displayNameFromEmail, genericCrumbs, getInitialsFromEmail } from '@/lib/member-shell';
import type { ShellSession } from './app-shell';
import './planb.css';
import { ShellLink } from './shell-link';

type Props = {
  session: ShellSession;
  /**
   * Las migas de una de las cuatro fichas con nombre real (US-129, US-147, SC-001, SC-005), del
   * slot `@crumbs` de `(planb)`. `undefined` en `(member)` (sin ese slot) y en cualquier pantalla
   * de `(planb)` que no sea una ficha: ahí el topbar arma las migas genéricas de `usePathname()`.
   */
  crumbsSlot?: React.ReactNode;
};

/**
 * Topbar del shell entero: markup y clases `pb-` de `.topbar` en la maqueta aprobada
 * (planb-catalogo-adentro.html, `frameApp`).
 *
 * Las migas son `crumbsSlot` cuando el layout las pasa (las cuatro fichas de `(planb)`, resueltas
 * server-side en `@crumbs`); si no, se calculan genéricas de `usePathname()` (todo `(member)`, y
 * el resto de `(planb)`). Client porque igual necesita el pathname para el resto del topbar
 * (buscador, CTA, el link de Ingresar con `?from=`).
 *
 * La barra de búsqueda (`GlobalSearch`) es funcional (pega a `GET /api/search`): la maqueta la
 * dibuja como una caja inerte (`searchBox()`), así que acá no se porta su markup, solo convive
 * dentro del `.pb-topbar`.
 *
 * El botón "+ Escribir reseña" del slot derecho lleva a `reviewCtaHref(session)` (US-146,
 * ADR-0082, US-229): con sesión, directo a `/reviews/new`; sin ella, al gate con el motivo, en
 * vez de a una ruta que el guard de `(member)` rebotaría igual pero sin decir para qué.
 *
 * A la derecha de "Escribir reseña": con sesión, el círculo de iniciales (el menú con las
 * opciones de cuenta vive en el pie del sidebar, no acá; mismo tono de acento que ese círculo,
 * no el gris neutro `.pb-avatar` de la maqueta, para no desentonar entre los dos); sin sesión, el
 * link "Ingresar".
 *
 * Por debajo de `lg` (1024px) el sidebar no se renderiza (ver `Sidebar`), así que las migas se
 * cambian por un link fijo "Explorar" hacia el catálogo. El buscador es `flex-1` (no `w-full`)
 * para que compita por el espacio como cualquier otro hijo del flex, en vez de reclamar el 100%
 * del contenedor y quedar en 0px cuando no entra (V13, a 393px).
 *
 * Los tres links propios (Explorar móvil, Escribir reseña, Ingresar) son `ShellLink`, no `Link`:
 * viven montados en toda pantalla y son los que el router puede descartar bajo una ráfaga de
 * acciones (issue #525); el fallback vive ahí. Las migas usan `Link` (contenido de página, no del
 * shell persistente).
 */
export function Topbar({ session, crumbsSlot }: Props) {
  const pathname = usePathname();

  return (
    <div className="pb-topbar">
      <div className="hidden min-w-0 lg:block">
        {crumbsSlot ?? <Breadcrumbs items={genericCrumbs(pathname)} />}
      </div>
      <MobileExploreLink />
      <div className="flex-1" />
      <GlobalSearch />
      <WriteReviewButton session={session} />
      {session ? <SessionBadge email={session.email} /> : <SignInLink from={pathname} />}
    </div>
  );
}

/**
 * Reemplazo de las migas por debajo de `lg`: sin sidebar visible ahí, es el único camino de
 * vuelta al catálogo desde el topbar.
 */
function MobileExploreLink() {
  return (
    <ShellLink
      href="/universities"
      prefetch={false}
      className="lg:hidden shrink-0 text-[13px] font-medium text-ink-2 hover:text-ink"
    >
      Explorar
    </ShellLink>
  );
}

/**
 * Topbar CTA "Escribir reseña": el acto principal del producto, siempre a un clic desde
 * cualquier pantalla, con o sin sesión. Texto literal "+ Escribir reseña" (`.pb-write` de la
 * maqueta aprobada), sin ícono.
 *
 * Sin badge de pendientes. El que había contaba cursadas sin reseñar del modelo anterior, y esa
 * cuenta se retiró con él: un checklist de pendientes contradice el modelo vigente, donde reseñar
 * arranca eligiendo una cursada y no tachando una lista.
 */
function WriteReviewButton({ session }: { session: ShellSession }) {
  return (
    <ShellLink
      href={reviewCtaHref(session)}
      // Mismo motivo que el sidebar: siempre montado, y su prefetch en viewport compite con la
      // navegación posterior a guardar un formulario (#477).
      prefetch={false}
      className="pb-write shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
    >
      + Escribir reseña
    </ShellLink>
  );
}

/** Círculo de 28px con las iniciales de la cuenta. Sin menú: las opciones de cuenta viven en el pie del sidebar. */
function SessionBadge({ email }: { email: string }) {
  return (
    <div
      title={displayNameFromEmail(email)}
      className="shrink-0 bg-accent-soft text-accent-ink grid place-items-center font-semibold"
      style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 11 }}
    >
      {getInitialsFromEmail(email)}
    </div>
  );
}

/**
 * Sin sesión: link a Ingresar, con `?from=` a la ruta actual para volver ahí después de entrar
 * (US-229). `/sign-in` valida y sanitiza `from` (`sanitizeInternalRedirect`) antes de usarlo, así
 * que un pathname del propio shell siempre es un destino sano.
 */
function SignInLink({ from }: { from: string }) {
  return (
    <ShellLink
      href={`/sign-in?from=${encodeURIComponent(from)}`}
      prefetch={false}
      className="pb-signin"
    >
      Ingresar
    </ShellLink>
  );
}
