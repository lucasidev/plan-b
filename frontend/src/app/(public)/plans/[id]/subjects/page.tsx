import { notFound } from 'next/navigation';
import {
  CatalogBreadcrumb,
  CatalogTopbar,
  type CrumbItem,
  SubjectGrid,
} from '@/features/browse-catalog';
import {
  fetchCareersByUniversityServer,
  fetchPlanServer,
  fetchSubjectsByPlanServer,
  fetchUniversitiesServer,
} from '@/features/browse-catalog/api.server';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const plan = await fetchPlanServer(id);
  return { title: plan ? `Plan ${plan.year} · planb` : 'Plan de estudios · planb' };
}

/**
 * /plans/[id]/subjects (US-001). Última parada del catálogo: materias del plan, agrupadas por
 * año y término (`SubjectGrid`).
 *
 * `fetchPlanServer` hace doble trabajo: valida que el plan exista (null en 404 → `notFound()`,
 * igual que `fetchSubjectServer` en `view-subject/api.server.ts`) y resuelve `careerId` +
 * `universityId`, que son la única forma de armar el breadcrumb completo: no hay "get by id"
 * público para universidad ni para carrera, así que se matchean por id contra los listados
 * (`fetchUniversitiesServer` + `fetchCareersByUniversityServer`) que sí existen para otros
 * niveles del catálogo.
 */
export default async function PlanSubjectsPage({ params }: { params: Params }) {
  const { id } = await params;

  const plan = await fetchPlanServer(id);
  if (!plan) {
    notFound();
  }

  const [universities, careers, subjects] = await Promise.all([
    fetchUniversitiesServer(),
    fetchCareersByUniversityServer(plan.universityId),
    fetchSubjectsByPlanServer(id),
  ]);
  const university = universities.find((u) => u.id === plan.universityId);
  const career = careers.find((c) => c.id === plan.careerId);

  const breadcrumbItems: CrumbItem[] = [
    { label: 'Universidades', href: '/universities' },
    ...(university
      ? [{ label: university.name, href: `/universities/${university.slug}/careers` }]
      : []),
    ...(career ? [{ label: career.name, href: `/careers/${career.id}/plans` }] : []),
    { label: `Plan ${plan.year}` },
  ];

  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <CatalogBreadcrumb items={breadcrumbItems} />
        <header>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">
            {career?.name ?? 'Materias'}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
            Plan {plan.year}
          </h1>
        </header>
        <SubjectGrid subjects={subjects} />
      </main>
    </>
  );
}
