import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Layout of the `(onboarding)` route group. Minimal guard for the US-037-f flow:
 *
 *   - No session → `/sign-in`.
 *   - Session + role other than `member` → `/home` (onboarding is for students only).
 *
 * The "you already have a StudentProfile" check does NOT live here because it would
 * break the flow: after step 02 the user has a profile, and steps 03/04 are
 * non-mandatory UX but still nice to see. The welcome and career pages do their own
 * "no profile" check (a user with profile who hits the URL directly goes to /home),
 * while history and done only need a session.
 *
 * The layout does NOT render AppShell. The 4 pages use their own `<OnboardingShell>`
 * (cream + radial glow + dot stepper). AppShell only appears after the student lands
 * on `/home` post-onboarding.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/home');

  return <>{children}</>;
}
