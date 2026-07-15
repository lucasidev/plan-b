import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UniversityForm } from '@/features/manage-universities';

export const dynamic = 'force-dynamic';

/** Alta de universidad (US-060 admin). */
export default function NewUniversityPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Universidades"
        title="Afiliar universidad"
        subtitle="Alta en el catálogo. Después queda disponible para carreras, materias y docentes."
      />
      <UniversityForm mode="create" />
    </div>
  );
}
