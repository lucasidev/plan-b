import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import {
  fetchCareerDetailServer,
  fetchCareerPlansServer,
} from '@/features/manage-careers/api.server';
import { SubjectForm } from '@/features/manage-subjects';

export const dynamic = 'force-dynamic';

/** Alta de materia bajo un plan de estudios (US-062 admin). */
export default async function NewSubjectPage({
  params,
}: {
  params: Promise<{ id: string; careerId: string; planId: string }>;
}) {
  const { id: universityId, careerId, planId } = await params;

  const career = await fetchCareerDetailServer(careerId);
  if (!career || career.universityId !== universityId) {
    notFound();
  }
  const plans = await fetchCareerPlansServer(careerId);
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        eyebrow={`${career.name} · Plan ${plan.year}`}
        title="Nueva materia"
        subtitle="Alta en el plan. Las correlativas se cargan después, desde el listado de materias."
      />
      <SubjectForm mode="create" universityId={universityId} careerId={careerId} planId={planId} />
    </div>
  );
}
