import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CommissionForm } from '@/features/manage-commissions';
import {
  fetchCommissionsBySubjectAndTermServer,
  fetchTeachersByUniversityServer,
} from '@/features/manage-commissions/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de comisión (US-093 admin). No hay GET de detalle de comisión por id en el backend: se
 * reconstruye el detalle buscando en el listado admin de materia + término (el único que expone
 * `notes`, ver comentario de `api.server.ts`) y filtrando por id. `subjectId`, `termId` y
 * `universityId` viajan en la URL desde la fila de la tabla (que ya los conoce): si faltan, o la
 * comisión no aparece en ese listado, es un link roto y se corta con 404.
 */
export default async function EditCommissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subjectId?: string; termId?: string; universityId?: string }>;
}) {
  const { id } = await params;
  const { subjectId, termId, universityId } = await searchParams;

  if (!subjectId || !termId || !universityId) {
    notFound();
  }

  const [commissions, teachers] = await Promise.all([
    fetchCommissionsBySubjectAndTermServer(subjectId, termId),
    fetchTeachersByUniversityServer(universityId),
  ]);
  const commission = commissions.find((c) => c.id === id);
  if (!commission) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        eyebrow="Comisiones"
        title={`Editar: ${commission.name}`}
        subtitle="Los cambios se reflejan en el catálogo público de la materia."
      />
      <CommissionForm
        mode="edit"
        universityId={universityId}
        termId={termId}
        commission={commission}
        teachers={teachers}
      />
    </div>
  );
}
