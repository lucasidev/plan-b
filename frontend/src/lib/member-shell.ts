/**
 * Helpers del shell de toda la aplicación (US-042-f), con o sin sesión.
 *
 * Viven bajo `lib/` (no `components/layout/`) porque son funciones puras sin JSX, que
 * reutilizan Sidebar (item activo, qué rutas pide sesión), Topbar (migas) y AvatarMenu
 * (iniciales).
 */

/**
 * Catálogo de rutas del shell, con el copy y un hint de shortcut estilo mockup.
 *
 * El path es la fuente de verdad: se usa tanto para el `Link href` del sidebar como para el
 * match de "item activo" contra `usePathname()`, y para derivar la miga actual.
 *
 * `activePrefixes` cubre una ruta cuyo item de nav queda encendido en más de un árbol de rutas
 * (Explorar enciende `/universities`, pero también `/careers`, `/subjects`, etc: son las mismas
 * dos lentes del catálogo). Sin esa lista, el default es el propio `path`.
 *
 * `requiresSession` oculta el item del sidebar a quien no es `member`: Mis aportes no tiene nada
 * que mostrarle a un anónimo o a un admin, y linkear a una pantalla que el guard de `(member)`
 * va a rebotar es peor que no mostrarla.
 *
 * `gateWhenAnonymous` deja el item visible, pero para quien no es `member` (anónimo o con otro
 * rol) el link pasa por `/sign-in?from=<path>` en vez de ir directo: un anónimo vuelve al item
 * después de entrar (US-229), y una cuenta que no es de alumno pasa igual por el gate en vez de
 * pegar contra el guard de `(member)` sin explicación.
 */
export type MemberRoute = {
  readonly path: string;
  readonly label: string;
  readonly section: 'community' | 'other';
  readonly shortcut?: string;
  readonly activePrefixes?: readonly string[];
  readonly requiresSession?: boolean;
  readonly gateWhenAnonymous?: boolean;
};

export const memberRoutes: readonly MemberRoute[] = [
  // Explorar es la puerta al catálogo entero (universidades, carreras, materias, cátedras,
  // docentes): un solo item de nav para las dos lentes de US-222. Mis aportes va sin encabezado
  // junto a Explorar: son la navegación primaria, no un grupo temático.
  {
    path: '/universities',
    label: 'Explorar',
    section: 'community',
    shortcut: '⌘1',
    activePrefixes: ['/universities', '/careers', '/subjects', '/chairs', '/teachers', '/plans'],
  },
  // Mis aportes: lo que esta cuenta reseñó, para poder editarlo o borrarlo (US-165). Pide
  // sesión: sin cuenta no hay nada propio que mostrar.
  {
    path: '/reviews/mine',
    label: 'Mis aportes',
    section: 'community',
    shortcut: '⌘2',
    requiresSession: true,
  },

  // Otros (Método, Ajustes, Ayuda, Sobre plan-b), agrupados al pie del sidebar per el mockup
  // `soporte-v2-ayuda.png`. Mi perfil sigue en el menú del avatar, no en esta nav.
  { path: '/method', label: 'Método', section: 'other' },
  // Ajustes vive bajo `(member)` (guard con rol): gateado, no oculto, porque la maqueta lo
  // muestra también sin cuenta.
  { path: '/settings', label: 'Ajustes', section: 'other', gateWhenAnonymous: true },
  { path: '/help', label: 'Ayuda', section: 'other' },
  { path: '/about', label: 'Sobre plan-b', section: 'other' },
] as const;

/**
 * Las secciones del sidebar. La primera va **sin label**: agrupa la navegación primaria, y
 * ponerle nombre obliga a inventar uno que no está en el glosario (era "Comunidad", que no
 * describe ni a Explorar ni a Mis aportes). "Otros" separa lo secundario, que sí necesita el corte.
 */
export const memberSections: ReadonlyArray<{
  readonly key: MemberRoute['section'];
  readonly label?: string;
}> = [{ key: 'community' }, { key: 'other', label: 'Otros' }] as const;

/**
 * Deriva las migas desde `usePathname()`. El shell hoy muestra como mucho dos niveles (sección
 * raíz + página activa); el topbar no tiene lugar visual para migas más anidadas.
 *
 * Devuelve un array vacío para paths desconocidos (el topbar dibuja el último segmento pelado,
 * que es honesto mientras una ruta se está construyendo).
 */
