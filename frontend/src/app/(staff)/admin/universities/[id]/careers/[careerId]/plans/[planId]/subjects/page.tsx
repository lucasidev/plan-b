import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import {
  fetchCareerDetailServer,
  fetchCareerPlansServer,
} from '@/features/manage-careers/api.server';
import { PrerequisitesPanel, SubjectTable } from '@/features/manage-subjects';
import { prerequisiteQueries } from '@/features/manage-subjects/api';
import {
  fetchPrerequisitesByPlanServer,
  fetchSubjectsByPlanServer,
} from '@/features/manage-subjects/api.server';

export const dynamic = 'force-dynamic';

/**
 * Backoffice de materias de un plan de estudios + editor de correlativas (US-062 admin). RSC: valida
 * la cadena universidad → carrera → plan (la carrera tiene que pertenecer a la uni y el plan a la
 * carrera; ninguno de los dos lo valida el GET por id, mismo criterio que CareerDetailPage) y
 * prefetchea las materias (props directos: la tabla no necesita reactividad) + el grafo de
 * correlativas (TanStack Query, porque el panel lo muta).
 */
export default async function AdminSubjectsPage({
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

  const subjects = await fetchSubjectsByPlanServer(planId);

  const queryClient = new QueryClient();
  const prerequisitesOptions = prerequisiteQueries.forPlan(planId);
  await queryClient.prefetchQuery({
    queryKey: prerequisitesOptions.queryKey,
    queryFn: () => fetchPrerequisitesByPlanServer(planId),
  });

  const basePath = `/admin/universities/${universityId}/careers/${careerId}/plans/${planId}/subjects`;
  const activeCount = subjects.filter((s) => s.isActive).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/admin/universities/${universityId}/careers/${careerId}`}
        className="mb-3 inline-block text-[12px] text-ink-3 hover:text-ink"
      >
        ← Volver a {career.name}
      </Link>
      <AdminPageHeader
        eyebrow={`${career.name} · Plan ${plan.year}`}
        title="Materias"
        subtitle={`${subjects.length} en el plan · ${activeCount} activas`}
        action={
          <Link
            href={`${basePath}/new`}
            className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-ink bg-ink px-3.5 text-[12.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
          >
            + Materia
          </Link>
        }
      />
      <SubjectTable basePath={basePath} subjects={subjects} />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PrerequisitesPanelSkeleton />}>
          <PrerequisitesPanel planId={planId} subjects={subjects} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}

function PrerequisitesPanelSkeleton() {
  return (
    <div
      className="mt-6 rounded-lg border border-line bg-bg-card px-4 py-8 text-center text-[12.5px] text-ink-3"
      aria-busy="true"
    >
      Cargando correlativas…
    </div>
  );
}
