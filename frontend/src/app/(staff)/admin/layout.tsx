import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/layout/admin-shell';
import { getSession } from '@/lib/session';

/**
 * Guard del backoffice `/admin` (US-081): staff que opera el backoffice, hoy admin o moderador. Cada
 * sección enforcea su rol fino (Docentes es admin-only vía `teachers/layout`; Moderación es moderator|
 * admin). La autorización real la hace el backend en cada endpoint (RequireRole); este guard es UX.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'moderator')) {
    redirect('/sign-in');
  }
  return (
    <AdminShell email={session.email} role={session.role}>
      {children}
    </AdminShell>
  );
}
