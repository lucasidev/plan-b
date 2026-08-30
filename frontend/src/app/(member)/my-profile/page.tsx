import { DisplayHeading } from '@/components/ui/display-heading';
import { Lede } from '@/components/ui/lede';
import { DeactivateAccountButton } from '@/features/deactivate-account';
import { DeclareCareerCard } from '@/features/declare-career';
import { fetchMyProfile, MyProfileForm } from '@/features/my-profile';

export const metadata = {
  title: 'Mi perfil · planb',
};

// Per-user, depends on cookies. Dynamic to avoid prerendering with backend down.
export const dynamic = 'force-dynamic';

/**
 * /my-profile (US-047). Server component that fetches the logged-in user's profile and
 * delegates view/edit mode to the client. Danger zone at the foot with the deactivate
 * account CTA (ADR-0044, US-038-bis frontend).
 *
 * Sin perfil activo, la pantalla ofrece declarar la carrera en vez de mandar a otro lado: es
 * el único lugar del producto donde se puede arreglar ese estado, y llegar acá no exige nada
 * (la garantía US-170 prohíbe pedir que completes algo para dejarte leer o aportar).
 */
export default async function MyProfilePage() {
  const profile = await fetchMyProfile();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header>
        <DisplayHeading>Mi perfil</DisplayHeading>
        <Lede>Tus datos académicos y la baja de cuenta.</Lede>
      </header>

      {profile ? <MyProfileForm profile={profile} /> : <DeclareCareerCard />}

      {profile && (
        <section className="max-w-2xl">
          <h2 className="text-base font-semibold text-ink-1 mb-2">Zona peligrosa</h2>
          <DeactivateAccountButton email={profile.email} />
        </section>
      )}
    </div>
  );
}
