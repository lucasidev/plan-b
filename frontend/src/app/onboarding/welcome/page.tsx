import { redirect } from 'next/navigation';
import { WelcomeScreen } from '@/features/onboarding';
import { displayNameFromEmail } from '@/lib/member-shell';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * `/onboarding/welcome` step 01 (US-037-f).
 *
 * Guard: if the user already has a StudentProfile, there's no point in showing welcome
 * (onboarding is complete) → redirect to /home. Otherwise, show welcome.
 *
 * Once the JWT starts loading `firstName`/`lastName` (US-047), displayNameFromEmail
 * is replaced with a direct session read.
 */
export default async function OnboardingWelcomePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (profile) redirect('/home');

  return <WelcomeScreen displayName={displayNameFromEmail(session.email)} />;
}
