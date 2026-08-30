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
 *  2. **AppShell**: wraps every page in the route group with the chrome (sidebar +
 *     topbar + avatar dropdown). Any route under `app/(member)/` inherits the shell.
 *     The pages only write their main content.

 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/sign-in');

  // No hay guard de perfil: toda cuenta declara su carrera al registrarse y el perfil nace al
  // verificar el mail (ADR-0086), así que faltar es la excepción, no un paso pendiente. Cuando
  // falta, el shell se muestra igual sin etiqueta y Mi perfil ofrece declararla: mandar a una
  // pantalla obligatoria antes de dejar leer o aportar es lo que la garantía US-170 prohíbe.
  const profile = await fetchStudentProfile();

  // "UNSTA · Carrera" del profile. La uni es el slug/acrónimo; el CSS del sidebar ya hace
  // uppercase. filter(Boolean) cubre labels null (career colgada): muestra lo que haya.
  const contextLabel = profile
    ? [profile.universityShortName, profile.careerName].filter(Boolean).join(' · ')
    : '';

  return (
    <>
      <OfflineBanner />
      <AppShell email={session.email} contextLabel={contextLabel}>
        {children}
      </AppShell>
    </>
  );
}
