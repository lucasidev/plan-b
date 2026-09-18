'use client';

import Link, { useLinkStatus } from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { useEffect } from 'react';
import { navigateAfterMutation } from '@/lib/navigate-after-mutation';

/** Cuánto se espera antes de forzar la navegación. El porqué del número va en el docstring de abajo. */
const FALLBACK_DELAY_MS = 2_000;

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * Qué hrefs tienen, ahora mismo, una navegación de Next en vuelo (`useLinkStatus`, publicado por
 * `LinkStatusProbe`). Vive a nivel de módulo, no en el componente: el `<Link>` que la reporta
 * puede desmontarse antes de que el plazo venza (el menú del avatar cierra el dropdown en el
 * mismo click que dispara la navegación), y esta señal tiene que sobrevivirlo.
 */
const pendingHrefs = new Set<string>();

/**
 * El plazo pendiente de toda la app: uno solo, no uno por click ni por instancia de `FallbackLink`.
 * Vive a nivel de módulo por la misma razón que `pendingHrefs`, y porque el fallback (una
 * navegación completa) tiene sentido "al último click", no acumulado por cada click que hubo.
 */
let armedFallback: {
  href: string;
  originPathname: string;
  timeoutId: ReturnType<typeof setTimeout>;
  attempt: 1 | 2;
} | null = null;

/**
 * Arma (o reusa) el plazo. Si ya hay uno corriendo para el mismo `href`, lo deja correr: un
 * segundo click sobre el mismo destino no reinicia el reloj. Si hay uno para otro destino, gana
 * el último click y el anterior se cancela sin haber hecho nada (nunca navegó, así que no hay
 * nada que deshacer).
 */
function scheduleFallback(href: string, originPathname: string, attempt: 1 | 2 = 1): void {
  if (armedFallback !== null) {
    if (armedFallback.href === href && attempt === 1) return;
    clearTimeout(armedFallback.timeoutId);
  }
  const timeoutId = setTimeout(
    () => runFallbackCheck(href, originPathname, attempt),
    FALLBACK_DELAY_MS,
  );
  armedFallback = { href, originPathname, timeoutId, attempt };
}

/**
 * Al vencer el plazo: si el pathname ya no es el de origen, algo navegó (a este destino o a
 * cualquier otro) y no hay nada que forzar. Si sigue en origen y Next todavía reporta una
 * navegación pendiente para este href, no es que la haya descartado, está trabajando (backend
 * frío, página pesada): se le da un segundo plazo antes de forzar. Si a la segunda sigue sin
 * moverse, sí se fuerza, esté pendiente o no: una transición colgada es exactamente la falla que
 * este componente existe para tapar.
 */
function runFallbackCheck(href: string, originPathname: string, attempt: 1 | 2): void {
  armedFallback = null;
  if (window.location.pathname !== originPathname) return;
  if (attempt === 1 && pendingHrefs.has(href)) {
    scheduleFallback(href, originPathname, 2);
    return;
  }
  navigateAfterMutation(href);
}

/**
 * Hijo de `<Link>`: `useLinkStatus` sólo lee del contexto que `Link` les da a sus descendientes,
 * no al propio `FallbackLink` que lo renderiza. No dibuja nada; solo publica el estado en
 * `pendingHrefs` y lo retira al desmontar, para no dejar un `true` colgado si el link se va antes
 * de que el plazo lo necesite.
 */
function LinkStatusProbe({ href }: { href: string }) {
  const { pending } = useLinkStatus();

  useEffect(() => {
    if (pending) {
      pendingHrefs.add(href);
    } else {
      pendingHrefs.delete(href);
    }
    return () => {
      pendingHrefs.delete(href);
    };
  }, [href, pending]);

  return null;
}

