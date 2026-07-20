import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TermForm } from '@/features/manage-terms';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/** Alta de período lectivo bajo una universidad (US-064 admin). */
export default async function NewTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: universityId } = await params;
  const university = await fetchUniversityDetailServer(universityId);

  if (!university) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow={`${university.name} · Períodos lectivos`}
        title="Nuevo período lectivo"
        subtitle="El identificador (label) se calcula solo a partir del año, número y cadencia."
      />
      <TermForm mode="create" universityId={universityId} />
    </div>
  );
}
