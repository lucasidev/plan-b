/**
 * Helpers for the authenticated-area AppShell (US-042-f).
 *
 * They live under `lib/` (not `components/layout/`) because they are pure functions with
 * no JSX, reused across Sidebar (active item), Topbar (breadcrumbs), and AvatarMenu
 * (initials). If any other product route needs them later (e.g. the home), they are an
 * import away.
 */

/**
 * Catalog of `(member)` routes with the display copy and an optional mockup-style
 * shortcut hint.
 *
 * The path is the source of truth: we use it for both the `Link href` in the sidebar
 * and for the "active item" match based on `usePathname()`, and to derive the current
 * breadcrumb label.
 *
 * When a new catalog route lands, add it here. When a stub gets real content, nothing
 * in the shell has to change: the page decides whether to render ComingSoon or the real
 * content.
 */
export type MemberRoute = {
  readonly path: string;
  readonly label: string;
  readonly section: 'my-term' | 'community' | 'other';
  readonly shortcut?: string;
  /** Future US that will replace this stub with real content. Display only. */
  readonly futureUs?: string;
};

export const memberRoutes: readonly MemberRoute[] = [
  // My term
  {
    path: '/home',
    label: 'Inicio',
    section: 'my-term',
    shortcut: '⌘1',
  },
  {
    path: '/my-career',
    label: 'Mi carrera',
    section: 'my-term',
    shortcut: '⌘2',
    futureUs: 'US-045',
  },
  {
    path: '/plan',
    label: 'Planificar',
    section: 'my-term',
    shortcut: '⌘3',
    futureUs: 'US-016',
  },

  // Community
  { path: '/reviews', label: 'Reseñas', section: 'community', shortcut: '⌘4', futureUs: 'US-048' },

  // Other (Settings, Help, About plan-b, per the `soporte-v2-ayuda.png` mockup that
  // groups the three items under "OTROS" at the bottom of the v2 sidebar). My profile
  // still lives in the avatar menu, not in this nav.
  { path: '/settings', label: 'Ajustes', section: 'other' },
  { path: '/help', label: 'Ayuda', section: 'other' },
  { path: '/about', label: 'Sobre plan-b', section: 'other' },
] as const;

export const memberSections: ReadonlyArray<{
  readonly key: MemberRoute['section'];
  readonly label: string;
}> = [
  { key: 'my-term', label: 'Mi cuatrimestre' },
  { key: 'community', label: 'Comunidad' },
  { key: 'other', label: 'Otros' },
] as const;

/**
 * Derives breadcrumbs from `usePathname()`. The shell currently only shows up to two
 * levels (root section + active page); the topbar doesn't have visual room for nested
 * crumbs and none of the member routes are nested deeper than one level, so this is
 * enough.
 *
 * Returns an empty array for unknown paths (the topbar then renders just the bare last
 * segment, which is honest while a route is being built out).
 */
export function breadcrumbsForPath(pathname: string): ReadonlyArray<string> {
  const route = memberRoutes.find((r) => r.path === pathname);
  if (route) {
    const section = memberSections.find((s) => s.key === route.section);
    return section ? [section.label, route.label] : [route.label];
  }

  // Known patterns for dynamic routes that do not fit into memberRoutes (because they
  // have [param] or nested levels). The topbar shows a friendly copy instead of the raw
  // URL slug.
  if (pathname.startsWith('/reviews/write/')) {
    return ['Comunidad', 'Nueva reseña'];
  }

  // Fallback: split the path into capitalised segments. Better than empty.
  const segment = pathname.split('/').filter(Boolean).pop();
  return segment ? [segment.charAt(0).toUpperCase() + segment.slice(1)] : [];
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
