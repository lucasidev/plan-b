import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/layout/admin-shell';
import { getSession } from '@/lib/session';

/**
 * Guard del backoffice `/admin` (US-081): solo rol `admin`, más estricto que el group `(staff)` (que
 * también admite moderator / university_staff, con scope distinto). La autorización real la hace el
 * backend en cada endpoint (RequireRole); este guard es UX. Envuelve todo en el AdminShell.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/sign-in');
  }
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