export function breadcrumbsForPath(pathname: string): ReadonlyArray<string> {
  const exploreLabel = breadcrumbForExplorePath(pathname);
  if (exploreLabel) return ['Explorar', exploreLabel];

  // Método y Sobre plan-b cuelgan del sidebar bajo "Otros" (misma sección que Ajustes y Ayuda),
  // pero son pantallas de contenido propio: la miga no repite el nombre de esa sección.
  if (pathname === '/method') return ['Método'];
  if (pathname === '/about') return ['Sobre plan-b'];

  const route = memberRoutes.find((r) => r.path === pathname);
  if (route) {
    const section = memberSections.find((s) => s.key === route.section);
    return section?.label ? [section.label, route.label] : [route.label];
  }

  // Patrones conocidos de rutas dinámicas que no entran en memberRoutes (tienen [param] o van
  // anidadas). El topbar muestra un copy amigable en vez del slug crudo de la URL.
  if (pathname === '/reviews/new') {
    return ['Reseñar una cursada'];
  }
  if (pathname === '/reviews/mine') {
    return ['Mis aportes'];
  }

  // Fallback: parte el path en segmentos capitalizados. Mejor que vacío.
  const segment = pathname.split('/').filter(Boolean).pop();
  return segment ? [segment.charAt(0).toUpperCase() + segment.slice(1)] : [];
}

/**
 * La miga de segundo nivel de cada pantalla del catálogo (bajo "Explorar"). `null` si el
 * pathname no es ninguna de sus rutas. El orden de los `if` importa: las rutas anidadas
 * (`/careers/<id>/plans`) tienen que resolverse antes que su prefijo genérico
 * (`/careers/<id>`).
 */
function breadcrumbForExplorePath(pathname: string): string | null {
  if (pathname === '/universities') return 'Universidades';
  if (pathname === '/careers') return 'Carreras';
  if (/^\/universities\/[^/]+\/careers$/.test(pathname)) return 'Universidad';
  // Distinta del plan puntual (`/plans/[id]/subjects`, más abajo): esta es la lista de planes de
  // la carrera, y el h1 de la página dice "Planes de estudio", no "Plan {año}".
  if (/^\/careers\/[^/]+\/plans$/.test(pathname)) return 'Planes de estudio';
  if (/^\/careers\/[^/]+\/where-to-study$/.test(pathname)) return 'Dónde estudiarla';
  if (/^\/careers\/[^/]+$/.test(pathname)) return 'Carrera';
  if (/^\/plans\/[^/]+\/subjects$/.test(pathname)) return 'Plan';
  if (/^\/subjects\/[^/]+$/.test(pathname)) return 'Materia';
  if (/^\/chairs\/[^/]+$/.test(pathname)) return 'Cátedra';
  if (/^\/teachers\/[^/]+$/.test(pathname)) return 'Docente';
  return null;
}

/**
 * Two letters from the email's local part. We grab the first letter and the letter
 * after the first dot (so "lucia.mansilla@gmail.com" -> "LM" and "lucia@gmail.com" ->
 * "LU"). Falls back to the first two letters of the local part if there's no dot.
 *
 * Why not first + last name? Because the session does not carry a display name yet: the
 * StudentProfile aggregate that owns it lands in US-012. When that ships, this helper
 * gets a sibling that prefers `firstName` + `lastName` initials and the AppShell
 * switches over.
 */
export function getInitialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return '?';

  const dotIndex = local.indexOf('.');
  if (dotIndex > 0 && dotIndex < local.length - 1) {
    return (local[0] + local[dotIndex + 1]).toUpperCase();
  }

  return local.slice(0, 2).toUpperCase().padEnd(2, '?');
}

/**
 * Temporary display name: "lucia.mansilla@gmail.com" goes to "Lucia Mansilla". Same
 * reason as getInitialsFromEmail: the StudentProfile does not yet carry
 * firstName/lastName in the JWT. When it lands, this helper is replaced by reading
 * those directly from the session (US-047 Mi perfil).
 */
export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return email;
  return local
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
