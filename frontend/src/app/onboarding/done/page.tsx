import { redirect } from 'next/navigation';
import { DoneScreen } from '@/features/onboarding';
import { displayNameFromEmail } from '@/lib/member-shell';
import { getSession } from '@/lib/session';

/**
 * `/onboarding/done` — paso 04 (US-037-f). Confirmación + CTA "Ir a Inicio".
 *
 * No hay guard de profile: si el user llegó acá es porque pasó por paso 02
 * (que crea el profile) y eligió "lo cargo después" en paso 03. En el peor
 * caso pega URL directa, ve la confirmación y va a /home — el guard de
 * `(member)` lo manejará si no tiene profile real.
 *
 * El detalle del profile (carrera + plan year) NO se muestra acá para
 * mantener el server component simple sin múltiples API roundtrips.
 * Cuando aterrice US-047 (Mi perfil), el detalle vive ahí.
 */
export default async function OnboardingDonePage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  return <DoneScreen displayName={displayNameFromEmail(session.email)} />;
}
