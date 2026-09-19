import { notFound } from 'next/navigation';
import { fetchOfficialFactsServer } from '@/components/facts';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { fetchCareersByUniversityServer } from '@/features/manage-careers/api.server';
import { InstitutionProfileEditor, UniversityForm } from '@/features/manage-universities';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';
import { fetchInstitutionProfile } from '@/features/manage-universities/profile-api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de universidad (US-060 admin). Solo activas: si está desactivada, 404 (se reactiva desde
 * el listado, no se edita directo).
 */
export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [university, profile, facts, careers] = await Promise.all([
    fetchUniversityDetailServer(id),
    fetchInstitutionProfile(id),
    fetchOfficialFactsServer('Institution', id),
    fetchCareersByUniversityServer(id),
  ]);

  if (!university?.isActive || !profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Universidades"
        title={`Editar: ${university.name}`}
        subtitle="Los cambios se reflejan en el catálogo público y en el onboarding."
      />
      <UniversityForm mode="edit" university={university} />
      <InstitutionProfileEditor
        profile={profile}
        facts={facts}
        careers={careers}
        slug={university.slug}
      />
    </div>
  );
}
