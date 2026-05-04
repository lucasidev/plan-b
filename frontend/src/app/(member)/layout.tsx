import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getSession } from '@/lib/session';

/**
 * Layout del route group `(member)`. Hace dos cosas:
 *
 *  1. **Guard server-side**: redirige a `/sign-in` si no hay session válida
 *     o el role no es `member`. La autorización real igual la hace el backend
 *     (ADR-0023); este guard es UX para evitar request rechazados y flashes.
 *
 *  2. **AppShell**: envuelve cada página del route group con el chrome
 *     (sidebar + topbar + avatar dropdown). Cualquier ruta que cuelgue de
 *     `app/(member)/` hereda el shell. Las páginas solo escriben su
 *     contenido principal.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');

  return <AppShell email={session.email}>{children}</AppShell>;
}
