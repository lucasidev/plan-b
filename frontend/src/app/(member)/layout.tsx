import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { getSession } from '@/lib/session';

/**
 * Layout of the `(member)` route group. Does two things:
 *
 *  1. **Session guard**: redirects to `/sign-in` if there is no valid session or the
 *     role is not `member`. Real authorization still happens in the backend
 *     (ADR-0023); this guard is UX to avoid rejected requests and flashes.
 *
 *  2. **AppShell**: mismo shell que `(planb)` (sidebar + topbar + avatar dropdown), acá siempre
 *     con sesión. La etiqueta "Universidad · Carrera" que vivía bajo el logo se retiró del shell:
 *     el sidebar ya no la necesita para distinguir esta área, que ahora comparte chrome con el
 *     catálogo público.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');

  return (
    <>
      <OfflineBanner />
      <AppShell session={session}>{children}</AppShell>
    </>
  );
}
