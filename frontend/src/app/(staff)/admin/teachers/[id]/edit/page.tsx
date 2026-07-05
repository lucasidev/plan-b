import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { TeacherForm } from '@/features/manage-teachers';
import {
  fetchTeacherDetailServer,
  fetchUniversitiesServer,
} from '@/features/manage-teachers/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de docente (US-063 admin). Solo activos: el detalle se lee del GET público (trae
 * bio/photoUrl). Si no existe o está soft-deleted, 404 (los inactivos se reactivan desde el listado,
 * no se editan directo).
 */
export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teacher, universities] = await Promise.all([
    fetchTeacherDetailServer(id),
    fetchUniversitiesServer(),
  ]);

  if (!teacher?.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Docentes"
        title={`Editar: ${teacher.firstName} ${teacher.lastName}`}
        subtitle="Los cambios se reflejan en la página pública del docente."
      />
      <TeacherForm mode="edit" teacher={teacher} universities={universities} />
    </div>
  );
}
