import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UniversityForm } from '@/features/manage-universities';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de universidad (US-060 admin). Solo activas: si está desactivada, 404 (se reactiva desde
 * el listado, no se edita directo).
 */
export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = await fetchUniversityDetailServer(id);

  if (!university?.isActive) {
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
    </div>
  );
}
