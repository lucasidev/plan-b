import { redirect } from 'next/navigation';
import { DoneScreen } from '@/features/onboarding';
import { displayNameFromEmail } from '@/lib/member-shell';
import { getSession } from '@/lib/session';

/**
 * `/onboarding/done` step 04 (US-037-f). Confirmation + "Ir a Inicio" CTA.
 *
 * No profile guard: if the user got here it's because they went through step 02
 * (which creates the profile) and picked "lo cargo después" in step 03. Worst case
 * they paste the URL directly, see the confirmation and go to /home; the `(member)`
 * guard will handle it if they have no real profile.
 *
 * The profile detail (career + plan year) is NOT shown here to keep the server
 * component simple without multiple API roundtrips. Once US-047 (Mi perfil) lands,
 * the detail lives there.
 */
export default async function OnboardingDonePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  return <DoneScreen displayName={displayNameFromEmail(session.email)} />;
}
