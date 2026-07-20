import { CatalogBreadcrumb, CatalogTopbar, PlanList } from '@/features/browse-catalog';
import { fetchPlansByCareerServer } from '@/features/browse-catalog/api.server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Planes de estudio · planb',
};

type Params = Promise<{ id: string }>;

/**
 * /careers/[id]/plans (US-001). El catálogo público no expone un "get career by id" (solo
 * `careers?universityId=`, que requiere ya saber la universidad), así que esta página no puede
 * resolver el nombre de la carrera ni de la universidad para el breadcrumb/header: el visitante
 * ya vio el nombre de la carrera en la lista de la que vino. TODO(US-001): si el backend suma
 * un endpoint para resolver carrera → universidad por id, completar el breadcrumb con
 * "{uni} / {carrera}" acá (mismo mecanismo que ya usa `plans/[id]/subjects`).
 *
 * `careerId` inexistente o inválido devuelve 200 + lista vacía (mismo comportamiento que
 * `ListCareerPlansEndpoint`): se renderiza el estado vacío de `PlanList`, no un 404.
 */
export default async function CareerPlansPage({ params }: { params: Params }) {
  const { id } = await params;
  const plans = await fetchPlansByCareerServer(id);

  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <CatalogBreadcrumb items={[{ label: 'Universidades', href: '/universities' }]} />
        <header>
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Catálogo</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight text-ink">
            Planes de estudio
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            Los planes históricos se conservan: puede que tu cursada esté bajo uno anterior al
            vigente.
          </p>
        </header>
        <PlanList plans={plans} />
      </main>
    </>
  );
}
