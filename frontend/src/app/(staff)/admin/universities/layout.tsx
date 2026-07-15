import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Guard admin-only del subtree de universidades (US-060). El backoffice `/admin` admite moderador,
 * pero el CRUD de universidades es solo admin: un moderador que llegue acá por link directo se manda
 * a su cola de moderación. El backend igual rechaza con 403; este guard evita renderear una página
 * que va a fallar.
 */
export default async function AdminUniversitiesLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }
  if (session.role !== 'admin') {
    redirect('/admin/moderacion/reportes');
  }
  return <>{children}</>;
}
