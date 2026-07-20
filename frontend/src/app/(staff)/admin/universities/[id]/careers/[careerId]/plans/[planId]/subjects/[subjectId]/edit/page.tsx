import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import {
  fetchCareerDetailServer,
  fetchCareerPlansServer,
} from '@/features/manage-careers/api.server';
import { SubjectForm } from '@/features/manage-subjects';
import { fetchSubjectDetailServer } from '@/features/manage-subjects/api.server';

export const dynamic = 'force-dynamic';

/**
 * Edición de materia (US-062 admin). Solo activas: si está archivada, 404 (se reactiva desde el
 * listado, no se edita directo, mismo criterio que el edit de carrera).
 */
export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ id: string; careerId: string; planId: string; subjectId: string }>;
}) {
  const { id: universityId, careerId, planId, subjectId } = await params;

  const career = await fetchCareerDetailServer(careerId);
  if (!career || career.universityId !== universityId) {
    notFound();
  }
  const plans = await fetchCareerPlansServer(careerId);
  if (!plans.some((p) => p.id === planId)) {
    notFound();
  }

  const subject = await fetchSubjectDetailServer(planId, subjectId);
  if (!subject?.isActive) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow="Materias"
        title={`Editar: ${subject.name}`}
        subtitle="Los cambios se reflejan en el plan y en la ficha de la materia."
      />
      <SubjectForm
        mode="edit"
        universityId={universityId}
        careerId={careerId}
        planId={planId}
        subject={subject}
      />
    </div>
  );
}
