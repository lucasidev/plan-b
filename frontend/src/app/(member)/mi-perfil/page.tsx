import { redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { DeactivateAccountButton } from '@/features/deactivate-account';
import { fetchMyProfile, MyProfileForm } from '@/features/my-profile';

export const metadata = {
  title: 'Mi perfil · planb',
};

// Per-user, depende de cookies. Dynamic para evitar prerender con backend down.
export const dynamic = 'force-dynamic';

/**
 * /mi-perfil (US-047). Server component que fetchea el perfil del user logueado y delega al
 * cliente la view/edit mode. Zona peligrosa al pie con el CTA de dar de baja la cuenta
 * (ADR-0044, US-038-bis frontend).
 *
 * <para>
 * Si el user no tiene profile activo (caso degenerado post-onboarding o post-deactivate),
 * redirigimos a /onboarding/welcome. El layout (member) ya hace el guard pero esto es defensa
 * en profundidad.
 * </para>
 */
export default async function MyProfilePage() {
  const profile = await fetchMyProfile();
  if (!profile) {
    redirect('/onboarding/welcome');
  }

  return (
    <div className="flex flex-col gap-10 py-6">
      <header>
        <DisplayHeading>Mi perfil</DisplayHeading>
        <Lede>Tus datos académicos y la baja de cuenta.</Lede>
      </header>

      <MyProfileForm profile={profile} />

      <section className="max-w-2xl">
        <h2 className="text-base font-semibold text-ink-1 mb-2">Zona peligrosa</h2>
        <DeactivateAccountButton email={profile.email} />
      </section>
    </div>
  );
}
