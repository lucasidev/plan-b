import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CareerForm } from '@/features/manage-careers';
import { fetchCareerDetailServer } from '@/features/manage-careers/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de carrera (US-061 admin). Solo activas: si está desactivada, 404 (se reactiva desde el
 * listado, no se edita directo, mismo criterio que el edit de universidad).
 */
export default async function EditCareerPage({
  params,
}: {
  params: Promise<{ id: string; careerId: string }>;
}) {
  const { id: universityId, careerId } = await params;
  const career = await fetchCareerDetailServer(careerId);

  // Solo activas, y la carrera tiene que pertenecer a la uni de la ruta (el GET por id no valida el
  // parent): una URL cruzada o una carrera desactivada caen a 404.
  if (!career?.isActive || career.universityId !== universityId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Carreras"
        title={`Editar: ${career.name}`}
        subtitle="Los cambios se reflejan en el catálogo y en la ficha de la carrera."
      />
      <CareerForm mode="edit" universityId={universityId} career={career} />
    </div>
  );
}
