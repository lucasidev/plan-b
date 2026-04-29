/**
 * Helpers para el AppShell del área autenticada (US-042-f).
 *
 * Viven en `lib/` (no en `components/layout/`) porque son funciones puras
 * sin JSX que se reusan entre Sidebar (item activo), Topbar (breadcrumbs)
 * y AvatarMenu (iniciales). Si alguna otra ruta del producto las necesita
 * en el futuro (ej. la home), están a un import de distancia.
 */

/**
 * Catálogo de las rutas del área `(member)` con el copy display + opcional
 * shortcut hint del mockup.
 *
 * El path es la fuente de verdad: lo usamos tanto para el `Link href` del
 * sidebar como para el match de "item activo" basado en `usePathname()`,
 * y para derivar el label del breadcrumb actual.
 *
 * Cuando una ruta nueva del catálogo aterrice, se suma acá. Cuando deje
 * de ser stub, no hay que tocar nada del shell — la página decide
 * si renderiza ComingSoon o el contenido real.
 */
export type MemberRoute = {
  readonly path: string;
  readonly label: string;
  readonly section: 'mi-cuatrimestre' | 'comunidad' | 'cuenta';
  readonly shortcut?: string;
  /** US futura que va a llenar este stub con contenido real. Display only. */
  readonly futureUs?: string;
};

export const memberRoutes: readonly MemberRoute[] = [
  // Mi cuatrimestre
  {
    path: '/home',
    label: 'Inicio',
    section: 'mi-cuatrimestre',
    shortcut: '⌘1',
  },
  {
    path: '/plan',
    label: 'Plan de estudios',
    section: 'mi-cuatrimestre',
    shortcut: '⌘2',
    futureUs: 'US-001',
  },
  {
    path: '/simulator',
    label: 'Simulador',
    section: 'mi-cuatrimestre',
    shortcut: '⌘3',
    futureUs: 'US-016',
  },

  // Comunidad
  { path: '/subjects', label: 'Materias', section: 'comunidad', shortcut: 'M', futureUs: 'US-002' },
  {
    path: '/professors',
    label: 'Docentes',
    section: 'comunidad',
    shortcut: 'D',
    futureUs: 'US-003',
  },
  { path: '/reviews', label: 'Mis reseñas', section: 'comunidad', futureUs: 'US-020' },

  // Cuenta
  { path: '/history', label: 'Historial académico', section: 'cuenta', futureUs: 'US-013' },
  { path: '/settings', label: 'Configuración', section: 'cuenta' },
] as const;

export const memberSections: ReadonlyArray<{
  readonly key: MemberRoute['section'];
  readonly label: string;
}> = [
  { key: 'mi-cuatrimestre', label: 'Mi cuatrimestre' },
  { key: 'comunidad', label: 'Comunidad' },
  { key: 'cuenta', label: 'Cuenta' },
] as const;

/**
 * Derives breadcrumbs from `usePathname()`. The shell currently only
 * shows up to two levels (root section + active page); the topbar
 * doesn't have visual room for nested crumbs and none of the member
 * routes are nested deeper than one level, so this is enough.
 *
 * Returns an empty array for unknown paths (the topbar then renders
 * just the bare last segment, which is honest while a route is being
 * built out).
 */
export function breadcrumbsForPath(pathname: string): ReadonlyArray<string> {
  const route = memberRoutes.find((r) => r.path === pathname);
  if (route) {
    const section = memberSections.find((s) => s.key === route.section);
    return section ? [section.label, route.label] : [route.label];
  }

  // Fallback: split the path into capitalised segments. Better than empty.
  const segment = pathname.split('/').filter(Boolean).pop();
  return segment ? [segment.charAt(0).toUpperCase() + segment.slice(1)] : [];
}

/**
 * Two letters from the email's local part. We grab the first letter and
 * the letter after the first dot (so "lucia.mansilla@gmail.com" -> "LM"
 * and "lucia@gmail.com" -> "LU"). Falls back to the first two letters of
 * the local part if there's no dot.
 *
 * Why not first + last name? Because session doesn't carry a display
 * name yet — the StudentProfile aggregate that owns it lands in US-012.
 * When that ships, this helper gets a sibling that prefers `firstName`
 * + `lastName` initials and the AppShell switches over.
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
