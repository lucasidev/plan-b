import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TeacherTable } from '@/features/manage-teachers';
import { fetchAdminTeachersServer } from '@/features/manage-teachers/api.server';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado del backoffice de docentes (US-063 admin). RSC: fetch server-side (gateado a rol admin) +
 * render de la tabla client. Las mutaciones refrescan esta RSC vía router.refresh() (ADR-0046).
 */
export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ universityId?: string }>;
}) {
  const { universityId } = await searchParams;
  const university = universityId ? await fetchUniversityDetailServer(universityId) : null;
  if (universityId && !university) notFound();
  const allTeachers = await fetchAdminTeachersServer();
  const teachers = universityId
    ? allTeachers.filter((t) => t.universityId === universityId)
    : allTeachers;
  const activeCount = teachers.filter((t) => t.isActive).length;

  return (
    <div className="mx-auto max-w-5xl">
      {university && (
        <Link href={`/admin/universities/${university.id}`} className="text-sm underline">
          Volver a {university.name}
        </Link>
      )}
      <AdminPageHeader
        eyebrow={university?.name ?? 'Catálogo académico'}
        title="Docentes"
        subtitle={`${teachers.length} en el catálogo · ${activeCount} activos`}
        action={
          <Link
            href={
              universityId
                ? `/admin/teachers/new?universityId=${universityId}`
                : '/admin/teachers/new'
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Nuevo docente
          </Link>
        }
      />
      <TeacherTable
        teachers={teachers}
        returnTo={universityId ? `/admin/teachers?universityId=${universityId}` : '/admin/teachers'}
      />
    </div>
  );
}
