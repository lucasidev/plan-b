import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CareerForm } from '@/features/manage-careers';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/** Alta de carrera bajo una universidad (US-061 admin). */
export default async function NewCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: universityId } = await params;
  const university = await fetchUniversityDetailServer(universityId);

  if (!university) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow={`${university.name} · Carreras`}
        title="Nueva carrera"
        subtitle="Alta en el catálogo. Después cargás sus planes de estudio desde el detalle."
      />
      <CareerForm mode="create" universityId={universityId} />
    </div>
  );
}
