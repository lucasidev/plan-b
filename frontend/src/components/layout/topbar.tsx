'use client';

import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { GlobalSearch } from '@/features/global-search';
// Import directo al archivo, no al barrel `@/features/write-review`: ese barrel también
// reexporta `api.server.ts` (marcado `server-only`), y este topbar es un Client Component.
import { reviewCtaHref } from '@/features/write-review/review-cta-href';
import { breadcrumbsForPath, displayNameFromEmail, getInitialsFromEmail } from '@/lib/member-shell';
import type { ShellSession } from './app-shell';
import './planb.css';
import { ShellLink } from './shell-link';

type Props = {
  session: ShellSession;
};

/**
 * Topbar del shell entero: markup y clases `pb-` de `.topbar` en la maqueta aprobada
 * (planb-catalogo-adentro.html, `frameApp`).
 *
 * Client porque deriva las migas de `usePathname()`.
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
 * del contenedor y quedar en 0px cuando no entra (V13, a 393px). "Escribir reseña" pierde el
 * texto por debajo de `md` (768px) y queda solo el ícono, con `aria-label` para que el nombre
 * accesible no cambie.
 *
 * Los tres links son `ShellLink`, no `Link`: viven montados en toda pantalla y son los que el
 * router puede descartar bajo una ráfaga de acciones (issue #525); el fallback vive ahí.
 */
export function Topbar({ session }: Props) {
  const pathname = usePathname();
  const crumbs = breadcrumbsForPath(pathname);

  return (
    <div className="pb-topbar">
      <Crumbs items={crumbs} />
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
 * cualquier pantalla, con o sin sesión.
 *
 * Sin badge de pendientes. El que había contaba cursadas sin reseñar del modelo anterior, y esa
 * cuenta se retiró con él: un checklist de pendientes contradice el modelo vigente, donde reseñar
 * arranca eligiendo una cursada y no tachando una lista.
 *
 * Por debajo de `md` el texto se esconde y queda solo el ícono: el `aria-label` fija el nombre
 * accesible en "Escribir reseña" sin importar el breakpoint, así que un `getByRole('link', {
 * name: /escribir reseña/i })` la sigue encontrando en cualquier viewport.
 */
function WriteReviewButton({ session }: { session: ShellSession }) {
  return (
    <ShellLink
      href={reviewCtaHref(session)}
      aria-label="Escribir reseña"
      // Mismo motivo que el sidebar: siempre montado, y su prefetch en viewport compite con la
      // navegación posterior a guardar un formulario (#477).
      prefetch={false}
      className="pb-write shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
    >
      <Plus size={13} aria-hidden />
      <span className="hidden md:inline">Escribir reseña</span>
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

function Crumbs({ items }: { items: ReadonlyArray<string> }) {
  if (items.length === 0) return null;

  // El crumb activo (último) siempre se muestra; los de sección (prefijo) se ocultan en viewports
  // angostos (< lg) para que el activo no se trunque a media palabra. min-w-0 + truncate quedan
  // como red de seguridad si hasta el activo no entra: una sola línea, nunca wrap (lo que rompía
  // el alto fijo del topbar). El sequence es estable por pathname, así que `crumb` como key
  // alcanza (nunca se repiten dentro de una cadena).
  //
  // El bloque entero (no solo el prefijo) se esconde por debajo de `lg`: ahí lo reemplaza
  // `MobileExploreLink`, porque sin sidebar visible el crumb solo no alcanza para volver al
  // catálogo.
  const active = items[items.length - 1];
  const prefix = items.slice(0, -1);

  return (
    <div className="pb-where hidden lg:block">
      {prefix.map((crumb) => (
        <span key={crumb} className="hidden lg:inline">
          {crumb}
          <span style={{ margin: '0 6px', color: 'var(--color-ink-4)' }}>/</span>
        </span>
      ))}
      <b>{active}</b>
    </div>
  );
}
