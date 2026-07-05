import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TeacherTable } from '@/features/manage-teachers';
import { fetchAdminTeachersServer } from '@/features/manage-teachers/api.server';

export const dynamic = 'force-dynamic';

/**
 * Listado del backoffice de docentes (US-063 admin). RSC: fetch server-side (gateado a rol admin) +
 * render de la tabla client. Las mutaciones refrescan esta RSC vía router.refresh() (ADR-0046).
 */
export default async function AdminTeachersPage() {
  const teachers = await fetchAdminTeachersServer();
  const activeCount = teachers.filter((t) => t.isActive).length;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow="Datos académicos"
        title="Docentes"
        subtitle={`${teachers.length} en el catálogo · ${activeCount} activos`}
        action={
          <Link
            href="/admin/teachers/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Nuevo docente
          </Link>
        }
      />
      <TeacherTable teachers={teachers} />
    </div>
  );
}
