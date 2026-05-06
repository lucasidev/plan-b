import { redirect } from 'next/navigation';
import { WelcomeScreen } from '@/features/onboarding';
import { displayNameFromEmail } from '@/lib/member-shell';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/welcome` — paso 01 (US-037-f).
 *
 * Guard: si el user ya tiene StudentProfile, no tiene sentido que vea welcome
 * (el onboarding está completo) → redirect a /home. Si no, mostramos welcome.
 *
 * Cuando el JWT empiece a cargar `firstName`/`lastName` (US-047), el
 * displayNameFromEmail se reemplaza por leer del session directo.
 */
export default async function OnboardingWelcomePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile(session.userId);
  if (profile) redirect('/home');

  return <WelcomeScreen displayName={displayNameFromEmail(session.email)} />;
}
