import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * Layout of the `(member)` route group. Does three things:
 *
 *  1. **Session guard**: redirects to `/sign-in` if there is no valid session or the
 *     role is not `member`. Real authorization still happens in the backend
 *     (ADR-0023); this guard is UX to avoid rejected requests and flashes.
 *
 *  2. **Onboarding guard (US-037-f)**: if the user does not have a StudentProfile yet,
 *     redirects to `/onboarding/welcome` to complete the flow. Without a profile, the
 *     `(member)` screens (Inicio, Mi carrera, etc.) don't make sense because there is
 *     no associated career.
 *
 *  3. **AppShell**: wraps every page in the route group with the chrome (sidebar +
 *     topbar + avatar dropdown). Any route under `app/(member)/` inherits the shell.
 *     The pages only write their main content.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  // Real chrome label (US-012 debt): "UNSTA · Carrera" del profile, en vez del hardcode. La uni
  // es el slug/acrónimo; el CSS del sidebar ya hace uppercase. filter(Boolean) cubre el caso
  // defensivo de labels null (career colgada): muestra lo que haya.
  const contextLabel = [profile.universityShortName, profile.careerName]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <OfflineBanner />
      <AppShell email={session.email} contextLabel={contextLabel}>
        {children}
      </AppShell>
    </>
  );
}
