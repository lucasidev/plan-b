import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Layout del route group `(onboarding)`. Guard mínimo del flow de US-037-f:
 *
 *   - Sin sesión → `/sign-in`.
 *   - Con sesión + role distinto a `member` → `/home` (onboarding es solo
 *     para alumnos).
 *
 * El chequeo "ya tenés StudentProfile" NO va acá porque romperíamos el
 * flow: después del paso 02 el user tiene profile, y los pasos 03/04 son
 * UX no obligatorios pero deseable que se vean. Las páginas welcome y
 * career hacen su propio chequeo de "no profile" (un user con profile
 * que pega URL directa va a /home), mientras que history y done solo
 * necesitan sesión.
 *
 * El layout NO renderea AppShell. Las 4 páginas usan su propio
 * `<OnboardingShell>` (cream + radial glow + stepper de dots). El AppShell
 * aparece solo después que el alumno aterriza en `/home` post-onboarding.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  if (session.role !== 'member') redirect('/home');

  return <>{children}</>;
}
