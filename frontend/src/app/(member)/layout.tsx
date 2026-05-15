import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * Layout del route group `(member)`. Hace tres cosas:
 *
 *  1. **Guard de sesión**: redirige a `/sign-in` si no hay session válida o
 *     el role no es `member`. La autorización real igual la hace el backend
 *     (ADR-0023); este guard es UX para evitar request rechazados y flashes.
 *
 *  2. **Guard de onboarding (US-037-f)**: si el user no tiene StudentProfile
 *     todavía, redirige a `/onboarding/welcome` para que complete el flow.
 *     Sin profile, las pantallas de `(member)` (Inicio, Mi carrera, etc.) no
 *     tienen sentido porque no hay carrera asociada.
 *
 *  3. **AppShell**: envuelve cada página del route group con el chrome
 *     (sidebar + topbar + avatar dropdown). Cualquier ruta que cuelgue de
 *     `app/(member)/` hereda el shell. Las páginas solo escriben su
 *     contenido principal.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  return <AppShell email={session.email}>{children}</AppShell>;
}
