import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TeacherForm } from '@/features/manage-teachers';
import { fetchUniversitiesServer } from '@/features/manage-teachers/api.server';
import { sanitizeInternalRedirect } from '@/lib/internal-redirect';

export const dynamic = 'force-dynamic';

/** Alta de docente (US-063 admin). El select de universidad se puebla del catálogo público. */
export default async function NewTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ universityId?: string; from?: string }>;
}) {
  const { universityId, from } = await searchParams;
  const universities = await fetchUniversitiesServer();
  const initialUniversityId = universities.some((u) => u.id === universityId)
    ? universityId
    : undefined;
  const destination = sanitizeInternalRedirect(from);
  const returnTo = destination?.startsWith('/admin/chairs/')
    ? destination
    : initialUniversityId
      ? `/admin/teachers?universityId=${initialUniversityId}`
      : '/admin/teachers';

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Docentes"
        title="Nuevo docente"
        subtitle="Alta en el catálogo. Después queda disponible para integrar cátedras."
      />
      <TeacherForm
        mode="create"
        universities={
          destination?.startsWith('/admin/chairs/') && initialUniversityId
            ? universities.filter((u) => u.id === initialUniversityId)
            : universities
        }
        initialUniversityId={initialUniversityId}
        returnTo={returnTo}
      />
    </div>
  );
}
