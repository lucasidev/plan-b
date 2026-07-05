import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TeacherForm } from '@/features/manage-teachers';
import { fetchUniversitiesServer } from '@/features/manage-teachers/api.server';

export const dynamic = 'force-dynamic';

/** Alta de docente (US-063 admin). El select de universidad se puebla del catálogo público. */
export default async function NewTeacherPage() {
  const universities = await fetchUniversitiesServer();

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Docentes"
        title="Nuevo docente"
        subtitle="Alta en el catálogo. Después queda disponible para reseñas y comisiones."
      />
      <TeacherForm mode="create" universities={universities} />
    </div>
  );
}
