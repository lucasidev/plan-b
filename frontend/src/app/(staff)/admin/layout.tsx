import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/layout/admin-shell';
import { getSession } from '@/lib/session';

/**
 * Guard del backoffice `/admin` (US-081): hoy solo admin. Moderación se retiró en R2 y con ella el
 * rol que compartía este backoffice, así que ninguna sección necesita ya su propio guard fino: los
 * tres que había (docentes, universidades, comisiones) repetían este mismo chequeo y mandaban a una
 * cola de moderación que no existe. La autorización real la hace el backend en cada endpoint
 * (RequireRole); este guard es UX.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/sign-in');
  }
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