/**
 * `<Link>` para el shell del alumno (sidebar, topbar, menú del avatar), el catálogo público y Mis
 * aportes. En el shell son los seis-siete links que quedan montados en toda pantalla del área con
 * cuenta, donde el fix del 2026-09-09 (apagar el prefetch de esos mismos links, `prefetch={false}`
 * en `sidebar.tsx` y `topbar.tsx`) no alcanzó (issue #525, con #510 y #477 adentro). El backoffice
 * (`admin-sidebar.tsx`, `admin-topbar.tsx`) conserva sus links propios. Los enlaces al detalle de
 * una universidad y de regreso al listado de cátedras usan esta defensa tras reproducir la
 * navegación trabada en los dos intentos de la corrida 35400879158 de CI (#568).
 *
 * La traza de una falla real de CI (2026-09-14, corrida 34803080787, `settings.spec.ts`) confirma
 * el mecanismo: el click en "Ajustes" dispara el fetch RSC real de `/settings` (sin el header
 * `next-router-prefetch`, a diferencia de un prefetch de fondo) y ese fetch responde 200 en 12ms,
 * con el chunk JS de la pantalla servido 38ms después. Nada se pierde en la red. Lo que se pierde
 * es el commit: `expect(page).toHaveURL(/\/settings$/)` agota sus 30s sin que la URL cambie una
 * sola vez. 223ms antes del click, dos `<Link>` de `/home` sin `prefetch={false}` (el CTA de
 * `HomeEmptyState` hacia `/reviews/new` y el de `CareerCoverageCard` hacia `/careers/[id]`)
 * dispararon su propio prefetch (`next-router-prefetch: 1`). Es la misma causa que la entrada del
 * 2026-09-09: Next 15.5 (arquitectura pre-segment-cache) puede descartar una acción NAVIGATE
 * pendiente bajo una ráfaga de acciones de router concurrentes, sin ningún error. Apagar el
 * prefetch de esos otros links taparía esta fuente puntual, pero no la próxima: cualquier pantalla
 * puede montar un link sin `prefetch={false}` que compita con el click real. Por eso este
 * componente ataca el síntoma (la URL no cambió) en vez de perseguir cada fuente de ráfaga.
 *
 * La corrida 35024385479 de CI (2026-09-15) mostró la misma falla en el catálogo: en
 * `[mobile] e2e/public/soft-navigation.spec.ts:36`, el click en la primera fila de "En una sola
 * institución" en `/careers` a los 287ms fue seguido a los 326ms por un prefetch de fondo de
 * `/universities`, con el RSC real de `/careers/[id]` recién a los 367ms (200) y su chunk a los
 * 444ms. La URL no cambió nunca: la aserción venció a los 10s.
 *
 * El mecanismo: en `onClick` de un click primario sin modificadores hacia un href interno, se deja
 * que `Link` haga lo suyo y se arma un plazo a nivel de módulo (`scheduleFallback`), no en el
 * componente: el menú del avatar cierra su dropdown en el mismo click que dispara la navegación
 * (`onClick={onClose}` en `avatar-menu.tsx`), y un timer que viviera en un `useRef` de `FallbackLink`
 * se limpiaría al desmontar antes de tener la chance de disparar. El módulo no tiene ese problema.
 * Si al vencer el plazo el pathname sigue siendo el de origen y Next no reporta una navegación en
 * vuelo para ese href, se fuerza con `navigateAfterMutation` (la misma vía de escape que ya usan
 * doce formularios: `window.location.assign`, que saca a React de la ecuación). Si hay una
 * navegación en vuelo, se da un segundo plazo antes de forzar (una carga lenta no es el fallo que
 * esto defiende). Nunca hay más de un plazo pendiente para toda la app: el último click gana, y un
 * segundo click sobre el mismo destino no reinicia el que ya está corriendo.
 *
 * 660 corridas locales de los tres specs (settings, help, write-review) bajo `--repeat-each` con
 * CPU cargada (2 y después 6 procesos saturando el resto de los cores) no reprodujeron la firma:
 * depende de un timing de scheduler que un runner de 4 vCPU compartido con todo el stack toca
 * seguido y esta máquina, con 12 cores libres salvo por la carga sintética, no. El plazo (2000ms)
 * es el punto de partida del spec, no una tasa medida localmente; contra la traza real, la ventana
 * de la ráfaga fue de ~230ms, así que 2000ms deja margen de sobra sin alargar perceptiblemente un
 * click que hoy, cuando falla, no se recupera nunca (los 30s del timeout del test lo prueban).
 *
 * Autenticación, landing y páginas de error no tienen esta defensa: el timer tiene un costo
 * (un reload completo) que no se paga sin evidencia de navegación trabada.
 */
export function FallbackLink({ href, onClick, children, ...rest }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    // El consumidor ya decidió que este click no navega (p.ej. llamó preventDefault): no hay
    // push que defender.
    if (event.defaultPrevented) return;
    // Click modificado (otro botón, o abrir en pestaña/ventana nueva): el navegador decide.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    // target !== "_self" (pestaña nueva) o download: tampoco es la navegación in-app que Link
    // intercepta. Se lee del DOM, como hace el propio Link, no del prop: es lo que importa.
    const anchor = event.currentTarget;
    const targetAttr = anchor.getAttribute('target');
    if ((targetAttr && targetAttr !== '_self') || anchor.hasAttribute('download')) {
      return;
    }

    let target: URL;
    try {
      // Contra `window.location.href`, no solo el origin: un href relativo (no absoluto desde
      // la raíz) tiene que resolver contra la página actual para comparar y forzar al mismo lugar.
      target = new URL(href, window.location.href);
    } catch {
      return;
    }
    // href externo (otro origin, mailto:, etc.): Link no dispara un router.push que defender.
    if (target.origin !== window.location.origin) return;
    // Ya estamos en el destino: no hay push que pueda perderse.
    if (target.pathname === window.location.pathname) return;

    scheduleFallback(href, window.location.pathname);
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
      <LinkStatusProbe href={href} />
    </Link>
  );
}
